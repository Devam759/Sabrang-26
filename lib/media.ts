import mapping from "@/cloudinary-mapping.json";

const cdnMap = mapping as Record<string, string>;

// Fallback normalizer to handle both old root paths and organized paths
const aliasMap: Record<string, string> = {
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060179/sabrang-2026/about/dance-battle.png": "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060179/sabrang-2026/about/dance-battle.png",
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060181/sabrang-2026/about/echos-of-noor.png": "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060181/sabrang-2026/about/echos-of-noor.png",
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060182/sabrang-2026/about/fest-crowd-lights.jpg": "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060182/sabrang-2026/about/fest-crowd-lights.jpg",
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060183/sabrang-2026/about/panache-runway.png": "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060183/sabrang-2026/about/panache-runway.png",
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060184/sabrang-2026/about/sabrang-live.png": "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060184/sabrang-2026/about/sabrang-live.png",
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060185/sabrang-2026/about/step-up.jpg": "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060185/sabrang-2026/about/step-up.jpg",
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060186/sabrang-2026/about/versevaad.jpg": "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060186/sabrang-2026/about/versevaad.jpg",
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060188/sabrang-2026/contact/contact-depth.png": "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060188/sabrang-2026/contact/contact-depth.png",
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060189/sabrang-2026/contact/contact-edge.png": "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060189/sabrang-2026/contact/contact-edge.png",
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060190/sabrang-2026/contact/contact-raw.png": "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060190/sabrang-2026/contact/contact-raw.png",
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060191/sabrang-2026/contact/pallete.png": "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060191/sabrang-2026/contact/pallete.png",
  "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060192/sabrang-2026/contact/pallete_premium.png": "https://res.cloudinary.com/eprhemvt/image/upload/f_auto,q_auto/v1787060192/sabrang-2026/contact/pallete_premium.png",
  "https://res.cloudinary.com/eprhemvt/video/upload/v1787060394/sabrang-2026/videos/background.mp4": "https://res.cloudinary.com/eprhemvt/video/upload/v1787060394/sabrang-2026/videos/background.mp4",
};

/**
 * Returns the optimized Cloudinary CDN URL for any public asset path.
 * If no CDN URL is mapped, it safely falls back to the original local path.
 */
export function getMediaUrl(localPath: string): string {
  if (!localPath) return localPath;
  if (localPath.startsWith("http://") || localPath.startsWith("https://") || localPath.startsWith("data:")) {
    return localPath;
  }

  // Exact match
  if (cdnMap[localPath]) {
    return cdnMap[localPath];
  }

  // Alias match
  const alias = aliasMap[localPath];
  if (alias && cdnMap[alias]) {
    return cdnMap[alias];
  }

  // Case insensitive match
  const lower = localPath.toLowerCase();
  for (const [key, val] of Object.entries(cdnMap)) {
    if (key.toLowerCase() === lower) {
      return val;
    }
  }

  return localPath;
}

export default getMediaUrl;
