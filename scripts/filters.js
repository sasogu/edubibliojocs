import { areaLabel, languageLabel, levelLabel } from "./i18n.js";
import { state, REPORT_THRESHOLD } from "./state.js";

export function normalizeUrl(url) {
  return String(url || "").trim().toLowerCase();
}

export function normalizeSearch(str) {
  return String(str || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function editDistance(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  let row = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const next = [i];
    for (let j = 1; j <= n; j++) {
      next[j] = a[i - 1] === b[j - 1]
        ? row[j - 1]
        : 1 + Math.min(row[j], next[j - 1], row[j - 1]);
    }
    row = next;
  }
  return row[n];
}

// Allows 1 typo for words of 4-6 chars, 2 typos for 7+ chars.
export function fuzzyWordMatch(query, haystack) {
  if (haystack.includes(query)) return true;
  if (query.length < 4) return false;
  const maxErrors = query.length <= 6 ? 1 : 2;
  for (const word of haystack.split(/\s+/)) {
    if (Math.abs(word.length - query.length) > maxErrors + 1) continue;
    if (editDistance(query, word) <= maxErrors) return true;
  }
  return false;
}

export function buildReportIndex(results) {
  const index = new Map();
  for (const item of results) {
    if (!item?.url) continue;
    index.set(normalizeUrl(item.url), item);
  }
  return index;
}

export function isBrokenByReportItem(reportItem) {
  if (!reportItem || reportItem.ok) return false;
  return reportItem.severity === "error" || Number(reportItem.httpStatus || 0) >= 500;
}

export function gameKey(game) {
  const byUrl = normalizeUrl(game.url);
  if (byUrl) return byUrl;
  const fallback = [game.title, game.area, gameLanguages(game).join(", ")]
    .filter(Boolean).join("|").toLowerCase();
  return fallback || "untitled-game";
}

export function gameLanguages(game) {
  const raw = game?.languages || game?.language;
  const values = Array.isArray(raw) ? raw : [raw];
  return values.map((v) => String(v || "").trim()).filter(Boolean);
}

export function gameLanguageText(game) {
  const langs = gameLanguages(game);
  return langs.length > 0 ? langs.map(languageLabel).join(", ") : "";
}

export function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function uniqueLevelValues(items) {
  const all = items.flatMap((g) => g.levels || (g.level ? [g.level] : []));
  return [...new Set(all)].sort((a, b) => a.localeCompare(b));
}

export function uniqueLanguageValues(items) {
  const all = items.flatMap((g) => gameLanguages(g));
  return [...new Set(all)].sort((a, b) => a.localeCompare(b));
}

export function getRatingForFilter(gameKeyValue) {
  if (state.backendMode === "firebase") {
    return state.ratingSummary.get(gameKeyValue)?.avg || 0;
  }
  return state.userRatings.get(gameKeyValue) || 0;
}

export function computeFilteredGames(games, criteria) {
  const {
    term, selectedLevel, selectedLanguage, selectedArea,
    onlyFavorites, onlySubmissions, onlyBroken, onlyReported, minRating,
  } = criteria;
  const termWords = normalizeSearch(term).split(/\s+/).filter(Boolean);

  return games.filter((game) => {
    const key = gameKey(game);
    const filterRating = getRatingForFilter(key);
    const gameLevels = game.levels || (game.level ? [game.level] : []);
    const brokenData = state.brokenSummary.get(key);
    const reportItem = state.reportByUrl.get(normalizeUrl(game.url));
    const brokenByReport = isBrokenByReportItem(reportItem);
    const isBroken = (brokenData?.count || 0) >= REPORT_THRESHOLD
      || Boolean(brokenData?.adminReported)
      || brokenByReport;
    const hasReports = (brokenData?.count || 0) >= 1;

    if (onlyBroken) return isBroken;
    if (onlyReported) return hasReports && !isBroken;
    if (isBroken) return false;

    if (selectedLevel && !gameLevels.includes(selectedLevel)) return false;
    if (selectedLanguage && !gameLanguages(game).includes(selectedLanguage)) return false;
    if (selectedArea && game.area !== selectedArea) return false;

    if (termWords.length > 0) {
      const haystack = normalizeSearch([
        game.title, game.title_ca, game.area, areaLabel(game.area),
        game.notes, game.notes_ca,
        ...gameLanguages(game), ...gameLanguages(game).map(languageLabel),
        ...gameLevels, ...gameLevels.map(levelLabel),
      ].filter(Boolean).join(" "));
      if (!termWords.every((w) => fuzzyWordMatch(w, haystack))) return false;
    }

    if (onlyFavorites && !state.favorites.has(key)) return false;
    if (onlySubmissions && !game._isSubmission) return false;
    if (minRating > 0 && filterRating < minRating) return false;

    return true;
  });
}
