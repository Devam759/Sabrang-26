import fs from "fs";
import path from "path";

const PUBLIC_DIR = path.resolve("public");

const dirsToDelete = [
  "Gallery",
  "about",
  "contact",
  "events_posters",
  "menu-scroll-covers",
  "past-sponsors",
  "sabrang-logo",
  "tech team credit",
  "videos",
];

for (const dir of dirsToDelete) {
  const target = path.join(PUBLIC_DIR, dir);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`Deleted: public/${dir}`);
  }
}

console.log("\nPublic folder cleaned. Only system files and fonts retained.");
