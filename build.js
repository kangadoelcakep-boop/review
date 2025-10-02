// build.js - generate dist/main.<timestamp>.js + latest.txt + index.html

const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

const timestamp = Date.now();
const outputFile = `main.${timestamp}.js`;
const outputPath = path.join(distDir, outputFile);

// --- Read source files (subscribe.js + review.js) ---
const subscribePath = path.join(__dirname, "subscribe.js");
const reviewPath = path.join(__dirname, "review.js");

let content = "";
if (fs.existsSync(subscribePath)) {
  content += "\n// ---- subscribe.js ----\n";
  content += fs.readFileSync(subscribePath, "utf8") + "\n";
}
if (fs.existsSync(reviewPath)) {
  content += "\n// ---- review.js ----\n";
  content += fs.readFileSync(reviewPath, "utf8") + "\n";
}

// Add build metadata
content =
  `// GripAndReview build ${timestamp}\n` +
  `console.log("✅ GripAndReview build loaded: ${timestamp}");\n\n` +
  content;

// Write main.<timestamp>.js
fs.writeFileSync(outputPath, content);

// Write latest.txt
fs.writeFileSync(path.join(distDir, "latest.txt"), outputFile);

// Write index.html for GitHub Pages
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>GripAndReview CDN</title>
</head>
<body>
  <h1>GripAndReview CDN</h1>
  <p>Latest build: <a href="./${outputFile}">${outputFile}</a></p>
  <p>Latest pointer: <a href="./latest.txt">latest.txt</a></p>
</body>
</html>`;
fs.writeFileSync(path.join(distDir, "index.html"), html);

console.log("✅ Build complete:", outputFile);
