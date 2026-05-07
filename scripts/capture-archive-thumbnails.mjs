#!/usr/bin/env node
/**
 * Descarrega miniatures d'Archive.org per als jocs Flash importats.
 * Usa https://archive.org/services/img/{identifier} (no requereix Chromium).
 *
 * Ús:
 *   node scripts/capture-archive-thumbnails.mjs
 *   node scripts/capture-archive-thumbnails.mjs --force   # reescriu les existents
 *   node scripts/capture-archive-thumbnails.mjs --dry-run
 */

import fs from "node:fs";
import fsP from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import fetch from "node-fetch";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const GAMES_FILE = path.join(ROOT, "data", "games.json");
const IMAGE_DIR = path.join(ROOT, "assets", "game-images");
const RATE_LIMIT_MS = 300;

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const DRY_RUN = args.includes("--dry-run");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const games = JSON.parse(fs.readFileSync(GAMES_FILE, "utf8"));

const targets = games.filter(
  (g) => g.flash && String(g.id).startsWith("archive-") && (FORCE || !g.image)
);

if (targets.length === 0) {
  console.log("Tots els jocs d'Archive.org ja tenen imatge.");
  process.exit(0);
}

console.log(`${targets.length} jocs sense miniatura${DRY_RUN ? " (DRY RUN)" : ""}...`);
await fsP.mkdir(IMAGE_DIR, { recursive: true });

let ok = 0, fail = 0;

for (const game of targets) {
  const identifier = path.basename(game.url, ".swf");
  const imgPath = path.join(IMAGE_DIR, `${game.id}.jpg`);
  const relPath = `assets/game-images/${game.id}.jpg`;
  const thumbUrl = `https://archive.org/services/img/${identifier}`;

  process.stdout.write(`  ${identifier} ... `);

  if (!DRY_RUN) {
    try {
      const res = await fetch(thumbUrl, { redirect: "follow", timeout: 15000 });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) throw new Error(`No és imatge: ${contentType}`);
      await pipeline(res.body, fs.createWriteStream(imgPath));
      game.image = relPath;
      console.log("✓");
      ok++;
    } catch (err) {
      console.log(`✗ ${err.message}`);
      fail++;
    }
    await sleep(RATE_LIMIT_MS);
  } else {
    console.log("(dry-run)");
    ok++;
  }
}

if (!DRY_RUN && ok > 0) {
  fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2) + "\n", "utf8");
  console.log(`\n✓ ${ok} miniatures descarregades, ${fail} fallades. games.json actualitzat.`);
} else {
  console.log(`\n${ok} processats, ${fail} fallades.`);
}
