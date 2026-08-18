import * as THREE from 'three';

export const TransitionShader = {
  uniforms: {
    uTextureA: { value: null },
    uTextureB: { value: null },
    uTransition: { value: 0.0 }, // 0 = A, 1 = B
    uOpacity: { value: 1.0 },
    uColor: { value: new THREE.Color(0xffffff) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uTextureA;
    uniform sampler2D uTextureB;
    uniform float uTransition;
    uniform float uOpacity;
    uniform vec3 uColor;

    varying vec2 vUv;

    void main() {
      vec4 texelA = texture2D(uTextureA, vUv);
      vec4 texelB = texture2D(uTextureB, vUv);
      
      // Basic linear mix for now, can be improved with noise/dissolve later
      vec4 finalColor = mix(texelA, texelB, uTransition);
      
      gl_FragColor = vec4(finalColor.rgb * uColor, finalColor.a * uOpacity);
    }
  `
};

export function createTransitionMaterial(textureA, textureB, options = {}) {
  const uniforms = THREE.UniformsUtils.clone(TransitionShader.uniforms);
  uniforms.uTextureA.value = textureA;
  uniforms.uTextureB.value = textureB;
  uniforms.uTransition.value = 0.0;
  
  if (options.opacity !== undefined) uniforms.uOpacity.value = options.opacity;
  
  return new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: TransitionShader.vertexShader,
    fragmentShader: TransitionShader.fragmentShader,
    transparent: options.transparent || false,
    depthWrite: options.depthWrite !== undefined ? options.depthWrite : true,
    depthTest: options.depthTest !== undefined ? options.depthTest : true,
    blending: options.blending || THREE.NormalBlending,
    side: options.side || THREE.FrontSide
  });
}
