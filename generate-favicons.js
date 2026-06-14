// ============================================================
// generate-favicons.js
// Jalankan sekali untuk generate semua ukuran favicon PNG.
// Requires: npm install sharp
//
// Cara pakai:
//   node generate-favicons.js
//
// Atau jika tidak ingin install sharp, gunakan:
//   https://favicon.io/favicon-generator/
// dan download paket favicon lalu letakkan di root proyek.
// ============================================================

const fs   = require("fs");
const path = require("path");

// SVG sumber — ikon "✦" dengan gradient ungu-pink
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c6aff"/>
      <stop offset="100%" stop-color="#ff6ab0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#g)"/>
  <text x="256" y="340" text-anchor="middle" font-size="280"
    font-family="system-ui,sans-serif" fill="white">✦</text>
</svg>`;

// Simpan SVG sumber
fs.writeFileSync("favicon.svg", SVG);
console.log("✓ favicon.svg dibuat");

// Coba generate PNG dengan sharp jika tersedia
try {
  const sharp = require("sharp");
  const sizes  = [16, 32, 180, 192, 512];
  const svgBuf = Buffer.from(SVG);

  Promise.all(sizes.map(size =>
    sharp(svgBuf)
      .resize(size, size)
      .png()
      .toFile(`favicon-${size}.png`)
      .then(() => console.log(`✓ favicon-${size}.png`))
  )).then(() => {
    console.log("\nSemua favicon berhasil di-generate!");
    console.log("Letakkan semua file favicon-*.png di root proyek.");
  });
} catch(e) {
  console.log("\nsharp tidak tersedia. Gunakan salah satu cara berikut:");
  console.log("1. npm install sharp  lalu jalankan script ini lagi");
  console.log("2. Buka https://favicon.io dan buat favicon secara online");
  console.log("   lalu rename: favicon.png → favicon-32.png dst.");
  console.log("\nFavicon yang dibutuhkan: favicon-16.png, favicon-32.png,");
  console.log("favicon-180.png, favicon-192.png, favicon-512.png");
}
