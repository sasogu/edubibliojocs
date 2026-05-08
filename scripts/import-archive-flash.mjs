#!/usr/bin/env node
/**
 * Importador de jocs Flash educatius d'Archive.org
 *
 * Ús:
 *   node scripts/import-archive-flash.mjs             # cerca i descarrega
 *   node scripts/import-archive-flash.mjs --dry-run   # cerca sense descarregar
 *   node scripts/import-archive-flash.mjs --apply     # fusiona staging → games.json
 *   node scripts/import-archive-flash.mjs --limit 50  # limita el nombre d'items
 *   node scripts/import-archive-flash.mjs --query "math elementary"
 *
 * Fitxers generats:
 *   assets/flash/{identifier}.swf       → fitxers Flash (NO estan en git)
 *   data/archive-flash-staging.json     → entrades per revisar
 *   data/archive-flash-state.json       → estat per reprendre descàrregues
 */

import fs from "node:fs";
import fsP from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import fetch from "node-fetch";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const FLASH_DIR = path.join(ROOT, "assets", "flash");
const STAGING_FILE = path.join(ROOT, "data", "archive-flash-staging.json");
const GAMES_FILE = path.join(ROOT, "data", "games.json");
const STATE_FILE = path.join(ROOT, "data", "archive-flash-state.json");

const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
const RATE_LIMIT_MS = 800;
const SEARCH_ROWS = 100;
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Mapatge de subjects d'Archive.org → àrees del projecte
// ---------------------------------------------------------------------------
const AREA_MAP = [
  [/\bmath|arithmeti|calculat|number|fraction|geometr|algebra/i, "Matematicas"],
  [/\bread|literacy|spell|grammar|writing|alphabet|phonics|language.art/i, "Lengua"],
  [/\bscience|biology|physics|chemistry|nature|animal|plant|earth|space/i, "Ciencias Naturales"],
  [/\bhistory|geography|social.studi|civics|citizenship/i, "Sociales"],
  [/\bart\b|drawing|painting|color|colour/i, "Plastica"],
  [/\bmusic|rhythm|instrument|note|song/i, "Musica"],
  [/\btyping|keyboard|computer|coding|programming/i, "Informática"],
  [/\bphysical.ed|sport|exercise|health/i, "Educación Física"],
  [/\blogic|puzzle|thinking|memory|brain|pattern/i, "Logica"],
  [/\benglish\b/i, "Ingles"],
  [/\bfrench\b|français/i, "Ingles"], // mapped to foreign lang area
  [/\bsafety|security/i, "Seguridad Digital"],
];

const LANG_MAP = {
  en: "Inglés", eng: "Inglés", english: "Inglés",
  es: "Castellano", spa: "Castellano", spanish: "Castellano", castellano: "Castellano", castilian: "Castellano", español: "Castellano",
  ca: "Català/Valencià", cat: "Català/Valencià", catalan: "Català/Valencià", català: "Català/Valencià", valencian: "Català/Valencià", valenciano: "Català/Valencià", valencià: "Català/Valencià",
  fr: "Francés", fre: "Francés", fra: "Francés", french: "Francés",
};

const TARGET_LANGS = new Set([
  "es", "spa", "spanish", "castellano", "castilian", "español",
  "ca", "cat", "catalan", "català", "valencian", "valenciano", "valencià",
]);

function isTargetLanguage(lang) {
  if (!lang) return false;
  const langs = Array.isArray(lang) ? lang : [lang];
  return langs.some((l) => {
    const n = String(l).toLowerCase().trim();
    return TARGET_LANGS.has(n) || TARGET_LANGS.has(n.slice(0, 2));
  });
}

const LEVEL_MAP = [
  [/preschool|kindergarten|pre.?k\b|early.child/i, ["Infantil"]],
  [/\belementary\b|\bprimary\b|grade.[1-6]\b|k.?12/i, ["Primaria"]],
  [/\bmiddle.school\b|junior.high|grade.[6-9]\b/i, ["Secundaria"]],
  [/\bhigh.school\b|secondary/i, ["Secundaria"]],
];

// ---------------------------------------------------------------------------
// Paràmetres CLI
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const APPLY_MODE = args.includes("--apply");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx !== -1 ? Number(args[limitIdx + 1]) : Infinity;
const queryIdx = args.indexOf("--query");
const EXTRA_QUERY = queryIdx !== -1 ? args[queryIdx + 1] : "";

// ---------------------------------------------------------------------------
// Mode --apply: fusionar staging → games.json
// ---------------------------------------------------------------------------
if (APPLY_MODE) {
  await applyStaging();
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Utilitats
// ---------------------------------------------------------------------------
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function mapArea(subjects) {
  const text = (Array.isArray(subjects) ? subjects : [subjects || ""]).join(" ").toLowerCase();
  for (const [pattern, area] of AREA_MAP) {
    if (pattern.test(text)) return area;
  }
  return "Juegos";
}

function mapLanguage(lang) {
  if (!lang) return "Inglés";
  const key = String(lang).toLowerCase().trim();
  return LANG_MAP[key] || LANG_MAP[key.slice(0, 2)] || "Inglés";
}

function mapLevels(subjects) {
  const text = (Array.isArray(subjects) ? subjects : [subjects || ""]).join(" ");
  for (const [pattern, levels] of LEVEL_MAP) {
    if (pattern.test(text)) return levels;
  }
  return ["Primaria"];
}

function loadJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { ...options, timeout: 30000 });
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`  Reintent ${i + 1}/${retries - 1} per ${url}`);
      await sleep(2000 * (i + 1));
    }
  }
}

// ---------------------------------------------------------------------------
// API d'Archive.org
// ---------------------------------------------------------------------------
async function searchArchive(page = 1, extraQuery = "") {
  const baseQuery = [
    "mediatype:software",
    "subject:flash",
    "(subject:education OR subject:educational OR subject:learning OR subject:school OR subject:kids OR subject:children)",
    extraQuery,
  ].filter(Boolean).join(" AND ");

  const url = new URL("https://archive.org/advancedsearch.php");
  url.searchParams.set("q", baseQuery);
  url.searchParams.set("fl", "identifier,title,description,subject,language,creator,date");
  url.searchParams.set("output", "json");
  url.searchParams.set("rows", String(SEARCH_ROWS));
  url.searchParams.set("page", String(page));
  url.searchParams.set("sort[]", "downloads desc");

  const res = await fetchWithRetry(url.toString());
  if (!res.ok) throw new Error(`Search API error: ${res.status}`);
  const data = await res.json();
  return data.response;
}

async function getItemMetadata(identifier) {
  const url = `https://archive.org/metadata/${identifier}`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`Metadata error ${res.status} for ${identifier}`);
  return res.json();
}

function pickBestSwf(files) {
  const swfs = files.filter((f) =>
    f.name?.toLowerCase().endsWith(".swf") &&
    !f.name?.toLowerCase().includes("thumbnail") &&
    !f.name?.toLowerCase().includes("preview") &&
    Number(f.size || 0) <= MAX_SIZE_BYTES
  );
  if (swfs.length === 0) return null;
  // Preferim el fitxer més gran (sol ser el joc principal)
  return swfs.sort((a, b) => Number(b.size || 0) - Number(a.size || 0))[0];
}

// ---------------------------------------------------------------------------
// Descàrrega
// ---------------------------------------------------------------------------
async function downloadSwf(identifier, fileName, destPath) {
  const url = `https://archive.org/download/${identifier}/${encodeURIComponent(fileName)}`;
  const res = await fetchWithRetry(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Download error ${res.status}`);
  const tmp = destPath + ".tmp";
  await pipeline(res.body, fs.createWriteStream(tmp));
  fs.renameSync(tmp, destPath);
}

// ---------------------------------------------------------------------------
// Generació d'entrada per a games.json
// ---------------------------------------------------------------------------
function buildEntry(identifier, meta, swfFile) {
  const m = meta.metadata || {};
  const subjects = m.subject || [];
  const title = String(m.title || identifier).trim();

  return {
    id: `archive-${slugify(identifier)}`,
    title,
    area: mapArea(subjects),
    language: mapLanguage(m.language),
    url: `assets/flash/${identifier}.swf`,
    notes: String(m.description || "").replace(/<[^>]+>/g, "").trim().slice(0, 400) || title,
    levels: mapLevels(subjects),
    flash: true,
    _source: `https://archive.org/details/${identifier}`,
    _swfSize: Number(swfFile.size || 0),
  };
}

// ---------------------------------------------------------------------------
// Mode --apply
// ---------------------------------------------------------------------------
async function applyStaging() {
  const staging = loadJson(STAGING_FILE, []);
  if (staging.length === 0) {
    console.log("El fitxer de staging és buit. Res a aplicar.");
    return;
  }

  const games = loadJson(GAMES_FILE, []);
  const existingIds = new Set(games.map((g) => g.id));
  const existingUrls = new Set(games.map((g) => g.url));

  const toAdd = staging.filter(
    (e) => !existingIds.has(e.id) && !existingUrls.has(e.url)
  );

  if (toAdd.length === 0) {
    console.log("Totes les entrades de staging ja existeixen a games.json.");
    return;
  }

  // Netejar camps interns _source, _swfSize
  const clean = toAdd.map(({ _source, _swfSize, ...rest }) => rest);

  games.push(...clean);
  saveJson(GAMES_FILE, games);
  console.log(`✓ ${clean.length} activitats afegides a games.json (${games.length} total).`);
}

// ---------------------------------------------------------------------------
// Flux principal
// ---------------------------------------------------------------------------
if (!DRY_RUN) {
  await fsP.mkdir(FLASH_DIR, { recursive: true });
}

const state = loadJson(STATE_FILE, { processed: [] });
const processedSet = new Set(state.processed);
const staging = loadJson(STAGING_FILE, []);
const stagingIds = new Set(staging.map((e) => e.id));

console.log(`Iniciant importació d'Archive.org Flash${DRY_RUN ? " (DRY RUN)" : ""}`);
console.log(`Ja processats: ${processedSet.size} | En staging: ${staging.length}`);

let totalProcessed = 0;
let page = 1;

outer: while (totalProcessed < LIMIT) {
  console.log(`\nPàgina ${page}...`);
  let response;
  try {
    response = await searchArchive(page, EXTRA_QUERY);
  } catch (err) {
    console.error(`Error en la cerca: ${err.message}`);
    break;
  }

  const docs = response.docs || [];
  if (docs.length === 0) {
    console.log("No hi ha més resultats.");
    break;
  }

  console.log(`${docs.length} items trobats (total: ${response.numFound})`);

  for (const doc of docs) {
    if (totalProcessed >= LIMIT) break outer;

    const { identifier } = doc;
    const entryId = `archive-${slugify(identifier)}`;

    if (processedSet.has(identifier)) {
      process.stdout.write("·");
      continue;
    }

    await sleep(RATE_LIMIT_MS);

    let meta;
    try {
      meta = await getItemMetadata(identifier);
    } catch (err) {
      console.warn(`\n  [SKIP] Metadata error per ${identifier}: ${err.message}`);
      processedSet.add(identifier);
      continue;
    }

    const metaLang = meta.metadata?.language;
    if (!isTargetLanguage(metaLang)) {
      process.stdout.write("·");
      processedSet.add(identifier);
      continue;
    }

    const swfFile = pickBestSwf(meta.files || []);
    if (!swfFile) {
      process.stdout.write("·");
      processedSet.add(identifier);
      continue;
    }

    const sizeMB = (Number(swfFile.size || 0) / 1024 / 1024).toFixed(1);
    console.log(`\n  ✓ ${identifier} — ${swfFile.name} (${sizeMB} MB)`);

    const entry = buildEntry(identifier, meta, swfFile);

    if (!stagingIds.has(entryId)) {
      if (!DRY_RUN) {
        const destPath = path.join(FLASH_DIR, `${identifier}.swf`);
        if (!fs.existsSync(destPath)) {
          try {
            process.stdout.write(`    Descarregant...`);
            await downloadSwf(identifier, swfFile.name, destPath);
            console.log(` fet.`);
          } catch (err) {
            console.warn(` ERROR: ${err.message}`);
            processedSet.add(identifier);
            state.processed = [...processedSet];
            saveJson(STATE_FILE, state);
            continue;
          }
        } else {
          console.log(`    Ja existeix localment.`);
        }
      }

      staging.push(entry);
      stagingIds.add(entryId);
      if (!DRY_RUN) saveJson(STAGING_FILE, staging);
    }

    processedSet.add(identifier);
    state.processed = [...processedSet];
    if (!DRY_RUN) saveJson(STATE_FILE, state);

    totalProcessed++;
  }

  page++;
  if (docs.length < SEARCH_ROWS) break;
}

console.log(`\n---`);
console.log(`Processats en aquesta execució: ${totalProcessed}`);
console.log(`Total en staging: ${staging.length}`);
if (staging.length > 0) {
  console.log(`Revisa data/archive-flash-staging.json i executa:`);
  console.log(`  node scripts/import-archive-flash.mjs --apply`);
}
