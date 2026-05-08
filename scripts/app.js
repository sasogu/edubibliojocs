import { i18n, areaLabel, languageLabel, levelLabel, detectLang, setLang, getLang } from "./i18n.js";
import { registerServiceWorker, updateSwVersionFromSource } from "./sw-manager.js";
import { initOfflineBanner, readFiltersFromUrl, syncFiltersToUrl } from "./url-state.js";
import { state } from "./state.js";
import {
  uniqueValues, uniqueLevelValues, uniqueLanguageValues,
  computeFilteredGames, buildReportIndex,
} from "./filters.js";
import { clearSelect, fillSelect, updateSelectLabels, buildCard } from "./render.js";
import {
  initPreferenceBackend, loadSubmissions,
  signInWithGoogle, signOutFromGoogle,
  toggleFavoritePreference, setRatingPreference, reportBroken,
  isAdmin, currentUserDisplayName,
} from "./firebase.js";

const dataUrl = "./data/games.json";
const homeDataUrl = "./data/games-home.json";
const reportUrl = "./reports/link-report.json";
const PAGE_SIZE = 48;

// DOM refs
const searchInput = document.querySelector("#searchInput");
const levelFilter = document.querySelector("#levelFilter");
const languageFilter = document.querySelector("#languageFilter");
const areaFilter = document.querySelector("#areaFilter");
const favoritesOnly = document.querySelector("#favoritesOnly");
const submissionsOnly = document.querySelector("#submissionsOnly");
const brokenOnly = document.querySelector("#brokenOnly");
const brokenOnlyLabel = document.querySelector("#brokenOnlyLabel");
const reportedOnly = document.querySelector("#reportedOnly");
const reportedOnlyLabel = document.querySelector("#reportedOnlyLabel");
const ratingFilter = document.querySelector("#ratingFilter");
const grid = document.querySelector("#grid");
const loadMoreBtn = document.querySelector("#loadMoreBtn");
const resultCount = document.querySelector("#resultCount");
const emptyState = document.querySelector("#emptyState");
const statusStrip = document.querySelector("#statusStrip");
const offlineBanner = document.querySelector("#offlineBanner");
const personalPrefsNote = document.querySelector("#personalPrefsNote");
const authPanel = document.querySelector("#authPanel");
const authStatus = document.querySelector("#authStatus");
const signInGoogleBtn = document.querySelector("#signInGoogleBtn");
const signOutBtn = document.querySelector("#signOutBtn");
const submitActivityBtn = document.querySelector("#submitActivityBtn");
const submitDialog = document.querySelector("#submitDialog");
const submitForm = document.querySelector("#submitForm");
const submitTitleInput = document.querySelector("#submitTitle");
const submitUrlInput = document.querySelector("#submitUrl");
const submitNotesInput = document.querySelector("#submitNotes");
const submitAreaSelect = document.querySelector("#submitArea");
const submitLanguageSelect = document.querySelector("#submitLanguage");
const submitCancelBtn = document.querySelector("#submitCancelBtn");
const submitFeedback = document.querySelector("#submitFeedback");
const submitSendBtn = document.querySelector("#submitSendBtn");

const cardDeps = {
  onFavoriteToggle: toggleFavoritePreference,
  onRatingSet: setRatingPreference,
  onReport: reportBroken,
  onRender: () => render(),
  favoritesOnlyEl: favoritesOnly,
};

setLang(detectLang());
registerServiceWorker();
updateSwVersionFromSource();
initOfflineBanner(offlineBanner, i18n);

// Let firebase.js notify app.js when auth state changes.
state._onAuthChange = () => {
  updateAuthUi();
  updatePreferencesNote();
};

boot().catch((error) => {
  console.error("No se pudo iniciar la aplicacion", error);
  statusStrip.textContent = i18n("boot_error");
  statusStrip.classList.add("warn");
});

async function boot() {
  const homeGames = await fetchJson(homeDataUrl);
  state.games = Array.isArray(homeGames) ? homeGames : [];
  state.isPartialLoad = true;

  await initPreferenceBackend();
  updateAuthUi();
  hydrateFilterOptions();
  applyStaticTranslations();
  updatePreferencesNote();
  updateLangButtons();
  wireEvents();
  readFiltersFromUrl({ searchInput, levelFilter, languageFilter, areaFilter, ratingFilter, favoritesOnly });
  render();

  if (state.firebase) {
    loadSubmissions()
      .then(() => { hydrateFilterOptions(); render(); })
      .catch((err) => console.warn("Error en carregar propostes", err));
  }

  Promise.all([
    fetchJson(dataUrl),
    fetchJson(reportUrl, true),
  ]).then(([games, report]) => {
    state.games = Array.isArray(games) ? games : state.games;
    state.isPartialLoad = false;

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
    render();
  }).catch((error) => {
    console.warn("Error en càrrega completa de dades", error);
  });
}

async function fetchJson(url, optional = false) {
  const response = await fetch(url, { cache: "default" });
  if (!response.ok) {
    if (optional) return null;
    throw new Error(`Fallo al cargar ${url}: ${response.status}`);
  }
  return response.json();
}

function allGames() {
  return state.submissions.length > 0 ? [...state.games, ...state.submissions] : state.games;
}

function hydrateFilterOptions() {
  const games = allGames();
  const saved = { level: levelFilter.value, language: languageFilter.value, area: areaFilter.value };
  clearSelect(levelFilter);
  clearSelect(languageFilter);
  clearSelect(areaFilter);
  fillSelect(levelFilter, uniqueLevelValues(games), levelLabel);
  fillSelect(languageFilter, uniqueLanguageValues(games), languageLabel);
  fillSelect(areaFilter, uniqueValues(games, "area"), areaLabel);
  levelFilter.value = saved.level;
  languageFilter.value = saved.language;
  areaFilter.value = saved.area;
}

function updateDynamicFilterLabels() {
  updateSelectLabels(levelFilter, levelLabel);
  updateSelectLabels(languageFilter, languageLabel);
  updateSelectLabels(areaFilter, areaLabel);
}

function render() {
  const criteria = {
    term: searchInput.value.trim(),
    selectedLevel: levelFilter.value,
    selectedLanguage: languageFilter.value,
    selectedArea: areaFilter.value,
    onlyFavorites: favoritesOnly.checked,
    onlySubmissions: submissionsOnly?.checked,
    onlyBroken: brokenOnly?.checked,
    onlyReported: reportedOnly?.checked,
    minRating: Number(ratingFilter.value || 0),
  };
  const games = allGames();
  state.filtered = computeFilteredGames(games, criteria);
  state.visibleCount = 0;
  grid.innerHTML = "";
  showMore();
  resultCount.textContent = i18n("result_count", state.filtered.length, games.length);
  emptyState.classList.toggle("hidden", state.filtered.length > 0);
  syncFiltersToUrl({ searchInput, levelFilter, languageFilter, areaFilter, ratingFilter, favoritesOnly });
}

function showMore() {
  const batch = state.filtered.slice(state.visibleCount, state.visibleCount + PAGE_SIZE);
  for (const game of batch) {
    grid.append(buildCard(game, cardDeps));
  }
  state.visibleCount += batch.length;
  const remaining = state.filtered.length - state.visibleCount;
  loadMoreBtn.classList.toggle("hidden", remaining <= 0);
  if (remaining > 0) loadMoreBtn.textContent = i18n("load_more", remaining);
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

function updateAuthUi() {
  if (!authPanel || !authStatus || !signInGoogleBtn || !signOutBtn) return;

  if (state.backendMode !== "firebase" || !state.firebase) {
    authPanel.classList.add("hidden");
    authStatus.textContent = i18n("auth_status_local");
    if (submitActivityBtn) submitActivityBtn.classList.add("hidden");
    return;
  }

  authPanel.classList.remove("hidden");
  const user = state.firebase.auth.currentUser;
  const googleEnabled = Boolean(state.firebase.googleAuthEnabled);
  const isAnonymous = !user || user.isAnonymous;

  if (!state.authReady) {
    authStatus.textContent = i18n("auth_loading");
    signInGoogleBtn.classList.add("hidden");
    signOutBtn.classList.add("hidden");
    if (submitActivityBtn) submitActivityBtn.classList.add("hidden");
    return;
  }

  if (isAnonymous) {
    authStatus.textContent = googleEnabled
      ? i18n("auth_status_google_available")
      : i18n("auth_status_google_disabled");
    signInGoogleBtn.classList.toggle("hidden", !googleEnabled);
    signOutBtn.classList.add("hidden");
    if (submitActivityBtn) submitActivityBtn.classList.add("hidden");
    return;
  }

  authStatus.textContent = i18n("auth_status_google", currentUserDisplayName(user));
  signInGoogleBtn.classList.add("hidden");
  signOutBtn.classList.remove("hidden");
  if (submitActivityBtn) submitActivityBtn.classList.remove("hidden");
  if (brokenOnlyLabel) brokenOnlyLabel.classList.toggle("hidden", !isAdmin());
  if (reportedOnlyLabel) reportedOnlyLabel.classList.toggle("hidden", !isAdmin());
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

function updatePreferencesNote() {
  if (!personalPrefsNote) return;
  const isGoogleUser = state.backendMode === "firebase"
    && state.firebase?.auth.currentUser
    && !state.firebase.auth.currentUser.isAnonymous;
  const key = isGoogleUser ? "personal_prefs_note_firebase" : "personal_prefs_note_local";
  personalPrefsNote.textContent = i18n(key);
  personalPrefsNote.classList.toggle("remote", isGoogleUser);
}

function wireEvents() {
  searchInput.addEventListener("input", render);
  levelFilter.addEventListener("change", render);
  languageFilter.addEventListener("change", render);
  areaFilter.addEventListener("change", render);
  favoritesOnly.addEventListener("change", render);
  if (submissionsOnly) submissionsOnly.addEventListener("change", render);
  if (brokenOnly) brokenOnly.addEventListener("change", render);
  if (reportedOnly) reportedOnly.addEventListener("change", render);
  ratingFilter.addEventListener("change", render);
  loadMoreBtn.addEventListener("click", showMore);

  if (signInGoogleBtn) {
    signInGoogleBtn.addEventListener("click", async () => {
      signInGoogleBtn.disabled = true;
      try {
        await signInWithGoogle();
        render();
      } catch (error) {
        console.error(i18n("auth_error_google"), error);
      } finally {
        signInGoogleBtn.disabled = false;
        updateAuthUi();
      }
    });
  }

  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      signOutBtn.disabled = true;
      try {
        await signOutFromGoogle();
        render();
      } catch (error) {
        console.error("No se pudo cerrar sesion", error);
      } finally {
        signOutBtn.disabled = false;
        updateAuthUi();
      }
    });
  }

  if (submitActivityBtn) submitActivityBtn.addEventListener("click", openSubmitDialog);
  if (submitCancelBtn) submitCancelBtn.addEventListener("click", () => submitDialog?.close());
  if (submitDialog) {
    submitDialog.addEventListener("click", (e) => {
      if (e.target === submitDialog) submitDialog.close();
    });
  }
  if (submitForm) submitForm.addEventListener("submit", handleSubmitForm);

  document.querySelectorAll(".btn-lang").forEach((btn) => {
    btn.addEventListener("click", () => {
      setLang(btn.dataset.lang);
      updateLangButtons();
      applyStaticTranslations();
      updateDynamicFilterLabels();
      updatePreferencesNote();
      updateAuthUi();
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

// --- Submit dialog ---

function openSubmitDialog() {
  if (!submitDialog) return;
  const games = allGames();
  clearSelect(submitAreaSelect);
  fillSelect(submitAreaSelect, uniqueValues(games, "area"), areaLabel);
  clearSelect(submitLanguageSelect);
  fillSelect(submitLanguageSelect, uniqueLanguageValues(games), languageLabel);
  submitForm?.reset();
  if (submitFeedback) {
    submitFeedback.className = "submit-feedback hidden";
    submitFeedback.textContent = "";
  }
  submitDialog.showModal();
}

async function handleSubmitForm(e) {
  e.preventDefault();
  if (!state.firebase) return;

  const { auth, addDoc, collection, db, serverTimestamp } = state.firebase;
  const user = auth.currentUser;
  if (!user || user.isAnonymous) return;

  const title = submitTitleInput?.value.trim() || "";
  const url = submitUrlInput?.value.trim() || "";
  const notes = submitNotesInput?.value.trim() || "";
  const area = submitAreaSelect?.value || "General";
  const language = submitLanguageSelect?.value || "";

  if (!title || !url) return;

  if (submitSendBtn) submitSendBtn.disabled = true;
  showSubmitFeedback(i18n("submit_loading"), "");

  try {
    await addDoc(collection(db, "submissions"), {
      title, url, notes, area, language,
      submittedBy: { uid: user.uid, name: user.displayName || user.email || "" },
      submittedAt: serverTimestamp(),
    });
    showSubmitFeedback(i18n("submit_success"), "ok");
    submitForm?.reset();
    await loadSubmissions();
    hydrateFilterOptions();
    render();
    setTimeout(() => submitDialog?.close(), 1800);
  } catch (error) {
    console.error("Error en enviar proposta", error);
    showSubmitFeedback(i18n("submit_error"), "error");
  } finally {
    if (submitSendBtn) submitSendBtn.disabled = false;
  }
}

function showSubmitFeedback(text, type) {
  if (!submitFeedback) return;
  submitFeedback.textContent = text;
  submitFeedback.className = `submit-feedback${type ? ` ${type}` : ""}`;
}
