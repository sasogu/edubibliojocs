import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const wpBase = process.env.WP_BASE || "https://edutictac.es/blog/bibliojocs";
const outPath = path.join(root, "data", "wordpress-import.json");
const gamesPath = path.join(root, "data", "games.json");
const merge = process.argv.includes("--merge");

const categories = await fetchAllJson(`${wpBase}/wp-json/wp/v2/categories?per_page=100`);
const categoryById = new Map(categories.map((c) => [c.id, c]));

const posts = await fetchAllJson(`${wpBase}/wp-json/wp/v2/posts?per_page=100`);
const pages = await fetchAllJson(`${wpBase}/wp-json/wp/v2/pages?per_page=100`);
const postByLink = new Map(posts.map((p) => [normalizeUrl(p.link), p]));
console.log(`Posts detectados: ${posts.length}`);
console.log(`Paginas detectadas: ${pages.length}`);

const imported = [];
const missingUrl = [];

for (const post of posts) {
  const cats = (post.categories || []).map((id) => categoryById.get(id)).filter(Boolean);
  let externalUrl = pickExternalUrlFromHtml(post.content?.rendered || "", wpBase);

  if (!externalUrl) {
    externalUrl = pickExternalUrlFromHtml(post.excerpt?.rendered || "", wpBase);
  }

  if (!externalUrl && post.link) {
    externalUrl = await extractExternalFromPostPage(post.link, wpBase);
  }

  if (!externalUrl) {
    missingUrl.push({
      id: post.id,
      slug: post.slug,
      title: cleanText(post.title?.rendered || "Sin titulo"),
      postUrl: post.link
    });
    continue;
  }

  imported.push({
    id: post.slug || `wp-${post.id}`,
    title: cleanText(post.title?.rendered || "Sin titulo"),
    area: inferArea(cats),
    level: inferLevel(cats),
    language: inferLanguage(cats, post),
    url: externalUrl,
    notes: cleanText(post.excerpt?.rendered || post.content?.rendered || "Importado desde WordPress"),
    source: post.link
  });
}

const fromPages = await extractFromRenderedPages(pages, wpBase, postByLink, categoryById);
for (const item of fromPages) {
  imported.push(item);
}

const dedupImported = dedupeByUrl(imported);
await fs.writeFile(outPath, `${JSON.stringify(dedupImported, null, 2)}\n`, "utf8");

console.log(`Importados con URL externa: ${dedupImported.length}`);
console.log(`Sin URL externa detectable: ${missingUrl.length}`);

if (merge) {
  const currentGames = await readJsonArray(gamesPath);
  const merged = mergeGames(currentGames, dedupImported);
  await fs.writeFile(gamesPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(`Fusion completada en data/games.json: ${merged.length} entradas totales.`);
}

async function extractFromRenderedPages(pagesList, base, postsByLink, categoriesById) {
  const out = [];
  const pageUrls = new Set([`${base}/`, ...pagesList.map((p) => p.link).filter(Boolean)]);

  for (const pageUrl of pageUrls) {
    const html = await fetchText(pageUrl);
    if (!html) {
      continue;
    }

    const cards = extractPageCards(html, base);

    for (const card of cards) {
      const post = card.postUrl ? postsByLink.get(normalizeUrl(card.postUrl)) : null;
      const cats = post ? (post.categories || []).map((id) => categoriesById.get(id)).filter(Boolean) : [];
      const fallbackTitle = card.title || cleanText(post?.title?.rendered || "Sin titulo");

      out.push({
        id: (post?.slug || slugify(fallbackTitle) || "wp-imported").slice(0, 80),
        title: fallbackTitle,
        area: inferArea(cats),
        level: inferLevel(cats),
        language: inferLanguage(cats, post || { title: { rendered: fallbackTitle }, content: { rendered: "" } }),
        url: card.externalUrl,
        notes: cleanText(post?.excerpt?.rendered || "Importado desde listado de WordPress"),
        source: card.postUrl || pageUrl
      });
    }
  }

  return out;
}

function extractPageCards(html, base) {
  const cards = [];
  const blocks = [...String(html || "").matchAll(/<div class="fp-col fp-post">([\s\S]*?)<\/div>\s*<\/div>/gi)];

  for (const block of blocks) {
    const chunk = block[1] || "";
    const hrefs = [...chunk.matchAll(/href\s*=\s*"([^"]+)"/gi)].map((m) => m[1]);
    const externalUrl = hrefs.find((u) => isExternalPlayableUrl(u, base));
    const postUrl = hrefs.find((u) => String(u).toLowerCase().includes(`${base.toLowerCase()}/`) && !String(u).toLowerCase().includes("wp-content"));
    const titleMatch = chunk.match(/<h4[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i);
    const title = cleanText(titleMatch?.[1] || "");

    if (!externalUrl) {
      continue;
    }

    cards.push({
      externalUrl,
      postUrl: postUrl || null,
      title: title || null
    });
  }

  return cards;
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

if (missingUrl.length > 0) {
  const missingPath = path.join(root, "data", "wordpress-missing-links.json");
  await fs.writeFile(missingPath, `${JSON.stringify(missingUrl, null, 2)}\n`, "utf8");
  console.log(`Listado de pendientes en data/wordpress-missing-links.json`);
}

async function readJsonArray(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error(`${path.basename(filePath)} debe ser un array`);
  }
  return data;
}

function mergeGames(existing, importedGames) {
  const byUrl = new Map(existing.map((g) => [normalizeUrl(g.url), g]));

  for (const item of importedGames) {
    const key = normalizeUrl(item.url);
    if (byUrl.has(key)) {
      continue;
    }

    byUrl.set(key, {
      id: ensureUniqueId(item.id, byUrl),
      title: item.title,
      area: item.area,
      level: item.level,
      language: item.language,
      url: item.url,
      notes: item.notes
    });
  }

  return [...byUrl.values()].sort((a, b) => a.title.localeCompare(b.title, "es"));
}

function ensureUniqueId(baseId, map) {
  const safe = String(baseId || "juego").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  let candidate = safe || "juego";
  let counter = 2;
  const idExists = (id) => [...map.values()].some((item) => item.id === id);

  while (idExists(candidate)) {
    candidate = `${safe}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function dedupeByUrl(items) {
  const seen = new Set();
  const out = [];

  for (const item of items) {
    const key = normalizeUrl(item.url);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(item);
  }

  return out;
}

function cleanText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(url) {
  return String(url || "").trim().toLowerCase();
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pickExternalUrlFromHtml(html, base) {
  const links = extractUrls(html);
  return pickBestPlayableUrl(links, base);
}

function extractUrls(input) {
  const text = String(input || "");
  const hrefMatches = [...text.matchAll(/href\s*=\s*"([^"]+)"/gi)].map((m) => m[1]);
  const bareMatches = [...text.matchAll(/https?:\/\/[^\s"'<>]+/gi)].map((m) => m[0]);
  return [...new Set([...hrefMatches, ...bareMatches])];
}

function extractScriptUrls(input) {
  const text = String(input || "");
  const scriptMatches = [...text.matchAll(/url\s*:\s*"(https?:\/\/[^"]+)"/gi)].map((m) => m[1]);
  return [...new Set(scriptMatches)];
}

function isExternalPlayableUrl(url, base) {
  if (!/^https?:\/\//i.test(url)) {
    return false;
  }

  const lower = url.toLowerCase();
  const blocked = [
    `${base.toLowerCase()}/wp-`,
    `${base.toLowerCase()}/?`,
    `${base.toLowerCase()}/feed`,
    "gmpg.org",
    "schema.org",
    "gravatar.com",
    "w.org",
    "wordpress.org",
    "creativethemes.com",
    "api.w.org",
    "addtoany.com",
    "facebook.com",
    "twitter.com",
    "mastodon",
    "mailto:",
    "javascript:"
  ];

  if (lower.includes(base.toLowerCase())) {
    return false;
  }

  if (blocked.some((part) => lower.includes(part))) {
    return false;
  }

  return true;
}

function pickBestPlayableUrl(urls, base) {
  const valid = urls.filter((url) => isExternalPlayableUrl(url, base));
  if (valid.length === 0) {
    return null;
  }

  const scored = valid
    .map((url) => ({ url, score: scoreUrl(url) }))
    .sort((a, b) => b.score - a.score);

  return scored[0].url;
}

function scoreUrl(url) {
  const lower = String(url).toLowerCase();
  let score = 0;

  if (lower.endsWith(".swf")) score += 60;
  if (lower.includes("/games") || lower.includes("/juego") || lower.includes("/play")) score += 25;
  if (lower.includes("scratch.mit.edu") || lower.includes("code.org") || lower.includes("incredibox") || lower.includes("edu")) score += 20;
  if (lower.includes("wp-content") || lower.match(/\.(png|jpg|jpeg|gif|webp)(\?|$)/)) score -= 50;
  if (lower.includes("/feed") || lower.includes("/category/") || lower.includes("/tag/")) score -= 30;

  return score;
}

async function extractExternalFromPostPage(postUrl, base) {
  try {
    const response = await fetch(postUrl, { redirect: "follow" });
    if (!response.ok) {
      return null;
    }
    const html = await response.text();
    const article = html.match(/<article[\s\S]*?<\/article>/i)?.[0]
      || html.match(/<main[\s\S]*?<\/main>/i)?.[0]
      || html;
    const links = extractUrls(article);
    const scriptUrls = extractScriptUrls(article);
    return pickBestPlayableUrl([...links, ...scriptUrls], base);
  } catch {
    return null;
  }
}

function inferArea(categories) {
  const slugs = categories.map((c) => c.slug.toLowerCase());

  if (slugs.some((s) => s.includes("musica"))) return "Musica";
  if (slugs.some((s) => s.includes("matematic") || s.includes("matematiques"))) return "Matematicas";
  if (slugs.some((s) => s.includes("lengua") || s.includes("lenguaje") || s.includes("llengua") || s.includes("llenguatge"))) return "Lengua";
  if (slugs.some((s) => s.includes("english"))) return "Ingles";
  if (slugs.some((s) => s.includes("conocimiento") || s.includes("medi") || s.includes("social") || s.includes("fisica"))) return "Sociales";

  return "General";
}

function inferLevel(categories) {
  const slugs = categories.map((c) => c.slug.toLowerCase());

  if (slugs.some((s) => s.includes("i3") || s.includes("i4") || s.includes("i5") || s.includes("infantil"))) return "Infantil";
  if (slugs.some((s) => s.includes("1y2") || s.includes("1r-i-2n"))) return "Primaria 1er ciclo";
  if (slugs.some((s) => s.includes("3y4") || s.includes("3r-i-4t"))) return "Primaria 2o ciclo";
  if (slugs.some((s) => s.includes("5y6") || s.includes("5e-i-6e"))) return "Primaria 3er ciclo";

  return "Primaria";
}

function inferLanguage(categories, post) {
  const slugs = categories.map((c) => c.slug.toLowerCase());
  const text = `${post.title?.rendered || ""} ${post.content?.rendered || ""}`.toLowerCase();

  if (slugs.some((s) => s.includes("english"))) return "Ingles";
  if (slugs.some((s) => s.includes("valencia") || s.includes("llengua") || s.includes("catala"))) return "Valenciano";
  if (text.includes("valencia") || text.includes("valenci")) return "Valenciano";

  return "Castellano";
}

async function fetchAllJson(initialUrl) {
  const first = await fetchJson(initialUrl);
  const totalPages = Number(first.totalPages || 1);
  const allItems = [...first.items];

  for (let page = 2; page <= totalPages; page += 1) {
    const url = `${initialUrl}&page=${page}`;
    const next = await fetchJson(url);
    allItems.push(...next.items);
  }

  return allItems;
}

async function fetchJson(url) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Error ${response.status} al cargar ${url}`);
  }

  const totalPagesHeader = response.headers.get("x-wp-totalpages");
  const totalPages = totalPagesHeader ? Number(totalPagesHeader) : 1;
  const items = await response.json();

  return {
    totalPages,
    items: Array.isArray(items) ? items : []
  };
}
