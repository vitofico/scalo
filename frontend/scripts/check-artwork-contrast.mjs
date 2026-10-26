import { readFileSync } from "node:fs";

// Ambient routes can pass behind header and toolbar copy. Check the darkest
// possible mask pixel, including intersections, in both system colour modes.
const tokens = readFileSync(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
const artwork = readFileSync(new URL("../src/styles/artwork.css", import.meta.url), "utf8");
const alpha = Number(artwork.match(/\.page::before\s*\{[\s\S]*?opacity:\s*([\d.]+)/)?.[1]);
if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw new Error("Missing ambient artwork opacity");
const sets = [...tokens.matchAll(/:root\s*\{([^}]+)\}/g)].map(match =>
  Object.fromEntries([...match[1].matchAll(/(--[\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map(m => [m[1], m[2]])));
function rgb(hex) { return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255); }
function luminance(rgb) {
  return rgb.map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4)
    .reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
}
for (const [i, palette] of sets.entries()) {
  const base = rgb(palette["--c-bg"]);
  const accent = rgb(palette["--c-accent-text"]);
  const ground = luminance(base.map((v, j) => v * (1 - alpha) + accent[j] * alpha));
  for (const role of ["--c-text", "--c-text-muted"]) {
    const ink = luminance(rgb(palette[role]));
    const ratio = (Math.max(ink, ground) + .05) / (Math.min(ink, ground) + .05);
    if (ratio < 4.5) throw new Error(`${i === 0 ? "Light" : "Dark"} ${role} over route artwork: ${ratio.toFixed(2)} < 4.5`);
    console.log(`${i === 0 ? "Light" : "Dark"} ${role} over route artwork: ${ratio.toFixed(2)}:1`);
  }
}
if (sets.length !== 2) throw new Error("Expected light and dark palettes");
