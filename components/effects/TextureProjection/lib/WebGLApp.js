import * as THREE from 'three'

export default class WebGLApp {
  #updateListeners = []
  #rafID
  #lastTime

  constructor({
    background = '#000',
    backgroundAlpha = 0,
    fov = 45,
    near = 0.01,
    far = 100,
    ...options
  } = {}) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      ...options,
    })

    this.renderer.sortObjects = false
    this.canvas = this.renderer.domElement

    this.renderer.setClearColor(background, backgroundAlpha)

    this.controls = {
      color: '#8b5cf6',
      displacement: 1.1,
      delayFactor: 0.7,
      turbulence: {
        speed: 1.3,
        frequency: 0.8,
        amplitude: 0.25,
        attenuation: 1.3,
      },
    }

    this.maxPixelRatio = options.maxPixelRatio || 2
    this.maxDeltaTime = options.maxDeltaTime || 1 / 30

    this.camera = new THREE.PerspectiveCamera(fov, 1, near, far)
    this.scene = new THREE.Scene()
    this.gl = this.renderer.getContext()

    this.time = 0
    this.isRunning = false
    this.#lastTime = performance.now()
    this.#rafID = null

    if (!options.width && !options.height) {
      window.addEventListener('resize', this.resize)
      window.addEventListener('orientationchange', this.resize)
    }

    this.resize({ width: options.width, height: options.height })
  }

  resize = ({ width, height, pixelRatio } = {}) => {
    this.width = width || window.innerWidth
    this.height = height || window.innerHeight
    this.pixelRatio = pixelRatio || Math.min(this.maxPixelRatio, window.devicePixelRatio)

    this.renderer.setPixelRatio(this.pixelRatio)
    this.renderer.setSize(this.width, this.height)

    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.traverse('onResize')
  }

  update = (dt, time) => {
    this.traverse('update', dt, time)
    for (let i = 0; i < this.#updateListeners.length; i++) {
      this.#updateListeners[i](dt, time)
    }
  }

  onUpdate(fn) {
    this.#updateListeners.push(fn)
  }

  draw = () => {
    this.renderer.render(this.scene, this.camera)
  }

  start = () => {
    if (this.isRunning) return
    this.isRunning = true
    this.#rafID = requestAnimationFrame(this.animate)
  }

  stop = () => {
    if (!this.isRunning) return
    this.isRunning = false
    cancelAnimationFrame(this.#rafID)
  }

  animate = (now) => {
    if (!this.isRunning) return
    this.#rafID = requestAnimationFrame(this.animate)

    let dt = (now - this.#lastTime) / 1000
    // Throttle to 30fps to leave CPU/GPU headroom for smooth GSAP scrolling
    if (dt < 1 / 30) return

    this.#lastTime = now

    if (dt > this.maxDeltaTime) {
      dt = this.maxDeltaTime
    }

    this.time += dt

    this.update(dt, this.time)
    this.draw()
  }

  traverse = (fn, ...args) => {
    this.scene.traverse((child) => {
      if (typeof child[fn] === 'function') {
        child[fn](...args)
      }
    })
  }
}
