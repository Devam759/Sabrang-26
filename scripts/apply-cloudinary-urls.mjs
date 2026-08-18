import fs from "fs";
import path from "path";

const mapping = JSON.parse(fs.readFileSync("cloudinary-mapping.json", "utf-8"));

// Map of aliases to ensure legacy or short paths also get the right Cloudinary URL
const extraAliases = {
  "/dance-battle.png": mapping["/about/dance-battle.png"],
  "/echos-of-noor.png": mapping["/about/echos-of-noor.png"],
  "/fest-crowd-lights.jpg": mapping["/about/fest-crowd-lights.jpg"],
  "/panache-runway.png": mapping["/about/panache-runway.png"],
  "/sabrang-live.png": mapping["/about/sabrang-live.png"],
  "/step-up.jpg": mapping["/about/step-up.jpg"],
  "/versevaad.jpg": "/about/versevaad.jpg" ? mapping["/about/versevaad.jpg"] : undefined,
  "/contact-depth.png": mapping["/contact/contact-depth.png"],
  "/contact-edge.png": mapping["/contact/contact-edge.png"],
  "/contact-raw.png": mapping["/contact/contact-raw.png"],
  "/pallete.png": mapping["/contact/pallete.png"],
  "/pallete_premium.png": mapping["/contact/pallete_premium.png"],
  "/background.mp4": mapping["/videos/background.mp4"],
};

const fullMap = { ...extraAliases, ...mapping };

// Files to update
const targetExtensions = [".ts", ".tsx", ".js", ".jsx", ".json"];
const excludeDirs = ["node_modules", ".next", ".git", "scripts"];

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fullPath = path.join(dir, f);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(f)) {
        walkDir(fullPath, fileList);
      }
    } else {
      if (targetExtensions.includes(path.extname(f)) && !f.includes("cloudinary-mapping")) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

const allFiles = walkDir(process.cwd());
let totalReplacements = 0;

for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, "utf-8");
  let modified = false;

  // Sort keys by length descending to match longer specific paths first
  const keys = Object.keys(fullMap).sort((a, b) => b.length - a.length);

  for (const key of keys) {
    const cdnUrl = fullMap[key];
    if (!cdnUrl) continue;

    // Search for quoted string occurrences: "/path"
    const searchDouble = `"${key}"`;
    const searchSingle = `'${key}'`;
    const searchBacktick = `\`${key}\``;

    if (content.includes(searchDouble)) {
      content = content.replaceAll(searchDouble, `"${cdnUrl}"`);
      modified = true;
      totalReplacements++;
    }
    if (content.includes(searchSingle)) {
      content = content.replaceAll(searchSingle, `"${cdnUrl}"`);
      modified = true;
      totalReplacements++;
    }
    if (content.includes(searchBacktick)) {
      content = content.replaceAll(searchBacktick, `"${cdnUrl}"`);
      modified = true;
      totalReplacements++;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Updated: ${path.relative(process.cwd(), filePath)}`);
  }
}

console.log(`\nSuccessfully applied Cloudinary CDN URLs (${totalReplacements} replacements across the codebase).`);
