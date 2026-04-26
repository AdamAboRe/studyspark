const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const target = path.join(root, "runtime-config.js");
const apiBase = String(process.env.VITE_API_BASE || "").trim();

const content = `window.__APP_CONFIG__ = window.__APP_CONFIG__ || {\n  VITE_API_BASE: ${JSON.stringify(apiBase)},\n};\n`;

fs.writeFileSync(target, content, "utf8");
console.log(`runtime-config.js updated. VITE_API_BASE=${apiBase || "(empty)"}`);
