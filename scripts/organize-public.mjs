import fs from "fs";
import path from "path";

const rootPublic = path.resolve("public");

const moves = [
  // About / Pillars assets
  { from: "dance-battle.png", to: "about/dance-battle.png" },
  { from: "echos-of-noor.png", to: "about/echos-of-noor.png" },
  { from: "panache-runway.png", to: "about/panache-runway.png" },
  { from: "sabrang-live.png", to: "about/sabrang-live.png" },
  { from: "step-up.jpg", to: "about/step-up.jpg" },
  { from: "versevaad.jpg", to: "about/versevaad.jpg" },
  { from: "fest-crowd-lights.jpg", to: "about/fest-crowd-lights.jpg" },

  // Contact assets
  { from: "contact-raw.png", to: "contact/contact-raw.png" },
  { from: "contact-depth.png", to: "contact/contact-depth.png" },
  { from: "contact-edge.png", to: "contact/contact-edge.png" },
  { from: "pallete.png", to: "contact/pallete.png" },
  { from: "pallete_premium.png", to: "contact/pallete_premium.png" },

  // Videos
  { from: "background.mp4", to: "videos/background.mp4" },
];

for (const m of moves) {
  const src = path.join(rootPublic, m.from);
  const dest = path.join(rootPublic, m.to);
  const destDir = path.dirname(dest);

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
    console.log(`Moved: ${m.from} -> ${m.to}`);
  }
}

console.log("Public folder organized successfully.");
