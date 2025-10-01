const fs = require("fs");

const subscribe = fs.readFileSync("subscribe.js", "utf8");
const review = fs.readFileSync("review.js", "utf8");

const combined = `// AUTO-GENERATED FILE - DO NOT EDIT
// Combined build: subscribe.js + review.js

${subscribe}

// --- separator ---

${review}
`;

fs.writeFileSync("main.js", combined, "utf8");
console.log("✅ Build selesai → main.js terbuat!");
