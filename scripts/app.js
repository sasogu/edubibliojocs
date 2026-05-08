import { i18n, areaLabel, languageLabel, levelLabel, detectLang, setLang, getLang, LANGS } from "./i18n.js";

const dataUrl = "./data/games.json";
const homeDataUrl = "./data/games-home.json";
const reportUrl = "./reports/link-report.json";
const RUFFLE_CDN = "https://unpkg.com/@ruffle-rs/ruffle";
const DEFAULT_GAME_IMAGE = "./assets/game-images/generic-game.svg";
const PAGE_SIZE = 48;
const FAVORITES_STORAGE_KEY = "bibliojocs-favorites";
const RATINGS_STORAGE_KEY = "bibliojocs-ratings";
const REPORT_THRESHOLD = 3;
const FIREBASE_CONFIG_MODULE = "../firebase-config.js";

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
const swVersion = document.querySelector("#swVersion");

const state = {
  games: [],
  submissions: [],
  filtered: [],
  visibleCount: 0,
  isPartialLoad: false,
  reportByUrl: new Map(),
  reportSummary: null,
  lastReport: null,
  favorites: new Set(),
  userRatings: new Map(),
  ratingSummary: new Map(),
  userReports: new Set(),
  brokenSummary: new Map(),
  adminEmail: "",
  backendMode: "local",
  firebase: null,
  authReady: false,
};

setLang(detectLang());
registerServiceWorker();
updateSwVersionFromSource();

boot().catch((error) => {
  console.error("No se pudo iniciar la aplicacion", error);
  statusStrip.textContent = i18n("boot_error");
  statusStrip.classList.add("warn");
});

async function boot() {
  // Fase 1: càrrega immediata del subconjunt inicial
  const homeGames = await fetchJson(homeDataUrl);
  state.games = Array.isArray(homeGames) ? homeGames : [];
  state.isPartialLoad = true;

  await initPreferenceBackend();
  hydrateFilterOptions();
  applyStaticTranslations();
  updatePreferencesNote();
  updateLangButtons();
  wireEvents();
  render();

  // Fase 2: càrrega completa en segon pla (no bloqueja la UI)
  if (state.firebase) {
    loadSubmissions().catch((err) => console.warn("Error en carregar propostes", err));
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
    if (optional) {
      return null;
    }
    throw new Error(`Fallo al cargar ${url}: ${response.status}`);
  }
  return response.json();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "SW_VERSION") {
      setSwVersion(event.data.version);
    }
  });

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js");
      requestSwVersion(registration);
    } catch (error) {
      console.warn("No se pudo registrar el service worker", error);
    }
  });
}

async function updateSwVersionFromSource() {
  if (!swVersion) {
    return;
  }

  try {
    const response = await fetch("./sw.js", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const source = await response.text();
    const match = source.match(/CACHE_NAME\s*=\s*["']([^"']+)["']/);
    if (match?.[1]) {
      setSwVersion(match[1]);
    }
  } catch (error) {
    console.warn("No se pudo leer la version del service worker", error);
  }
}

function requestSwVersion(registration) {
  const worker = registration.active || registration.waiting || registration.installing || navigator.serviceWorker.controller;
  if (worker) {
    worker.postMessage({ type: "GET_SW_VERSION" });
  }
}

function setSwVersion(version) {
  if (!swVersion || !version) {
    return;
  }

  swVersion.textContent = `SW ${version}`;
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

function allGames() {
  return state.submissions.length > 0 ? [...state.games, ...state.submissions] : state.games;
}

function hydrateFilterOptions() {
  const games = allGames();
  clearSelect(levelFilter);
  clearSelect(languageFilter);
  clearSelect(areaFilter);
  fillSelect(levelFilter, uniqueLevelValues(games), levelLabel);
  fillSelect(languageFilter, uniqueLanguageValues(games), languageLabel);
  fillSelect(areaFilter, uniqueValues(games, "area"), areaLabel);
}

function clearSelect(select) {
  select.querySelectorAll("option:not([value=''])").forEach((o) => o.remove());
}

function uniqueLevelValues(items) {
  const all = items.flatMap((g) => g.levels || (g.level ? [g.level] : []));
  return [...new Set(all)].sort((a, b) => a.localeCompare(b));
}

function uniqueLanguageValues(items) {
  const all = items.flatMap((game) => gameLanguages(game));
  return [...new Set(all)].sort((a, b) => a.localeCompare(b));
}

function fillSelect(select, values, formatLabel = (value) => value) {
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = formatLabel(value);
    select.append(option);
  }
}

function updateSelectLabels(select, formatLabel) {
  select.querySelectorAll("option").forEach((option) => {
    if (option.value) {
      option.textContent = formatLabel(option.value);
    }
  });
}

function updateDynamicFilterLabels() {
  updateSelectLabels(levelFilter, levelLabel);
  updateSelectLabels(languageFilter, languageLabel);
  updateSelectLabels(areaFilter, areaLabel);
}

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function gameLanguages(game) {
  const raw = game?.languages || game?.language;
  const values = Array.isArray(raw) ? raw : [raw];
  return values.map((value) => String(value || "").trim()).filter(Boolean);
}

function gameLanguageText(game) {
  const languages = gameLanguages(game);
  return languages.length > 0 ? languages.map(languageLabel).join(", ") : "";
}

function wireEvents() {
  searchInput.addEventListener("input", render);
  levelFilter.addEventListener("change", render);
  languageFilter.addEventListener("change", render);
  areaFilter.addEventListener("change", render);
  favoritesOnly.addEventListener("change", render);
  if (submissionsOnly) {
    submissionsOnly.addEventListener("change", render);
  }
  if (brokenOnly) {
    brokenOnly.addEventListener("change", render);
  }
  if (reportedOnly) {
    reportedOnly.addEventListener("change", render);
  }
  ratingFilter.addEventListener("change", render);
  loadMoreBtn.addEventListener("click", showMore);
  if (signInGoogleBtn) {
    signInGoogleBtn.addEventListener("click", signInWithGoogle);
  }
  if (signOutBtn) {
    signOutBtn.addEventListener("click", signOutFromGoogle);
  }
  if (submitActivityBtn) {
    submitActivityBtn.addEventListener("click", openSubmitDialog);
  }
  if (submitCancelBtn) {
    submitCancelBtn.addEventListener("click", () => submitDialog?.close());
  }
  if (submitDialog) {
    submitDialog.addEventListener("click", (e) => {
      if (e.target === submitDialog) submitDialog.close();
    });
  }
  if (submitForm) {
    submitForm.addEventListener("submit", handleSubmitForm);
  }
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
  if (!personalPrefsNote) {
    return;
  }

  const isGoogleUser = state.backendMode === "firebase"
    && state.firebase?.auth.currentUser
    && !state.firebase.auth.currentUser.isAnonymous;
  const key = isGoogleUser ? "personal_prefs_note_firebase" : "personal_prefs_note_local";
  personalPrefsNote.textContent = i18n(key);
  personalPrefsNote.classList.toggle("remote", isGoogleUser);
}

function isAdmin() {
  if (!state.firebase || !state.adminEmail) return false;
  const user = state.firebase.auth.currentUser;
  return Boolean(user && user.email === state.adminEmail);
}

function currentUserDisplayName(user) {
  const raw = user?.displayName || user?.email || user?.phoneNumber || "";
  const trimmed = String(raw).trim();
  if (trimmed) {
    return trimmed;
  }
  return i18n("auth_status_anon");
}

function updateAuthUi() {
  if (!authPanel || !authStatus || !signInGoogleBtn || !signOutBtn) {
    return;
  }

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

function render() {
  const games = allGames();
  const term = searchInput.value.trim().toLowerCase();
  const selectedLevel = levelFilter.value;
  const selectedLanguage = languageFilter.value;
  const selectedArea = areaFilter.value;
  const onlyFavorites = favoritesOnly.checked;
  const onlySubmissions = submissionsOnly?.checked;
  const onlyBroken = brokenOnly?.checked;
  const onlyReported = reportedOnly?.checked;
  const minRating = Number(ratingFilter.value || 0);

  const filtered = games.filter((game) => {
    const key = gameKey(game);
    const filterRating = getRatingForFilter(key);
    const gameLevels = game.levels || (game.level ? [game.level] : []);
    const brokenData = state.brokenSummary.get(key);
    const isBroken = (brokenData?.count || 0) >= REPORT_THRESHOLD || Boolean(brokenData?.adminReported);

    const hasReports = (brokenData?.count || 0) >= 1;

    if (onlyBroken) {
      return isBroken;
    }
    if (onlyReported) {
      return hasReports && !isBroken;
    }
    if (isBroken) {
      return false;
    }

    if (selectedLevel && !gameLevels.includes(selectedLevel)) {
      return false;
    }

    if (selectedLanguage && !gameLanguages(game).includes(selectedLanguage)) {
      return false;
    }

    if (selectedArea && game.area !== selectedArea) {
      return false;
    }

    if (term) {
      const haystack = [
        game.title,
        game.title_ca,
        game.area,
        areaLabel(game.area),
        game.notes,
        game.notes_ca,
        ...gameLanguages(game),
        ...gameLanguages(game).map(languageLabel),
        ...gameLevels,
        ...gameLevels.map(levelLabel)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) {
        return false;
      }
    }

    if (onlyFavorites && !state.favorites.has(key)) {
      return false;
    }

    if (onlySubmissions && !game._isSubmission) {
      return false;
    }

    if (minRating > 0 && filterRating < minRating) {
      return false;
    }

    return true;
  });

  state.filtered = filtered;
  state.visibleCount = 0;
  grid.innerHTML = "";
  showMore();
  resultCount.textContent = i18n("result_count", filtered.length, games.length);
  emptyState.classList.toggle("hidden", filtered.length > 0);
}

function gameKey(game) {
  const byUrl = normalizeUrl(game.url);
  if (byUrl) {
    return byUrl;
  }

  const fallback = [game.title, game.area, gameLanguages(game).join(", ")]
    .filter(Boolean)
    .join("|")
    .toLowerCase();
  return fallback || "untitled-game";
}

function gameDocId(gameKeyValue) {
  return encodeURIComponent(gameKeyValue);
}

function gameKeyFromDocId(docId) {
  try {
    return decodeURIComponent(docId);
  } catch {
    return docId;
  }
}

function getRatingForFilter(gameKeyValue) {
  if (state.backendMode === "firebase") {
    return state.ratingSummary.get(gameKeyValue)?.avg || 0;
  }
  return state.userRatings.get(gameKeyValue) || 0;
}

function hasUsableFirebaseConfig(firebaseConfig, firebaseSettings) {
  if (!firebaseSettings?.enabled) {
    return false;
  }

  const needed = ["apiKey", "authDomain", "projectId", "appId"];
  return needed.every((field) => {
    const value = String(firebaseConfig?.[field] || "").trim();
    return value && !value.startsWith("YOUR_");
  });
}

async function initPreferenceBackend() {
  loadLocalPreferences();
  updateAuthUi();

  try {
    const configModule = await import(FIREBASE_CONFIG_MODULE);
    const firebaseConfig = configModule.firebaseConfig || null;
    const firebaseSettings = configModule.firebaseSettings || { enabled: false };

    if (!hasUsableFirebaseConfig(firebaseConfig, firebaseSettings)) {
      state.backendMode = "local";
      updatePreferencesNote();
      return;
    }

    const appModule = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js");
    const authModule = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js");
    const firestoreModule = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js");

    const app = appModule.initializeApp(firebaseConfig);
    const auth = authModule.getAuth(app);
    const googleAuthEnabled = Boolean(firebaseSettings.googleAuthEnabled);
    state.adminEmail = String(firebaseSettings.adminEmail || "").trim();

    if (!auth.currentUser) {
      await authModule.signInAnonymously(auth).catch(() => {});
    }

    const db = firestoreModule.getFirestore(app);

    state.firebase = {
      db,
      auth,
      addDoc: firestoreModule.addDoc,
      collection: firestoreModule.collection,
      deleteDoc: firestoreModule.deleteDoc,
      doc: firestoreModule.doc,
      getDocs: firestoreModule.getDocs,
      runTransaction: firestoreModule.runTransaction,
      serverTimestamp: firestoreModule.serverTimestamp,
      setDoc: firestoreModule.setDoc,
      signInAnonymously: authModule.signInAnonymously,
      signInWithPopup: authModule.signInWithPopup,
      signOut: authModule.signOut,
      GoogleAuthProvider: authModule.GoogleAuthProvider,
      googleAuthEnabled,
    };

    state.authReady = true;
    authModule.onAuthStateChanged(auth, () => {
      if (state.authReady) {
        updateAuthUi();
      }
    });
    await loadFirebasePreferences();
    state.backendMode = "firebase";
    updatePreferencesNote();
    updateAuthUi();
  } catch (error) {
    console.warn("No se pudo activar Firebase, se mantiene modo local.", error);
    state.backendMode = "local";
    state.authReady = false;
    updatePreferencesNote();
    updateAuthUi();
  }
}

async function refreshFirebaseUserData() {
  state.favorites = new Set();
  state.userRatings = new Map();
  state.ratingSummary = new Map();
  state.userReports = new Set();
  state.brokenSummary = new Map();
  await loadFirebasePreferences();
}

async function signInWithGoogle() {
  if (!state.firebase || !state.firebase.googleAuthEnabled || !signInGoogleBtn) {
    return;
  }

  signInGoogleBtn.disabled = true;
  try {
    const { auth, GoogleAuthProvider, signInWithPopup } = state.firebase;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
    await refreshFirebaseUserData();
    render();
  } catch (error) {
    console.error(i18n("auth_error_google"), error);
  } finally {
    signInGoogleBtn.disabled = false;
    updateAuthUi();
  }
}

async function signOutFromGoogle() {
  if (!state.firebase || !signOutBtn) {
    return;
  }

  signOutBtn.disabled = true;
  try {
    const { auth, signInAnonymously, signOut } = state.firebase;
    await signOut(auth);
    await signInAnonymously(auth).catch(() => {});
    await refreshFirebaseUserData();
    render();
  } catch (error) {
    console.error("No se pudo cerrar sesion", error);
  } finally {
    signOutBtn.disabled = false;
    updateAuthUi();
  }
}

function loadLocalPreferences() {
  try {
    const favoritesRaw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (favoritesRaw) {
      const parsedFavorites = JSON.parse(favoritesRaw);
      if (Array.isArray(parsedFavorites)) {
        state.favorites = new Set(parsedFavorites.filter(Boolean));
      }
    }
  } catch {
    state.favorites = new Set();
  }

  try {
    const ratingsRaw = localStorage.getItem(RATINGS_STORAGE_KEY);
    if (ratingsRaw) {
      const parsedRatings = JSON.parse(ratingsRaw);
      if (parsedRatings && typeof parsedRatings === "object") {
        const entries = Object.entries(parsedRatings)
          .filter(([key, value]) => key && Number.isFinite(Number(value)) && Number(value) >= 1 && Number(value) <= 5)
          .map(([key, value]) => [key, Number(value)]);
        state.userRatings = new Map(entries);
      }
    }
  } catch {
    state.userRatings = new Map();
  }
}

function persistLocalFavorites() {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...state.favorites]));
}

function persistLocalRatings() {
  const serialized = Object.fromEntries(state.userRatings.entries());
  localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(serialized));
}

async function loadFirebasePreferences() {
  if (!state.firebase) {
    return;
  }

  const { auth, collection, db, getDocs } = state.firebase;

  // brokenReports es una colección global: se carga siempre, con o sin sesión,
  // para que los usuarios no logueados tampoco vean actividades reportadas.
  try {
    const brokenSnapshot = await getDocs(collection(db, "brokenReports"));
    state.brokenSummary = new Map(
      brokenSnapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() || {};
          const count = Number(data.count || 0);
          const adminReported = Boolean(data.adminReported);
          const key = gameKeyFromDocId(docSnap.id);
          return [key, { count, adminReported }];
        })
        .filter(([key, data]) => key && (data.count > 0 || data.adminReported)),
    );
  } catch {
    // Si las reglas de Firestore no permiten lectura pública, brokenSummary queda vacío.
  }

  const uid = auth.currentUser?.uid;
  if (!uid) {
    return;
  }

  const [favSnapshot, ratingSnapshot, summarySnapshot, reportSnapshot, brokenUserSnapshot] = await Promise.all([
    getDocs(collection(db, "users", uid, "favorites")),
    getDocs(collection(db, "users", uid, "ratings")),
    getDocs(collection(db, "ratingSummary")),
    getDocs(collection(db, "users", uid, "reports")),
    getDocs(collection(db, "brokenReports")),
  ]);

  state.favorites = new Set(
    favSnapshot.docs.map((docSnap) => gameKeyFromDocId(docSnap.id)).filter(Boolean),
  );

  state.userRatings = new Map(
    ratingSnapshot.docs
      .map((docSnap) => [gameKeyFromDocId(docSnap.id), Number(docSnap.data()?.value || 0)])
      .filter(([key, value]) => key && Number.isFinite(value) && value >= 1 && value <= 5),
  );

  state.ratingSummary = new Map(
    summarySnapshot.docs
      .map((docSnap) => {
        const data = docSnap.data() || {};
        const count = Number(data.count || 0);
        const avg = Number(data.avg || 0);
        const key = gameKeyFromDocId(docSnap.id);
        return [key, { avg, count }];
      })
      .filter(([key, summary]) => key && Number.isFinite(summary.avg) && Number.isFinite(summary.count) && summary.count > 0),
  );

  state.userReports = new Set(
    reportSnapshot.docs.map((docSnap) => gameKeyFromDocId(docSnap.id)).filter(Boolean),
  );

  // Refrescar brokenSummary con los datos más recientes (sesión activa)
  state.brokenSummary = new Map(
    brokenUserSnapshot.docs
      .map((docSnap) => {
        const data = docSnap.data() || {};
        const count = Number(data.count || 0);
        const adminReported = Boolean(data.adminReported);
        const key = gameKeyFromDocId(docSnap.id);
        return [key, { count, adminReported }];
      })
      .filter(([key, data]) => key && (data.count > 0 || data.adminReported)),
  );
}

async function toggleFavoritePreference(gameKeyValue) {
  if (state.backendMode !== "firebase" || !state.firebase) {
    if (state.favorites.has(gameKeyValue)) {
      state.favorites.delete(gameKeyValue);
    } else {
      state.favorites.add(gameKeyValue);
    }
    persistLocalFavorites();
    return state.favorites.has(gameKeyValue);
  }

  const { auth, db, deleteDoc, doc, serverTimestamp, setDoc } = state.firebase;
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return state.favorites.has(gameKeyValue);
  }

  const ref = doc(db, "users", uid, "favorites", gameDocId(gameKeyValue));
  if (state.favorites.has(gameKeyValue)) {
    await deleteDoc(ref);
    state.favorites.delete(gameKeyValue);
  } else {
    await setDoc(ref, { updatedAt: serverTimestamp() }, { merge: true });
    state.favorites.add(gameKeyValue);
  }

  return state.favorites.has(gameKeyValue);
}

async function setRatingPreference(gameKeyValue, requestedRating) {
  const clamped = Math.max(0, Math.min(5, Number(requestedRating) || 0));
  const current = state.userRatings.get(gameKeyValue) || 0;
  const next = current === clamped ? 0 : clamped;

  if (state.backendMode !== "firebase" || !state.firebase) {
    if (next > 0) {
      state.userRatings.set(gameKeyValue, next);
    } else {
      state.userRatings.delete(gameKeyValue);
    }
    persistLocalRatings();
    return next;
  }

  const { auth, db, doc, runTransaction, serverTimestamp, signInAnonymously } = state.firebase;
  let uid = auth.currentUser?.uid;
  if (!uid) {
    try {
      const result = await signInAnonymously(auth);
      uid = result.user?.uid;
    } catch {
      // Firebase Anonymous Auth no disponible; guardar solo en local
      if (next > 0) {
        state.userRatings.set(gameKeyValue, next);
      } else {
        state.userRatings.delete(gameKeyValue);
      }
      persistLocalRatings();
      return next;
    }
  }
  if (!uid) {
    return current;
  }

  const ratingRef = doc(db, "users", uid, "ratings", gameDocId(gameKeyValue));
  const summaryRef = doc(db, "ratingSummary", gameDocId(gameKeyValue));

  await runTransaction(db, async (tx) => {
    const summarySnap = await tx.get(summaryRef);
    const data = summarySnap.exists() ? summarySnap.data() : {};
    let sum = Number(data.sum || 0);
    let count = Number(data.count || 0);

    if (current > 0) {
      sum -= current;
      count -= 1;
    }

    if (next > 0) {
      sum += next;
      count += 1;
      tx.set(ratingRef, { value: next, updatedAt: serverTimestamp() }, { merge: true });
    } else {
      tx.delete(ratingRef);
    }

    if (count <= 0) {
      tx.delete(summaryRef);
      return;
    }

    tx.set(summaryRef, {
      sum,
      count,
      avg: Number((sum / count).toFixed(2)),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  if (next > 0) {
    state.userRatings.set(gameKeyValue, next);
  } else {
    state.userRatings.delete(gameKeyValue);
  }

  const existingSummary = state.ratingSummary.get(gameKeyValue) || { avg: 0, count: 0 };
  let sum = existingSummary.avg * existingSummary.count;
  let count = existingSummary.count;
  if (current > 0) {
    sum -= current;
    count -= 1;
  }
  if (next > 0) {
    sum += next;
    count += 1;
  }

  if (count <= 0) {
    state.ratingSummary.delete(gameKeyValue);
  } else {
    state.ratingSummary.set(gameKeyValue, {
      avg: Number((sum / count).toFixed(2)),
      count,
    });
  }

  return next;
}

function formatRatingSummary(summary) {
  if (!summary || !summary.count) {
    return i18n("rating_no_votes");
  }
  return i18n("rating_avg", summary.avg.toFixed(1), summary.count);
}

function showMore() {
  const batch = state.filtered.slice(state.visibleCount, state.visibleCount + PAGE_SIZE);
  for (const game of batch) {
    grid.append(buildCard(game));
  }
  state.visibleCount += batch.length;
  const remaining = state.filtered.length - state.visibleCount;
  loadMoreBtn.classList.toggle("hidden", remaining <= 0);
  if (remaining > 0) {
    loadMoreBtn.textContent = i18n("load_more", remaining);
  }
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

function localizedTitle(game) {
  return getLang() === "ca" ? (game.title_ca || game.title) : game.title;
}

function localizedNotes(game) {
  return getLang() === "ca" ? (game.notes_ca || game.notes) : game.notes;
}

function buildCard(game) {
  const health = linkHealth(game.url);
  const key = gameKey(game);
  const isFavorite = state.favorites.has(key);
  const userRating = state.userRatings.get(key) || 0;
  const ratingSummary = state.ratingSummary.get(key) || null;

  const article = document.createElement("article");
  const cardClasses = ["card"];
  if (game._isSubmission) cardClasses.push("submission");
  if (health.ok === false) cardClasses.push("broken");
  article.className = cardClasses.join(" ");

  const imageAction = createCardImageAction(game);
  article.appendChild(imageAction);

  const title = document.createElement("h3");
  title.textContent = localizedTitle(game) || i18n("no_title");

  const cardHead = document.createElement("div");
  cardHead.className = "card-head";
  const reportBtn = createReportButton(key, article);
  const cardHeadButtons = [createFavoriteButton(key, isFavorite)];
  if (reportBtn) cardHeadButtons.push(reportBtn);
  cardHead.append(title, ...cardHeadButtons);

  const meta = document.createElement("div");
  meta.className = "meta";

  const area = tag(areaLabel(game.area || "General"));
  const language = tag(gameLanguageText(game) || "Idioma no definido", "lang");
  const gameLevels = game.levels || (game.level ? [game.level] : [i18n("no_level")]);
  const levelTags = gameLevels.map((l) => tag(levelLabel(l)));
  const flashTag = game.flash ? [tag("Flash", "flash")] : [];
  const submissionTag = game._isSubmission ? [tag(i18n("submission_badge"), "submission")] : [];

  meta.append(...submissionTag, area, ...levelTags, language, ...flashTag);

  const note = document.createElement("p");
  note.className = "note";
  note.textContent = localizedNotes(game) || i18n("no_notes");

  const ratingControl = createRatingControl(key, userRating, ratingSummary);

  const healthText = document.createElement("p");
  healthText.className = "health";
  healthText.textContent = health.text;

  article.append(cardHead, meta, ratingControl, note);
  if (health.ok !== true) {
    article.append(healthText);
  }
  if (game._isSubmission && game._submittedBy) {
    const byLine = document.createElement("p");
    byLine.className = "note submission-by";
    byLine.textContent = i18n("submission_by", game._submittedBy);
    article.append(byLine);
  }
  return article;
}

function createFavoriteButton(gameKeyValue, isFavorite) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `fav-btn ${isFavorite ? "active" : ""}`;
  button.textContent = "❤";
  button.title = isFavorite ? i18n("favorite_remove") : i18n("favorite_add");
  button.setAttribute("aria-label", button.title);
  button.setAttribute("aria-pressed", String(isFavorite));

  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      const active = await toggleFavoritePreference(gameKeyValue);
      button.classList.toggle("active", active);
      button.title = active ? i18n("favorite_remove") : i18n("favorite_add");
      button.setAttribute("aria-label", button.title);
      button.setAttribute("aria-pressed", String(active));

      if (favoritesOnly.checked && !active) {
        render();
      }
    } catch (error) {
      console.error("No se pudo actualizar favorito", error);
    } finally {
      button.disabled = false;
    }
  });

  return button;
}

async function reportBroken(gameKeyValue) {
  if (state.backendMode !== "firebase" || !state.firebase) return;
  const { auth, collection, db, doc, runTransaction, serverTimestamp, setDoc } = state.firebase;
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const userReportRef = doc(db, "users", uid, "reports", gameDocId(gameKeyValue));
  const summaryRef = doc(db, "brokenReports", gameDocId(gameKeyValue));

  const adminReporting = isAdmin();

  await runTransaction(db, async (tx) => {
    const summarySnap = await tx.get(summaryRef);
    const current = Number(summarySnap.data()?.count || 0);
    tx.set(userReportRef, { reportedAt: serverTimestamp() }, { merge: true });
    tx.set(summaryRef, { count: current + 1, ...(adminReporting ? { adminReported: true } : {}) }, { merge: true });
  });

  state.userReports.add(gameKeyValue);
  const prev = state.brokenSummary.get(gameKeyValue) || { count: 0, adminReported: false };
  state.brokenSummary.set(gameKeyValue, { count: prev.count + 1, adminReported: prev.adminReported || adminReporting });
}

function createReportButton(gameKeyValue, article) {
  if (state.backendMode !== "firebase") return null;
  const user = state.firebase?.auth.currentUser;
  if (!user) return null;

  const alreadyReported = state.userReports.has(gameKeyValue);
  const button = document.createElement("button");
  button.type = "button";
  button.className = `report-btn${alreadyReported ? " active" : ""}`;
  button.textContent = "⚠";
  button.title = alreadyReported ? i18n("report_broken_active") : i18n("report_broken");
  button.setAttribute("aria-label", button.title);
  button.disabled = alreadyReported;

  if (!alreadyReported) {
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await reportBroken(gameKeyValue);
        button.classList.add("active");
        button.title = i18n("report_broken_active");
        button.setAttribute("aria-label", button.title);

        const feedback = document.createElement("p");
        feedback.className = "report-feedback";
        feedback.textContent = i18n("report_broken_feedback");
        article.appendChild(feedback);
        setTimeout(() => feedback.remove(), 4000);

        const bd = state.brokenSummary.get(gameKeyValue);
        if ((bd?.count || 0) >= REPORT_THRESHOLD || bd?.adminReported) {
          render();
        }
      } catch (error) {
        console.error("No se pudo reportar actividad", error);
        button.disabled = false;
      }
    });
  }

  return button;
}

function createRatingControl(gameKeyValue, selectedRating, ratingSummary) {
  const wrapper = document.createElement("div");
  wrapper.className = "rating";
  wrapper.setAttribute("role", "group");
  wrapper.setAttribute("aria-label", i18n("rating_group_label"));

  const label = document.createElement("span");
  label.className = "rating-label";
  label.textContent = i18n("rating_label");
  wrapper.appendChild(label);

  if (state.backendMode === "firebase") {
    const summary = document.createElement("span");
    summary.className = "rating-summary";
    summary.textContent = formatRatingSummary(ratingSummary);
    wrapper.appendChild(summary);
  }

  const stars = document.createElement("div");
  stars.className = "stars";

  for (let value = 1; value <= 5; value += 1) {
    const star = document.createElement("button");
    star.type = "button";
    star.className = `star-btn ${value <= selectedRating ? "active" : ""}`;
    star.textContent = "★";
    star.title = i18n("rating_set", value);
    star.setAttribute("aria-label", i18n("rating_set", value));
    star.setAttribute("aria-pressed", String(value <= selectedRating));

    star.addEventListener("click", async () => {
      const allStars = stars.querySelectorAll(".star-btn");
      allStars.forEach((button) => {
        button.disabled = true;
      });

      try {
        await setRatingPreference(gameKeyValue, value);
        render();
      } catch (error) {
        console.error("No se pudo actualizar valoracion", error);
      } finally {
        allStars.forEach((button) => {
          button.disabled = false;
        });
      }
    });

    stars.appendChild(star);
  }

  wrapper.appendChild(stars);
  return wrapper;
}

function updateStars(container, rating) {
  const buttons = container.querySelectorAll(".star-btn");
  buttons.forEach((button, index) => {
    const value = index + 1;
    const active = value <= rating;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
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

// --- Submissions ---

async function loadSubmissions() {
  if (!state.firebase) return;
  const { collection, db, getDocs } = state.firebase;
  const snap = await getDocs(collection(db, "submissions"));
  state.submissions = snap.docs
    .map((d) => {
      const data = d.data();
      return {
        title: String(data.title || "").trim(),
        url: String(data.url || "").trim(),
        notes: String(data.notes || "").trim(),
        area: String(data.area || "General").trim(),
        language: String(data.language || "").trim(),
        _isSubmission: true,
        _submittedBy: String(data.submittedBy?.name || "").trim(),
        _id: d.id,
      };
    })
    .filter((g) => g.title && g.url);
  hydrateFilterOptions();
  render();
}

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
      title,
      url,
      notes,
      area,
      language,
      submittedBy: { uid: user.uid, name: user.displayName || user.email || "" },
      submittedAt: serverTimestamp(),
    });
    showSubmitFeedback(i18n("submit_success"), "ok");
    submitForm?.reset();
    await loadSubmissions();
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

  try {
    const ruffle = await loadRuffle();
    const flashUrl = await resolveFlashUrl(url);
    const player = ruffle.createPlayer();
    player.style.width = "100%";
    player.style.height = "100%";
    flashContainer.appendChild(player);
    activeFlashPlayer = player;
    player.addEventListener("dblclick", toggleFlashFullscreen);
    await player.load({ url: flashUrl });
  } catch (error) {
    console.error("No se pudo cargar la actividad Flash", error);
    activeFlashPlayer = null;
    flashContainer.innerHTML = "";
    flashContainer.appendChild(createFlashError(url));
  }
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

function createFlashError(url) {
  const wrapper = document.createElement("div");
  wrapper.className = "flash-error";

  const message = document.createElement("p");
  message.textContent = "No se pudo cargar esta actividad Flash.";

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noreferrer noopener";
  link.textContent = "Abrir archivo original";

  wrapper.append(message, link);
  return wrapper;
}
