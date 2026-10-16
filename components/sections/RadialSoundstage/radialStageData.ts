export type HapticStyle = 'subbass' | 'electro' | 'acoustic'

export interface ArtistTrack {
  title: string
  movieOrAlbum?: string
  year: string
  highlight?: string
  spotifyUrl?: string
}

export interface RadialArtist {
  id: string
  day: string
  dayNumber: number
  date: string
  dateShort: string
  artistName: string
  firstName: string
  lastName: string
  suffix?: string
  displayName: string
  headlineWord: string
  stage: string
  stageTitle: string
  image: string
  instagramHandle: string
  instagramUrl: string
  galleryImages: string[]
  topTracks?: ArtistTrack[]
  angle: number // 0, 120, 240
  bpm: number
  atmosphericGlow: string
  atmosphericAccent: string
  hapticType: HapticStyle
  sonicWaveSpeed: number
  sonicTurbulence: number
}

export const RADIAL_ARTISTS: RadialArtist[] = [
  {
    id: 'bassworm',
    day: '01',
    dayNumber: 1,
    date: '23 OCTOBER 2026',
    dateShort: '23 OCT',
    artistName: 'DJ BASSWORM',
    firstName: 'DJ',
    lastName: 'BASSWORM',
    suffix: '',
    displayName: 'BASSWORM',
    headlineWord: 'BASSWORM',
    stage: 'MAIN ARENA',
    stageTitle: 'SEISMIC SUB-BASS ARENA',
    image: '/images/artists/live/bassworm-streetwear.jpg',
    instagramHandle: '@djbassworm',
    instagramUrl: 'https://instagram.com/djbassworm',
    galleryImages: [
      '/images/artists/live/bassworm-streetwear.jpg',
      '/images/artists/live/bassworm-suit.jpg',
      '/images/artists/live/bassworm-stage.jpg',
      '/images/artists/live/bassworm-rave.jpg',
    ],
    angle: 0,
    bpm: 140,
    atmosphericGlow: 'rgba(255, 30, 45, 0.18)', // Iconic Crimson Red Rave Stage glow
    atmosphericAccent: 'rgba(255, 60, 75, 0.7)',
    hapticType: 'subbass',
    sonicWaveSpeed: 1.4,
    sonicTurbulence: 1.35,
  },
  {
    id: 'suitup',
    day: '02',
    dayNumber: 2,
    date: '24 OCTOBER 2026',
    dateShort: '24 OCT',
    artistName: 'DJ SUITUP',
    firstName: 'DJ',
    lastName: 'SUITUP',
    suffix: '',
    displayName: 'SUITUP',
    headlineWord: 'SUITUP',
    stage: 'MAIN ARENA',
    stageTitle: 'HIGH-VOLTAGE ELECTRO STAGE',
    image: '/images/artists/live/suitup-profile.jpg',
    instagramHandle: '@djsuitup',
    instagramUrl: 'https://instagram.com/djsuitup',
    galleryImages: [
      '/images/artists/live/suitup-profile.jpg',
      '/images/artists/live/suitup-neon.jpg',
      '/images/artists/live/suitup-console.jpg',
      '/images/artists/live/suitup-stairs.jpg',
    ],
    angle: 120,
    bpm: 128,
    atmosphericGlow: 'rgba(50, 140, 255, 0.18)', // Electric Cyan / Laser Blue Stage glow
    atmosphericAccent: 'rgba(80, 170, 255, 0.65)',
    hapticType: 'electro',
    sonicWaveSpeed: 1.15,
    sonicTurbulence: 1.0,
  },
  {
    id: 'varun-jain',
    day: '03',
    dayNumber: 3,
    date: '25 OCTOBER 2026',
    dateShort: '25 OCT',
    artistName: 'VARUN JAIN',
    firstName: 'VARUN',
    lastName: 'JAIN',
    suffix: '',
    displayName: 'VARUN JAIN',
    headlineWord: 'VARUN JAIN',
    stage: 'AMPHITHEATRE',
    stageTitle: 'AMPHITHEATRE GRAND FINALE',
    image: '/images/artists/live/varun-live.webp',
    instagramHandle: '@varun_wave',
    instagramUrl: 'https://instagram.com/varun_wave',
    galleryImages: [
      '/images/artists/live/varun-live.webp',
      '/images/artists/live/varun-profile.jpg',
      '/images/artists/live/varun-band.jpg',
      '/images/artists/live/varun-acoustic.jpg',
    ],
    topTracks: [
      {
        title: 'Tere Vaaste',
        movieOrAlbum: 'Zara Hatke Zara Bachke',
        year: '2023',
        highlight: '500M+ Views',
        spotifyUrl: 'https://open.spotify.com/track/46hzNOUOAlivuCZZ0wE3zi',
      },
      {
        title: 'Tumhare Hi Rahenge Hum',
        movieOrAlbum: 'Stree 2',
        year: '2024',
        highlight: 'Blockbuster Hit',
        spotifyUrl: 'https://open.spotify.com/track/5u0w3w916GZ2qQk419dFrV',
      },
      {
        title: 'Tum Se',
        movieOrAlbum: 'TBMAUJ',
        year: '2024',
        highlight: 'Romantic Anthem',
        spotifyUrl: 'https://open.spotify.com/search/Tum%20Se%20Varun%20Jain',
      },
      {
        title: 'Kudmayi',
        movieOrAlbum: 'RARKPK',
        year: '2023',
        highlight: 'Soulful Ballad',
        spotifyUrl: 'https://open.spotify.com/search/Kudmayi%20Varun%20Jain',
      },
    ],
    angle: 240,
    bpm: 118,
    atmosphericGlow: 'rgba(255, 215, 150, 0.15)', // Molten Champagne Starlight
    atmosphericAccent: 'rgba(255, 225, 170, 0.6)',
    hapticType: 'acoustic',
    sonicWaveSpeed: 0.9,
    sonicTurbulence: 0.75,
  },
]
