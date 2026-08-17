import * as THREE from 'three'
import assets from '../lib/AssetManager'

export class Slides extends THREE.Group {
  constructor(webgl, options) {
    super(options)
    this.webgl = webgl
    this.options = options
    this.slideIndex = 0
    this.isRunning = true
    this.isTransitioning = false
    this.timeInState = 0
    
    // Configurable timings matching the prompt
    this.TIMINGS = {
      FORMING: 1.8,
      HOLD: 1.5,
      BREATHING: 3.0,
      FRACTURING: 0.8,
      DISINTEGRATING: 1.3,
      TEXTURE_MORPH: 0.6,
      RECONSTRUCTING: 1.8
    };

    const { firstImage, otherImages, Slide } = this.options

    // Load remaining images
    this.textures = [assets.get(firstImage)];
    
    // We already preloaded some in the wrapper, but let's make sure they are in order
    otherImages.forEach(image => {
      assets.loadSingle({
        url: image,
        type: 'texture',
        renderer: webgl.renderer,
      }).then(img => {
        this.textures.push(assets.get(img));
      })
    })

    // Create exactly ONE instance of SlideNoise to save GPU memory
    this.slide = new Slide(this.webgl, { 
      textureA: this.textures[0],
      textureB: this.textures[0] 
    })
    this.add(this.slide)

    // Visibility handling
    this.handleVisibility = () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    };
    window.addEventListener('visibilitychange', this.handleVisibility);
    
    // Start initial state
    this.slide.setState('FORMING');
  }

  next() {
    if (this.isTransitioning) return;
    this.pauseAutoplayTemporarily();
    this.slideIndex = (this.slideIndex + 1) % this.textures.length;
    this.triggerTransition();
  }

  previous() {
    if (this.isTransitioning) return;
    this.pauseAutoplayTemporarily();
    this.slideIndex = (this.slideIndex - 1 + this.textures.length) % this.textures.length;
    this.triggerTransition();
  }
  
  pauseAutoplayTemporarily() {
    this.isInterrupted = true;
    clearTimeout(this.interruptTimeout);
    this.interruptTimeout = setTimeout(() => {
      this.isInterrupted = false;
    }, 6000);
  }

  pause() {
    this.isRunning = false;
  }

  resume() {
    this.isRunning = true;
  }
  
  triggerTransition() {
    if (this.slide.currentState === 'HOLD' || this.slide.currentState === 'BREATHING') {
      this.timeInState = 0;
      this.slide.setState('FRACTURING');
      
      // Prepare texture B
      const nextTex = this.textures[this.slideIndex];
      if (nextTex) {
        this.slide.setTextureB(nextTex);
      }
    }
  }

  update(dt, time) {
    if (!this.isRunning || this.textures.length < 2) return;
    
    // Do not auto-advance if user recently interacted
    if (this.isInterrupted) return;

    this.timeInState += dt;
    const state = this.slide.currentState;

    if (state === 'FORMING' && this.timeInState >= this.TIMINGS.FORMING) {
      this.timeInState = 0;
      this.slide.setState('HOLD');
    } 
    else if (state === 'HOLD' && this.timeInState >= this.TIMINGS.HOLD) {
      this.timeInState = 0;
      this.slide.setState('BREATHING');
    }
    else if (state === 'BREATHING' && this.timeInState >= this.TIMINGS.BREATHING) {
      this.timeInState = 0;
      this.slideIndex = (this.slideIndex + 1) % this.textures.length;
      
      const nextTex = this.textures[this.slideIndex];
      if (nextTex) this.slide.setTextureB(nextTex);
      
      this.slide.setState('FRACTURING');
    }
    else if (state === 'FRACTURING' && this.timeInState >= this.TIMINGS.FRACTURING) {
      this.timeInState = 0;
      this.slide.setState('DISINTEGRATING');
    }
    else if (state === 'DISINTEGRATING' && this.timeInState >= this.TIMINGS.DISINTEGRATING) {
      this.timeInState = 0;
      this.slide.setState('TEXTURE_MORPH');
    }
    else if (state === 'TEXTURE_MORPH' && this.timeInState >= this.TIMINGS.TEXTURE_MORPH) {
      this.timeInState = 0;
      this.slide.applyTextureMorph();
      this.slide.setState('RECONSTRUCTING');
    }
    else if (state === 'RECONSTRUCTING' && this.timeInState >= this.TIMINGS.RECONSTRUCTING) {
      this.timeInState = 0;
      this.slide.setState('HOLD');
    }
  }

  dispose() {
    window.removeEventListener('visibilitychange', this.handleVisibility);
    clearTimeout(this.interruptTimeout);
  }
}
