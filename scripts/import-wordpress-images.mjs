import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const wpBase = process.env.WP_BASE || "https://edutictac.es/blog/bibliojocs";
const gamesPath = path.join(root, "data", "games.json");
const imageDir = path.join(root, "assets", "game-images");

const games = await readJsonArray(gamesPath);
const pages = await fetchAllJson(`${wpBase}/wp-json/wp/v2/pages?per_page=100`);
const mediaItems = await fetchAllJson(`${wpBase}/wp-json/wp/v2/media?per_page=100`);
const pageUrls = new Set([`${wpBase}/`, ...pages.map((p) => p.link).filter(Boolean)]);

const cards = [];
for (const pageUrl of pageUrls) {
  const html = await fetchText(pageUrl);
  if (!html) {
    continue;
  }
  cards.push(...extractPageCards(html, wpBase));
}

const byExternalUrl = new Map();
const byTitle = new Map();
for (const card of cards) {
  const key = normalizeUrl(card.externalUrl);
  if (key && !byExternalUrl.has(key)) {
    byExternalUrl.set(key, card);
  }

  const titleKey = normalizeTitle(card.title);
  if (titleKey && !byTitle.has(titleKey)) {
    byTitle.set(titleKey, card);
  }
}

await fs.mkdir(imageDir, { recursive: true });

let linked = 0;
let downloaded = 0;
let missing = 0;
let linkedFromMedia = 0;

const mediaIndex = mediaItems
  .map((item) => {
    const sourceUrl = item?.source_url || null;
    const title = cleanText(item?.title?.rendered || "");
    const slug = String(item?.slug || "");
    const normalized = normalizeTitle(`${title} ${slug}`);
    return {
      sourceUrl,
      normalized
    };
  })
  .filter((item) => isValidImageUrl(item.sourceUrl) && item.normalized);

for (const game of games) {
  const fromUrl = byExternalUrl.get(normalizeUrl(game.url));
  const fromTitle = byTitle.get(normalizeTitle(game.title));
  let card = fromUrl || fromTitle;

  if ((!card || !card.imageUrl) && !game.image) {
    const fromMedia = findMediaImageForGame(game, mediaIndex);
    if (fromMedia) {
      card = {
        externalUrl: game.url,
        title: game.title,
        imageUrl: fromMedia
      };
      linkedFromMedia += 1;
    }
  }

  if (!card || !card.imageUrl) {
    missing += 1;
    continue;
  }

  const ext = guessExtension(card.imageUrl);
  const fileName = `${sanitizeFileName(game.id || game.title || "game")}${ext}`;
  const localPath = path.join(imageDir, fileName);

  const saved = await downloadImage(card.imageUrl, localPath);
  if (saved) {
    downloaded += 1;
  }

  game.image = `assets/game-images/${fileName}`;
  game.imageSource = card.imageUrl;
  linked += 1;
}

await fs.writeFile(gamesPath, `${JSON.stringify(games, null, 2)}\n`, "utf8");

console.log(`Tarjetas detectadas en WordPress: ${cards.length}`);
console.log(`Juegos enlazados con imagen: ${linked}`);
console.log(`Enlaces recuperados desde libreria media: ${linkedFromMedia}`);
console.log(`Imagenes descargadas: ${downloaded}`);
console.log(`Juegos sin imagen localizada: ${missing}`);

function findMediaImageForGame(game, mediaIndex) {
  const titleTokens = tokenize(normalizeTitle(game.title));
  if (!titleTokens.length) {
    return null;
  }

  let best = null;
  let bestScore = 0;

  for (const media of mediaIndex) {
    const mediaTokens = tokenize(media.normalized);
    if (!mediaTokens.length) {
      continue;
    }

    const overlap = titleTokens.filter((token) => mediaTokens.includes(token)).length;
    if (!overlap) {
      continue;
    }

    const score = overlap / titleTokens.length;
    const isConfident = score >= 0.8 || (titleTokens.length === 1 && score === 1);
    if (!isConfident) {
      continue;
    }

    if (score > bestScore) {
      best = media.sourceUrl;
      bestScore = score;
    }
  }

  return best;
}

function tokenize(text) {
  const stopwords = new Set(["de", "del", "la", "el", "los", "las", "y", "en", "a", "the", "and", "for", "con"]);
  return String(text || "")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stopwords.has(token));
}

function extractPageCards(html, base) {
  const source = String(html || "");
  const blocks = [...source.matchAll(/<div[^>]*class\s*=\s*"[^"]*fp-col[^"]*fp-post[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)];
  const out = [];
  const seen = new Set();

  const pushCard = (candidate) => {
    if (!candidate?.externalUrl || !isExternalPlayableUrl(candidate.externalUrl, base)) {
      return;
    }

    const key = `${normalizeUrl(candidate.externalUrl)}|${normalizeUrl(candidate.imageUrl || "")}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    out.push(candidate);
  };

  for (const block of blocks) {
    const chunk = block[1] || "";
    const hrefs = [...chunk.matchAll(/href\s*=\s*"([^"]+)"/gi)].map((m) => decodeHtml(m[1]));
    const externalUrl = hrefs.find((u) => isExternalPlayableUrl(u, base));
    if (!externalUrl) {
      continue;
    }

    const titleMatch = chunk.match(/<h4[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i);
    const title = cleanText(titleMatch?.[1] || "");

    const imageUrl = findBestImageUrl(chunk, base);

    pushCard({
      externalUrl,
      title,
      imageUrl
    });
  }

  // Fallback generico: busca cualquier enlace externo jugable y una imagen cercana.
  for (const linkMatch of source.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = decodeHtml(linkMatch[1]);
    if (!isExternalPlayableUrl(href, base)) {
      continue;
    }

    const start = Math.max(0, (linkMatch.index || 0) - 1400);
    const end = Math.min(source.length, (linkMatch.index || 0) + 1400);
    const context = source.slice(start, end);

    pushCard({
      externalUrl: href,
      title: cleanText(linkMatch[2] || ""),
      imageUrl: findBestImageUrl(context, base)
    });
  }

  return out;
}

function findBestImageUrl(chunk, base) {
  if (!chunk) {
    return null;
  }

  for (const imgTag of chunk.matchAll(/<img\b[^>]*>/gi)) {
    const tag = imgTag[0] || "";
    const directUrl = firstNonEmptyAttr(tag, [
      "data-src",
      "data-lazy-src",
      "data-original",
      "data-image",
      "src"
    ]);

    if (directUrl) {
      const absolute = absolutizeUrl(decodeHtml(directUrl), base);
      if (isValidImageUrl(absolute)) {
        return absolute;
      }
    }

    const srcset = firstNonEmptyAttr(tag, ["srcset", "data-srcset"]);
    if (srcset) {
      const fromSrcset = pickImageFromSrcset(srcset);
      const absolute = absolutizeUrl(decodeHtml(fromSrcset), base);
      if (isValidImageUrl(absolute)) {
        return absolute;
      }
    }
  }

  return null;
}

function firstNonEmptyAttr(tag, names) {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = tag.match(new RegExp(`${escaped}\\s*=\\s*["']([^"']+)["']`, "i"));
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function pickImageFromSrcset(srcset) {
  const candidates = String(srcset || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!candidates.length) {
    return "";
  }

  // Preferimos el ultimo item para intentar obtener una miniatura de mayor resolucion.
  const selected = candidates[candidates.length - 1];
  return selected.split(/\s+/)[0] || "";
}

function isValidImageUrl(url) {
  if (!url) {
    return false;
  }

  const lower = url.toLowerCase();
  if (!/^https?:\/\//.test(lower)) {
    return false;
  }

  return !lower.endsWith(".svg") && !lower.includes("gravatar.com/avatar");
}

function isExternalPlayableUrl(url, base) {
  if (!/^https?:\/\//i.test(url)) {
    return false;
  }

  const lower = url.toLowerCase();
  const blocked = [
    `${base.toLowerCase()}/`,
    "addtoany.com",
    "facebook.com",
    "twitter.com",
    "mastodon",
    "mailto:",
    "javascript:",
    "wp-content/uploads/sites/2"
  ];

  return !blocked.some((part) => lower.includes(part));
}

async function downloadImage(url, destination) {
  try {
    const exists = await fileExists(destination);
    if (exists) {
      return false;
    }

    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) {
      return false;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(destination, buffer);
    return true;
  } catch {
    return false;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function guessExtension(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname.endsWith(".png")) return ".png";
    if (pathname.endsWith(".webp")) return ".webp";
    if (pathname.endsWith(".gif")) return ".gif";
    if (pathname.endsWith(".jpeg")) return ".jpeg";
    if (pathname.endsWith(".jpg")) return ".jpg";
  } catch {
    return ".jpg";
  }
  return ".jpg";
}

function sanitizeFileName(value) {
  return String(value || "game")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "game";
}

function normalizeUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) {
    return "";
  }

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const pathName = parsed.pathname.replace(/\/+$/, "").toLowerCase() || "/";
    const search = new URLSearchParams(parsed.search);
    ["ref", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((k) => search.delete(k));
    const query = search.toString();
    return `${host}${pathName}${query ? `?${query}` : ""}`;
  } catch {
    return raw.toLowerCase().replace(/\/+$/, "");
  }
}

function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(text) {
  return String(text || "")
    .replace(/&#038;|&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function absolutizeUrl(url, base) {
  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  try {
    return new URL(url, `${base}/`).toString();
  } catch {
    return null;
  }
}

async function fetchText(url) {
  try {
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}

async function fetchAllJson(initialUrl) {
  const first = await fetchJson(initialUrl);
  const totalPages = Number(first.totalPages || 1);
  const allItems = [...first.items];

  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchJson(`${initialUrl}&page=${page}`);
    allItems.push(...next.items);
  }

  return allItems;
}

async function fetchJson(url) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Error ${response.status} al cargar ${url}`);
  }

  const totalPages = Number(response.headers.get("x-wp-totalpages") || 1);
  const items = await response.json();

  return {
    totalPages,
    items: Array.isArray(items) ? items : []
  };
}

async function readJsonArray(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`${path.basename(filePath)} debe ser un array`);
  }
  return parsed;
}
