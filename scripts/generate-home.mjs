#!/usr/bin/env node
/**
 * Genera data/games-home.json amb els primers 48 jocs que tinguen imatge.
 * S'executa automàticament com a part del deploy.
 */
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const srcPath = path.join(root, "data", "games.json");
const dstPath = path.join(root, "data", "games-home.json");
const HOME_SIZE = 48;

const all = JSON.parse(await fs.readFile(srcPath, "utf8"));
const home = all.filter((g) => g.image).slice(0, HOME_SIZE);

await fs.writeFile(dstPath, JSON.stringify(home, null, 2), "utf8");
console.log(`games-home.json: ${home.length} jocs escrits.`);
