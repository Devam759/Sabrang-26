import pMap from 'p-map'
import loadImage from 'image-promise'
import loadTexture from './loadTexture'

class AssetManager {
  #queue = []
  #cache = {}

  queue({ url, type, ...options }) {
    if (!url) throw new TypeError('Must specify a URL or opt.url for AssetManager.queue()')
    if (!this._getQueued(url)) {
      this.#queue.push({ url, type: type || 'image', ...options })
    }
    return url
  }

  _getQueued(url) {
    return this.#queue.find(item => item.url === url)
  }

  get = url => {
    if (!url) throw new TypeError('Must specify an URL for AssetManager.get()')
    if (!(url in this.#cache)) {
      throw new Error(`The asset ${url} is not in the loaded files.`)
    }
    return this.#cache[url]
  }

  async loadSingle({ renderer, ...item }) {
    try {
      this.#cache[item.url] = await loadTexture(item.url, { renderer, ...item })
      return item.url
    } catch (err) {
      delete this.#cache[item.url]
      console.error(`Could not load ${item.url}:\n${err}`)
    }
  }

  async load({ renderer } = {}) {
    const queue = this.#queue.slice()
    this.#queue.length = 0

    await pMap(queue, item => this.loadSingle({ renderer, ...item }), {
      concurrency: 10,
    })
  }
}

export default new AssetManager()
