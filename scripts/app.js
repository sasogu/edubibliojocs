import { i18n, detectLang, setLang, getLang, LANGS } from "./i18n.js";

const dataUrl = "./data/games.json";
const reportUrl = "./reports/link-report.json";
const RUFFLE_CDN = "https://unpkg.com/@ruffle-rs/ruffle";
const DEFAULT_GAME_IMAGE = "./assets/game-images/generic-game.svg";

const searchInput = document.querySelector("#searchInput");
const levelFilter = document.querySelector("#levelFilter");
const languageFilter = document.querySelector("#languageFilter");
const areaFilter = document.querySelector("#areaFilter");
const brokenOnly = document.querySelector("#brokenOnly");
const grid = document.querySelector("#grid");
const resultCount = document.querySelector("#resultCount");
const emptyState = document.querySelector("#emptyState");
const statusStrip = document.querySelector("#statusStrip");

const state = {
  games: [],
  reportByUrl: new Map(),
  reportSummary: null,
  lastReport: null,
};

setLang(detectLang());

boot().catch((error) => {
  console.error("No se pudo iniciar la aplicacion", error);
  statusStrip.textContent = i18n("boot_error");
  statusStrip.classList.add("warn");
});

async function boot() {
  const games = await fetchJson(dataUrl);
  state.games = Array.isArray(games) ? games : [];

  const report = await fetchJson(reportUrl, true);
  if (report && Array.isArray(report.results)) {
    state.reportByUrl = buildReportIndex(report.results);
    state.reportSummary = report.summary || null;
    state.lastReport = report;
    setReportBanner(report);
  } else {
    statusStrip.textContent = i18n("status_no_report");
    statusStrip.classList.add("warn");
  }

  hydrateFilterOptions();
  applyStaticTranslations();
  updateLangButtons();
  wireEvents();
  render();
}

async function fetchJson(url, optional = false) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    if (optional) {
      return null;
    }
    throw new Error(`Fallo al cargar ${url}: ${response.status}`);
  }
  return response.json();
}

function buildReportIndex(results) {
  const index = new Map();
  for (const item of results) {
    if (!item?.url) {
      continue;
    }
    index.set(normalizeUrl(item.url), item);
  }
  return index;
}

function normalizeUrl(url) {
  return String(url || "").trim().toLowerCase();
}

function setReportBanner(report) {
  const checked = Number(report.summary?.checked || 0);
  const errorCount = Number(report.summary?.errorCount || 0);
  const warningCount = Number(report.summary?.warningCount || 0);
  const locale = getLang() === "ca" ? "ca" : "es-ES";
  const generatedAt = report.generatedAt ? new Date(report.generatedAt) : null;
  const dateText = generatedAt && !Number.isNaN(generatedAt.valueOf())
    ? generatedAt.toLocaleString(locale)
    : getLang() === "ca" ? "data desconeguda" : "fecha desconocida";

  statusStrip.classList.remove("warn", "ok");
  if (errorCount > 0 || warningCount > 0) {
    statusStrip.textContent = i18n("status_warn", checked, errorCount, warningCount, dateText);
    statusStrip.classList.add("warn");
    return;
  }

  statusStrip.textContent = i18n("status_ok", checked, dateText);
  statusStrip.classList.add("ok");
}

function hydrateFilterOptions() {
  fillSelect(levelFilter, uniqueLevelValues(state.games));
  fillSelect(languageFilter, uniqueValues(state.games, "language"));
  fillSelect(areaFilter, uniqueValues(state.games, "area"));
}

function uniqueLevelValues(items) {
  const all = items.flatMap((g) => g.levels || (g.level ? [g.level] : []));
  return [...new Set(all)].sort((a, b) => a.localeCompare(b));
}

function fillSelect(select, values) {
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
}

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function wireEvents() {
  searchInput.addEventListener("input", render);
  levelFilter.addEventListener("change", render);
  languageFilter.addEventListener("change", render);
  areaFilter.addEventListener("change", render);
  brokenOnly.addEventListener("change", render);
  document.querySelectorAll(".btn-lang").forEach((btn) => {
    btn.addEventListener("click", () => {
      setLang(btn.dataset.lang);
      updateLangButtons();
      applyStaticTranslations();
      if (state.lastReport) {
        setReportBanner(state.lastReport);
      } else {
        statusStrip.className = "status-strip warn";
        statusStrip.textContent = i18n("status_no_report");
      }
      render();
    });
  });
}

function updateLangButtons() {
  const lang = getLang();
  document.querySelectorAll(".btn-lang").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

function applyStaticTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = i18n(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = i18n(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    el.setAttribute("aria-label", i18n(el.dataset.i18nAriaLabel));
  });
}

function render() {
  const term = searchInput.value.trim().toLowerCase();
  const selectedLevel = levelFilter.value;
  const selectedLanguage = languageFilter.value;
  const selectedArea = areaFilter.value;
  const onlyBroken = brokenOnly.checked;

  const filtered = state.games.filter((game) => {
    const gameLevels = game.levels || (game.level ? [game.level] : []);

    if (selectedLevel && !gameLevels.includes(selectedLevel)) {
      return false;
    }

    if (selectedLanguage && game.language !== selectedLanguage) {
      return false;
    }

    if (selectedArea && game.area !== selectedArea) {
      return false;
    }

    if (term) {
      const haystack = [game.title, game.area, game.notes, game.language, ...gameLevels]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) {
        return false;
      }
    }

    const health = linkHealth(game.url);
    if (onlyBroken && health.ok !== false) {
      return false;
    }

    return true;
  });

  drawCards(filtered);
  resultCount.textContent = i18n("result_count", filtered.length, state.games.length);
  emptyState.classList.toggle("hidden", filtered.length > 0);
}

function linkHealth(url) {
  const item = state.reportByUrl.get(normalizeUrl(url));
  if (!item) {
    return { ok: null, text: i18n("not_checked") };
  }

  if (item.ok) {
    return { ok: true, text: i18n("link_ok", item.httpStatus || "200") };
  }

  if (item.severity === "warning") {
    const reason = item.error || `HTTP ${item.httpStatus || "warning"}`;
    return { ok: false, text: i18n("link_warn", reason) };
  }

  const reason = item.error || `HTTP ${item.httpStatus || "error"}`;
  return { ok: false, text: i18n("link_error", reason) };
}

function drawCards(items) {
  grid.innerHTML = "";

  for (const game of items) {
    const health = linkHealth(game.url);

    const article = document.createElement("article");
    article.className = `card ${health.ok === false ? "broken" : ""}`;

    const imageAction = createCardImageAction(game);
    article.appendChild(imageAction);

    const title = document.createElement("h3");
    title.textContent = game.title || i18n("no_title");

    const meta = document.createElement("div");
    meta.className = "meta";

    const area = tag(game.area || "General");
    const language = tag(game.language || "Idioma no definido", "lang");
    const gameLevels = game.levels || (game.level ? [game.level] : [i18n("no_level")]);
    const levelTags = gameLevels.map((l) => tag(l));
    const flashTag = game.flash ? [tag("Flash", "flash")] : [];

    meta.append(area, ...levelTags, language, ...flashTag);

    const note = document.createElement("p");
    note.className = "note";
    note.textContent = game.notes || i18n("no_notes");

    const healthText = document.createElement("p");
    healthText.className = "health";
    healthText.textContent = health.text;

    article.append(title, meta, note);
    if (health.ok !== true) {
      article.append(healthText);
    }
    grid.append(article);
  }
}

function createCardImageAction(game) {
  const image = document.createElement("img");
  image.className = "card-image";
  image.src = game.image || DEFAULT_GAME_IMAGE;
  image.alt = game.title || i18n("no_title");
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => {
    if (image.src.endsWith("generic-game.svg")) {
      return;
    }
    image.src = DEFAULT_GAME_IMAGE;
  });

  if (game.flash) {
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "card-image-link";
    trigger.title = i18n("play_ruffle");
    trigger.setAttribute("aria-label", i18n("play_ruffle"));
    trigger.addEventListener("click", () => openFlashDialog(game.url, game.title));
    trigger.appendChild(image);
    return trigger;
  }

  const link = document.createElement("a");
  link.className = "card-image-link";
  link.href = game.url;
  link.target = "_blank";
  link.rel = "noreferrer noopener";
  link.title = i18n("open_game");
  link.setAttribute("aria-label", i18n("open_game"));
  link.appendChild(image);
  return link;
}

function tag(text, extraClass = "") {
  const span = document.createElement("span");
  span.className = `tag ${extraClass}`.trim();
  span.textContent = text;
  return span;
}

// --- Ruffle / Flash player ---

const flashDialog = document.querySelector("#flashDialog");
const flashClose = document.querySelector("#flashClose");
const flashFullscreen = document.querySelector("#flashFullscreen");
const flashContainer = document.querySelector("#flashContainer");
const flashTitle = document.querySelector("#flashTitle");
let activeFlashPlayer = null;

flashClose.addEventListener("click", closeFlashDialog);
flashDialog.addEventListener("click", (e) => {
  if (e.target === flashDialog) closeFlashDialog();
});
document.addEventListener("keydown", handleFlashShortcuts);
if (flashFullscreen) {
  flashFullscreen.addEventListener("click", toggleFlashFullscreen);
}

async function openFlashDialog(url, title) {
  flashTitle.textContent = title;
  flashContainer.innerHTML = "";
  flashDialog.showModal();

  const ruffle = await loadRuffle();
  const flashUrl = await resolveFlashUrl(url);
  const player = ruffle.createPlayer();
  player.style.width = "100%";
  player.style.height = "100%";
  flashContainer.appendChild(player);
  activeFlashPlayer = player;
  player.addEventListener("dblclick", toggleFlashFullscreen);
  player.load({ url: flashUrl });
}

function closeFlashDialog() {
  if (document.fullscreenElement === activeFlashPlayer) {
    document.exitFullscreen().catch(() => {
      // Ignoramos errores al salir de fullscreen para no bloquear el cierre.
    });
  }
  flashDialog.close();
  flashContainer.innerHTML = "";
  activeFlashPlayer = null;
}

function handleFlashShortcuts(event) {
  if (!flashDialog.open) {
    return;
  }

  if (event.key.toLowerCase() === "f" && !event.ctrlKey && !event.altKey && !event.metaKey) {
    event.preventDefault();
    toggleFlashFullscreen();
  }
}

async function toggleFlashFullscreen() {
  if (!activeFlashPlayer || !document.fullscreenEnabled) {
    return;
  }

  if (document.fullscreenElement === activeFlashPlayer) {
    await document.exitFullscreen();
    return;
  }

  await activeFlashPlayer.requestFullscreen();
}

async function loadRuffle() {
  if (window.RufflePlayer) return window.RufflePlayer.newest();
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = RUFFLE_CDN;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return window.RufflePlayer.newest();
}

async function resolveFlashUrl(url) {
  const localCandidate = localFlashCandidate(url);
  if (!localCandidate) {
    return url;
  }

  try {
    const response = await fetch(localCandidate, {
      method: "HEAD",
      cache: "no-store"
    });
    if (response.ok) {
      return localCandidate;
    }
  } catch {
    // Si no existe en local o falla la consulta, seguimos con URL remota.
  }

  return url;
}

function localFlashCandidate(url) {
  if (!isLocalhost()) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const path = parsed.pathname || "";
    if (parsed.hostname !== "edutictac.es" || !path.startsWith("/inici/flash/") || !path.toLowerCase().endsWith(".swf")) {
      return null;
    }

    const fileName = path.split("/").pop();
    if (!fileName) {
      return null;
    }

    return `./assets/flash/${fileName}`;
  } catch {
    return null;
  }
}

function isLocalhost() {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}
