export interface PlaneLabel {
  word: string
  pms: string
  color: string
}

export interface GalleryPlaneConfig {
  fallbackColor: string
  accentColor: string
  textureSrc: string
  position: { x: number; y: number }
  backgroundColor: string
  blob1Color: string
  blob2Color: string
  label: PlaneLabel
}

export const galleryPlaneData: GalleryPlaneConfig[] = [
  {
    fallbackColor: '#feca4f',
    accentColor: '#feca4f',
    textureSrc: 'https://res.cloudinary.com/eftrvjpx/image/upload/f_auto,q_auto/v1791315055/sabrang-2026/images/IMG_20261007_001834.jpg.jpg',
    position: { x: -0.9, y: 0 },
    backgroundColor: 'transparent',
    blob1Color: '#ffdf94',
    blob2Color: '#fce7c4',
    label: {
      word: 'VARUN',
      pms: 'PMS 135 C',
      color: '#2e2e2e',
    },
  },
  {
    fallbackColor: '#80455a',
    accentColor: '#80455a',
    textureSrc: 'https://res.cloudinary.com/eftrvjpx/image/upload/f_auto,q_auto/v1791315056/sabrang-2026/images/varun-jain.jpg',
    position: { x: 0.8, y: 0 },
    backgroundColor: 'transparent',
    blob1Color: '#d29a41',
    blob2Color: '#bb96af',
    label: {
      word: 'JAIN',
      pms: 'PMS 4985 C',
      color: '#2e2e2e',
    },
  },
  {
    fallbackColor: '#fa7b71',
    accentColor: '#fa7b71',
    textureSrc: 'https://res.cloudinary.com/eftrvjpx/image/upload/f_auto,q_auto/v1791315057/sabrang-2026/images/varun1.jpg',
    position: { x: -0.7, y: 0 },
    backgroundColor: 'transparent',
    blob1Color: '#f88b8d',
    blob2Color: '#cfbbdd',
    label: {
      word: 'LIVE',
      pms: 'PMS 170 C',
      color: '#f4f4f4',
    },
  },
  {
    fallbackColor: '#3c72c6',
    accentColor: '#3c72c6',
    textureSrc: 'https://res.cloudinary.com/eftrvjpx/image/upload/f_auto,q_auto/v1791315058/sabrang-2026/images/IMG_20261007_003518.jpg.jpg',
    position: { x: 1, y: 0 },
    backgroundColor: 'transparent',
    blob1Color: '#ffaa00',
    blob2Color: '#00e1ff',
    label: {
      word: 'SABRANG',
      pms: 'PMS 660 C',
      color: '#f4f4f4',
    },
  },
  {
    fallbackColor: '#fdd895',
    accentColor: '#fdd895',
    textureSrc: 'https://res.cloudinary.com/eftrvjpx/image/upload/f_auto,q_auto/v1791315053/sabrang-2026/images/footer_art.jpg',
    position: { x: -0.7, y: 0 },
    backgroundColor: 'transparent',
    blob1Color: '#fdd895',
    blob2Color: '#a5b599',
    label: {
      word: '2026',
      pms: 'PMS 7507 C',
      color: '#f4f4f4',
    },
  },
]
