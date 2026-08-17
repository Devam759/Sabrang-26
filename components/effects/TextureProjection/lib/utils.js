import { createNoise2D, createNoise3D, createNoise4D } from 'simplex-noise'
import Poisson from 'poisson-disk-sampling'
import { mapRange } from 'canvas-sketch-util/math'

// wrapper with processing-like api of the library simplex-noise
const noise2D = createNoise2D()
const noise3D = createNoise3D()
const noise4D = createNoise4D()

// Simple Seeded PRNG (Mulberry32)
export function prng(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  let a = (function () {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return (h ^= h >>> 16) >>> 0;
  })();
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function noise(...args) {
  switch (args.length) {
    case 1:
      return noise2D(0, args[0])
    case 2:
      return noise2D(args[0], args[1])
    case 3:
      return noise3D(args[0], args[1], args[2])
    case 4:
      return noise4D(args[0], args[1], args[2], args[3])
    default:
      throw new Error(`Invalid number of arguments passed to the noise() function`)
  }
}

// https://bl.ocks.org/mbostock/dbb02448b0f93e4c82c3
export function poisson(range, minRadius, maxRadius) {
  // the poisson-disk-sampling library doesn't work well
  // with small numbers
  const scale = n => n * 100
  const scaleInvert = n => n / 100

  const rangeScaled = range.map(scale)
  return new Poisson({
    shape: rangeScaled,
    minDistance: minRadius,
    maxDistance: maxRadius,
    tries: 10
  }).fill().map(p => p.map(scaleInvert))
}

// like mapRange, but accepts also a middle value
// this is done by default with d3.scaleLinear
export function mapRangeTriple(
  value,
  inputMin,
  inputMiddle,
  inputMax,
  outputMin,
  outputMiddle,
  outputMax,
  clamp = false
) {
  if (inputMin <= value && value < inputMiddle) {
    return mapRange(value, inputMin, inputMiddle, outputMin, outputMiddle, clamp)
  } else {
    return mapRange(value, inputMiddle, inputMax, outputMiddle, outputMax, clamp)
  }
}

// print the time of execution of a function in the console
export function timed(fn, label) {
  return (...args) => {
    console.time(`⏱${label}`)
    const ret = fn(...args)
    console.timeEnd(`⏱${label}`)
    return ret
  }
}

//  Impulse function from Iñigo Quiles
//  https://www.iquilezles.org/www/articles/functions/functions.htm
function impulse(x, strength) {
  const h = strength * x
  return h * Math.exp(1.0 - h)
}

// like impulse, but repeated
export function impulseMultiple(x, strength, interval) {
  return impulse((x % interval), strength)
}

// https://en.wikipedia.org/wiki/Damped_sine_wave
export function dampedSin(x, attenuation, frequency, offset) {
  return Math.exp(-x * attenuation) * Math.cos(2 * Math.PI * x * frequency + offset)
}
