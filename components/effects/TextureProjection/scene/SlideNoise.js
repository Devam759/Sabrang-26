import * as THREE from 'three'
import { clamp01, lerp } from 'canvas-sketch-util/math'
import { prng } from '../lib/utils'
import { createTransitionMaterial } from './TransitionShader'

// Configuration
// Core photo grid dimensions
const CORE_COLS = 12;
const CORE_ROWS = 8;
const OUTER_COUNT = 24;

export class SlideNoise extends THREE.Group {
  constructor(webgl, { textureA, textureB, ...options }) {
    super(options)
    this.webgl = webgl
    this.time = 0;
    
    this.currentState = 'LOADING';
    this.textureA = textureA;
    this.textureB = textureB;
    this.globalTransition = 0;
    
    // Calculate the full billboard dimensions (how big the photo should be in world space)
    const imgAspect = textureA.image.naturalWidth / textureA.image.naturalHeight;
    const fovRad = THREE.MathUtils.degToRad(webgl.camera.fov / 2);
    const visibleHeight = webgl.camera.position.z * Math.tan(fovRad) * 2;
    const visibleWidth = visibleHeight * (window.innerWidth / window.innerHeight);

    // Photo should fill a substantial portion of the viewport
    if (imgAspect >= 1) {
      this.width = Math.min(visibleWidth * 0.85, visibleHeight * imgAspect * 0.85);
      this.height = this.width / imgAspect;
    } else {
      this.height = visibleHeight * 0.85;
      this.width = this.height * imgAspect;
    }

    const tileW = this.width / CORE_COLS;
    const tileH = this.height / CORE_ROWS;

    // =========================================================
    // LAYER 1: CORE PHOTO GRID (96 tiles)
    // =========================================================
    this.corePoints = [];
    this.coreMeshes = [];

    // Base material for the core — uses TransitionShader
    this.coreMaterial = createTransitionMaterial(this.textureA, this.textureB, {
      transparent: false,
      depthWrite: true,
      depthTest: true,
    });

    // Group to hold all core tiles
    this.coreGroup = new THREE.Group();
    this.coreGroup.renderOrder = 1; 
    this.add(this.coreGroup);

    for (let row = 0; row < CORE_ROWS; row++) {
      for (let col = 0; col < CORE_COLS; col++) {
        // Exact world position (centered at origin)
        const x = -this.width / 2 + (col + 0.5) * tileW;
        const y =  this.height / 2 - (row + 0.5) * tileH;

        // Exact UV coordinates for this tile's portion of the image
        const u0 = col / CORE_COLS;
        const u1 = (col + 1) / CORE_COLS;
        const v0 = 1 - (row + 1) / CORE_ROWS; // V is flipped in Three.js (0=bottom, 1=top)
        const v1 = 1 - row / CORE_ROWS;

        // Create a PlaneGeometry and set its UVs to show only this tile's region
        const geo = new THREE.PlaneGeometry(tileW, tileH, 1, 1);
        const uvAttr = geo.attributes.uv;
        uvAttr.setXY(0, u0, v1);
        uvAttr.setXY(1, u1, v1);
        uvAttr.setXY(2, u0, v0);
        uvAttr.setXY(3, u1, v0);
        uvAttr.needsUpdate = true;
        
        // Each tile gets its own material clone so it can transition independently
        const mat = this.coreMaterial.clone();

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, 0);
        mesh.rotation.set(0, 0, 0);
        mesh.renderOrder = 2;
        this.coreGroup.add(mesh);
        this.coreMeshes.push(mesh);

        // Distance from center for radial wave effects
        const distFromCenter = Math.sqrt(
          Math.pow((col - CORE_COLS / 2) / (CORE_COLS / 2), 2) + 
          Math.pow((row - CORE_ROWS / 2) / (CORE_ROWS / 2), 2)
        );

        this.corePoints.push({
          gridX: x,
          gridY: y,
          col, row,
          zone: 'core',
          distFromCenter,
          mesh
        });
      }
    }

    // =========================================================
    // LAYER 2 & 3: TRANSITION & ATMOSPHERIC SHARDS (24 tiles)
    // =========================================================
    this.outerPoints = [];

    this.outerMaterial = createTransitionMaterial(this.textureA, this.textureB, {
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide
    });

    this.outerGroup = new THREE.Group();
    this.outerGroup.renderOrder = 0; // Render behind core
    this.add(this.outerGroup);

    const random = prng('sabrang2026_init');

    for (let s = 0; s < OUTER_COUNT; s++) {
      const side = Math.floor(random() * 4); // 0=top, 1=right, 2=bottom, 3=left
      let targetX, targetY;
      const margin = tileW * 1.5;
      
      switch (side) {
        case 0: // top
          targetX = (random() - 0.5) * this.width * 1.3;
          targetY = this.height / 2 + margin + random() * this.height * 0.4;
          break;
        case 1: // right
          targetX = this.width / 2 + margin + random() * this.width * 0.4;
          targetY = (random() - 0.5) * this.height * 1.3;
          break;
        case 2: // bottom
          targetX = (random() - 0.5) * this.width * 1.3;
          targetY = -this.height / 2 - margin - random() * this.height * 0.4;
          break;
        case 3: // left
          targetX = -this.width / 2 - margin - random() * this.width * 0.4;
          targetY = (random() - 0.5) * this.height * 1.3;
          break;
      }

      const targetZ = (random() - 0.5) * 3; // Z depth spread
      const scaleF = 0.4 + random() * 0.9;
      const w = tileW * scaleF;
      const h = tileH * scaleF;
      const opacity = 0.15 + random() * 0.45;

      const uvCol = Math.floor(random() * CORE_COLS);
      const uvRow = Math.floor(random() * CORE_ROWS);
      const ou0 = uvCol / CORE_COLS;
      const ou1 = (uvCol + 1) / CORE_COLS;
      const ov0 = 1 - (uvRow + 1) / CORE_ROWS;
      const ov1 = 1 - uvRow / CORE_ROWS;

      const geo = new THREE.PlaneGeometry(w, h, 1, 1);
      const uvAttr = geo.attributes.uv;
      uvAttr.setXY(0, ou0, ov1);
      uvAttr.setXY(1, ou1, ov1);
      uvAttr.setXY(2, ou0, ov0);
      uvAttr.setXY(3, ou1, ov0);
      uvAttr.needsUpdate = true;

      const mat = this.outerMaterial.clone();
      mat.uniforms.uOpacity.value = opacity;
      
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 0;
      this.outerGroup.add(mesh);

      this.outerPoints.push({
        targetX, targetY, targetZ,
        targetRotX: (random() - 0.5) * 0.3,
        targetRotY: (random() - 0.5) * 0.3,
        targetRotZ: (random() - 0.5) * 0.15,
        zone: 'outer',
        distFromCenter: 1.5 + random(), // Act like outer ring
        opacity,
        mesh
      });
    }

    this.allPoints = [...this.corePoints, ...this.outerPoints];
    
    // Prepare scattered positions for initial load
    this.prepareFracture(999);
    
    // Instantly set them to scattered positions
    this.allPoints.forEach(p => {
      p.currentX = p.scatterX;
      p.currentY = p.scatterY;
      p.currentZ = p.scatterZ;
      p.currentRotX = p.scatterRotX;
      p.currentRotY = p.scatterRotY;
      p.currentRotZ = p.scatterRotZ;
      p.mesh.position.set(p.currentX, p.currentY, p.currentZ);
      p.mesh.rotation.set(p.currentRotX, p.currentRotY, p.currentRotZ);
    });
    
    // Add particles
    this.initParticles();
  }
  
  initParticles() {
    this.particleCount = 200;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    
    for (let i = 0; i < this.particleCount; i++) {
      positions[i*3] = (Math.random() - 0.5) * this.width * 2;
      positions[i*3+1] = (Math.random() - 0.5) * this.height * 2;
      positions[i*3+2] = (Math.random() - 0.5) * 5;
      
      // Default to subtle cyan/magenta mix
      if (Math.random() > 0.5) {
        colors[i*3] = 0.0; colors[i*3+1] = 0.8; colors[i*3+2] = 1.0; // Cyan
      } else {
        colors[i*3] = 1.0; colors[i*3+1] = 0.0; colors[i*3+2] = 0.8; // Magenta
      }
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const mat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(geo, mat);
    this.particles.renderOrder = 3;
    this.add(this.particles);
  }

  prepareFracture(seed) {
    const random = prng('sabrang2026_frac_' + seed);
    
    this.allPoints.forEach(p => {
      const isCore = p.zone === 'core';
      
      // Determine scattered positions and rotations
      p.scatterX = isCore ? p.gridX + (random() - 0.5) * this.width * 1.5 : (random() - 0.5) * this.width * 2.5;
      p.scatterY = isCore ? p.gridY + (random() - 0.5) * this.height * 1.5 : (random() - 0.5) * this.height * 2.5;
      p.scatterZ = (random() - 0.5) * 6 - 1; // -4 to +2
      
      // Restrict rotation so it feels like floating photos, not a tornado
      p.scatterRotX = (random() - 0.5) * Math.PI * 0.15;
      p.scatterRotY = (random() - 0.5) * Math.PI * 0.15;
      p.scatterRotZ = (random() - 0.5) * Math.PI * 0.25;
      
      // Determine physical velocities for the fracture explosion
      p.velX = (p.scatterX - (isCore ? p.gridX : p.targetX)) * 2.0;
      p.velY = (p.scatterY - (isCore ? p.gridY : p.targetY)) * 2.0;
      p.velZ = p.scatterZ * 2.0;
      
      // Radial delay: center breaks first
      p.delay = p.distFromCenter * 0.15 + (random() * 0.1); 
    });
  }

  setState(newState) {
    this.currentState = newState;
    this.stateTimer = 0;
    
    if (newState === 'FRACTURING') {
      // Trigger CSS class for SABRANG text micro-scale reaction
      document.body.classList.add('hero-fracturing');
      setTimeout(() => document.body.classList.remove('hero-fracturing'), 150);
      
      // Burst particles
      this.particles.material.opacity = 0.8;
      
      // Calculate deterministic fracture for this slide index
      this.prepareFracture(this.parent?.slideIndex || 0);
      
      // Setup current tracking positions
      this.allPoints.forEach(p => {
        const isCore = p.zone === 'core';
        p.currentX = isCore ? p.gridX : p.targetX;
        p.currentY = isCore ? p.gridY : p.targetY;
        p.currentZ = isCore ? 0 : p.targetZ;
        p.currentRotX = isCore ? 0 : p.targetRotX;
        p.currentRotY = isCore ? 0 : p.targetRotY;
        p.currentRotZ = isCore ? 0 : p.targetRotZ;
      });
    }
    
    if (newState === 'TEXTURE_MORPH') {
      this.globalTransition = 0; // Starts at 0 (Texture A)
    }
  }

  setTextureB(tex) {
    this.textureB = tex;
    this.allPoints.forEach(p => {
      p.mesh.material.uniforms.uTextureB.value = tex;
    });
  }

  applyTextureMorph() {
    // End of TEXTURE_MORPH state -> Lock in B as A
    this.textureA = this.textureB;
    this.globalTransition = 0;
    
    this.allPoints.forEach(p => {
      const u = p.mesh.material.uniforms;
      u.uTextureA.value = this.textureA;
      u.uTransition.value = 0.0;
    });
  }

  update(dt, time) {
    this.time = time;
    this.stateTimer += dt;
    
    if (this.currentState === 'FORMING' || this.currentState === 'RECONSTRUCTING') {
      this.allPoints.forEach(p => {
        // Delay based on distance from center (radial wave)
        const localTime = Math.max(0, this.stateTimer - (p.distFromCenter * 0.1));
        const duration = 1.2;
        const progress = clamp01(localTime / duration);
        
        // Power3 easing out
        const ease = 1 - Math.pow(1 - progress, 3);
        
        const isCore = p.zone === 'core';
        const targetX = isCore ? p.gridX : p.targetX;
        const targetY = isCore ? p.gridY : p.targetY;
        const targetZ = isCore ? 0 : p.targetZ;
        const targetRotX = isCore ? 0 : p.targetRotX;
        const targetRotY = isCore ? 0 : p.targetRotY;
        const targetRotZ = isCore ? 0 : p.targetRotZ;
        
        p.currentX = lerp(p.scatterX, targetX, ease);
        p.currentY = lerp(p.scatterY, targetY, ease);
        p.currentZ = lerp(p.scatterZ, targetZ, ease);
        p.currentRotX = lerp(p.scatterRotX, targetRotX, ease);
        p.currentRotY = lerp(p.scatterRotY, targetRotY, ease);
        p.currentRotZ = lerp(p.scatterRotZ, targetRotZ, ease);
        
        p.mesh.position.set(p.currentX, p.currentY, p.currentZ);
        p.mesh.rotation.set(p.currentRotX, p.currentRotY, p.currentRotZ);
      });
      
      // Fade out particles
      if (this.particles.material.opacity > 0) {
        this.particles.material.opacity = Math.max(0, this.particles.material.opacity - dt * 0.5);
      }
    }
    else if (this.currentState === 'HOLD') {
      // ABSOLUTE GRID RULE: Must be mathematically locked.
      this.allPoints.forEach(p => {
        if (p.zone === 'core') {
          p.mesh.position.set(p.gridX, p.gridY, 0);
          p.mesh.rotation.set(0, 0, 0);
        } else {
          // Outer shards have extremely subtle atmospheric floating
          p.mesh.position.set(
            p.targetX + Math.sin(time * 0.3 + p.distFromCenter) * 0.05,
            p.targetY + Math.cos(time * 0.25 + p.distFromCenter) * 0.05,
            p.targetZ
          );
        }
      });
      this.particles.material.opacity = 0;
    }
    else if (this.currentState === 'BREATHING') {
      // Lock grid, apply very subtle breathing only via position manipulation (no scaling of parent)
      // This protects the UVs and edges.
      this.allPoints.forEach(p => {
        if (p.zone === 'core') {
          p.mesh.position.set(p.gridX, p.gridY, 0);
          p.mesh.rotation.set(0, 0, 0);
        } else {
          p.mesh.position.set(
            p.targetX + Math.sin(time * 0.3 + p.distFromCenter) * 0.05,
            p.targetY + Math.cos(time * 0.25 + p.distFromCenter) * 0.05,
            p.targetZ
          );
        }
      });
    }
    else if (this.currentState === 'FRACTURING' || this.currentState === 'DISINTEGRATING') {
      // Physical explosion
      this.allPoints.forEach(p => {
        if (this.stateTimer > p.delay) {
          // Apply velocity and damping
          p.currentX += p.velX * dt;
          p.currentY += p.velY * dt;
          p.currentZ += p.velZ * dt;
          
          p.currentRotX = lerp(p.currentRotX, p.scatterRotX, dt * 5);
          p.currentRotY = lerp(p.currentRotY, p.scatterRotY, dt * 5);
          p.currentRotZ = lerp(p.currentRotZ, p.scatterRotZ, dt * 5);
          
          // Damping
          p.velX *= 0.92;
          p.velY *= 0.92;
          p.velZ *= 0.92;
          
          p.mesh.position.set(p.currentX, p.currentY, p.currentZ);
          p.mesh.rotation.set(p.currentRotX, p.currentRotY, p.currentRotZ);
        }
      });
      
      // Animate particles outward
      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < this.particleCount; i++) {
        // Expand outwards slowly
        positions[i*3] *= 1.0 + (dt * 0.5);
        positions[i*3+1] *= 1.0 + (dt * 0.5);
        positions[i*3+2] += (Math.random() - 0.5) * 0.1;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
      this.particles.material.opacity = Math.max(0, this.particles.material.opacity - dt * 0.2);
    }
    else if (this.currentState === 'TEXTURE_MORPH') {
      // Slowly advance global transition 0 -> 1
      this.globalTransition = Math.min(1.0, this.globalTransition + dt * 2.5);
      
      this.allPoints.forEach(p => {
        // Radial wipe effect
        const localTransition = clamp01((this.globalTransition * 1.5) - (p.distFromCenter * 0.2));
        
        // Smoothstep for non-linear transition
        const smoothT = localTransition * localTransition * (3 - 2 * localTransition);
        
        p.mesh.material.uniforms.uTransition.value = smoothT;
        
        // Keep drifting slowly
        p.currentX += p.velX * dt;
        p.currentY += p.velY * dt;
        p.currentZ += p.velZ * dt;
        p.mesh.position.set(p.currentX, p.currentY, p.currentZ);
      });
    }
  }
}
