import fs from "fs";
import path from "path";

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!["node_modules", ".next", ".git", "scripts"].includes(file)) {
        results = results.concat(walk(full));
      }
    } else if (/\.(tsx?|jsx?|json|css)$/.test(file) && !file.includes("cloudinary-mapping")) {
      results.push(full);
    }
  });
  return results;
}

const files = walk(process.cwd());
const pattern = /["']\/([^"']+\.(png|jpg|jpeg|webp|svg|ico|mp4))["']/g;

console.log("Scanning files for local media URLs...\n");
let count = 0;

files.forEach((f) => {
  const content = fs.readFileSync(f, "utf8");
  let match;
  while ((match = pattern.exec(content)) !== null) {
    console.log(`${path.relative(process.cwd(), f)} -> "${match[1]}"`);
    count++;
  }
});

console.log(`\nFound ${count} remaining local media references.`);
