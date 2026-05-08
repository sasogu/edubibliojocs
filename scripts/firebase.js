import { i18n } from "./i18n.js";
import {
  state, FAVORITES_STORAGE_KEY, RATINGS_STORAGE_KEY, FIREBASE_CONFIG_MODULE, REPORT_THRESHOLD,
} from "./state.js";

export function gameDocId(gameKeyValue) {
  return encodeURIComponent(gameKeyValue);
}

export function gameKeyFromDocId(docId) {
  try {
    return decodeURIComponent(docId);
  } catch {
    return docId;
  }
}

export function isAdmin() {
  if (!state.firebase || !state.adminEmail) return false;
  const user = state.firebase.auth.currentUser;
  return Boolean(user && user.email === state.adminEmail);
}

export function currentUserDisplayName(user) {
  const raw = user?.displayName || user?.email || user?.phoneNumber || "";
  const trimmed = String(raw).trim();
  return trimmed || i18n("auth_status_anon");
}

export function hasUsableFirebaseConfig(firebaseConfig, firebaseSettings) {
  if (!firebaseSettings?.enabled) return false;
  const needed = ["apiKey", "authDomain", "projectId", "appId"];
  return needed.every((field) => {
    const value = String(firebaseConfig?.[field] || "").trim();
    return value && !value.startsWith("YOUR_");
  });
}

export function loadLocalPreferences() {
  try {
    const favoritesRaw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (favoritesRaw) {
      const parsed = JSON.parse(favoritesRaw);
      if (Array.isArray(parsed)) state.favorites = new Set(parsed.filter(Boolean));
    }
  } catch {
    state.favorites = new Set();
  }

  try {
    const ratingsRaw = localStorage.getItem(RATINGS_STORAGE_KEY);
    if (ratingsRaw) {
      const parsed = JSON.parse(ratingsRaw);
      if (parsed && typeof parsed === "object") {
        const entries = Object.entries(parsed)
          .filter(([key, v]) => key && Number.isFinite(Number(v)) && Number(v) >= 1 && Number(v) <= 5)
          .map(([key, v]) => [key, Number(v)]);
        state.userRatings = new Map(entries);
      }
    }
  } catch {
    state.userRatings = new Map();
  }
}

export function persistLocalFavorites() {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...state.favorites]));
}

export function persistLocalRatings() {
  localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(Object.fromEntries(state.userRatings)));
}

export async function initPreferenceBackend() {
  loadLocalPreferences();

  try {
    const configModule = await import(FIREBASE_CONFIG_MODULE);
    const firebaseConfig = configModule.firebaseConfig || null;
    const firebaseSettings = configModule.firebaseSettings || { enabled: false };

    if (!hasUsableFirebaseConfig(firebaseConfig, firebaseSettings)) {
      state.backendMode = "local";
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
      db, auth,
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
    authModule.onAuthStateChanged(auth, (user) => {
      if (state.authReady) state._onAuthChange?.(user);
    });
    await loadFirebasePreferences();
    state.backendMode = "firebase";
  } catch (error) {
    console.warn("No se pudo activar Firebase, se mantiene modo local.", error);
    state.backendMode = "local";
    state.authReady = false;
  }
}

export async function loadFirebasePreferences() {
  if (!state.firebase) return;
  const { auth, collection, db, getDocs } = state.firebase;

  // brokenReports se carga siempre (sin sesión) para ocultar juegos reportados a todos.
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
    // Si Firestore no permite lectura pública, brokenSummary queda vacío.
  }

  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const [favSnapshot, ratingSnapshot, summarySnapshot, reportSnapshot, brokenUserSnapshot] = await Promise.all([
    getDocs(collection(db, "users", uid, "favorites")),
    getDocs(collection(db, "users", uid, "ratings")),
    getDocs(collection(db, "ratingSummary")),
    getDocs(collection(db, "users", uid, "reports")),
    getDocs(collection(db, "brokenReports")),
  ]);

  state.favorites = new Set(
    favSnapshot.docs.map((d) => gameKeyFromDocId(d.id)).filter(Boolean),
  );

  state.userRatings = new Map(
    ratingSnapshot.docs
      .map((d) => [gameKeyFromDocId(d.id), Number(d.data()?.value || 0)])
      .filter(([key, v]) => key && Number.isFinite(v) && v >= 1 && v <= 5),
  );

  state.ratingSummary = new Map(
    summarySnapshot.docs
      .map((d) => {
        const data = d.data() || {};
        const count = Number(data.count || 0);
        const avg = Number(data.avg || 0);
        return [gameKeyFromDocId(d.id), { avg, count }];
      })
      .filter(([key, s]) => key && Number.isFinite(s.avg) && Number.isFinite(s.count) && s.count > 0),
  );

  state.userReports = new Set(
    reportSnapshot.docs.map((d) => gameKeyFromDocId(d.id)).filter(Boolean),
  );

  state.brokenSummary = new Map(
    brokenUserSnapshot.docs
      .map((d) => {
        const data = d.data() || {};
        return [gameKeyFromDocId(d.id), { count: Number(data.count || 0), adminReported: Boolean(data.adminReported) }];
      })
      .filter(([key, data]) => key && (data.count > 0 || data.adminReported)),
  );
}

export async function refreshFirebaseUserData() {
  state.favorites = new Set();
  state.userRatings = new Map();
  state.ratingSummary = new Map();
  state.userReports = new Set();
  state.brokenSummary = new Map();
  await loadFirebasePreferences();
}

export async function signInWithGoogle() {
  if (!state.firebase?.googleAuthEnabled) return;
  const { auth, GoogleAuthProvider, signInWithPopup } = state.firebase;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithPopup(auth, provider);
  await refreshFirebaseUserData();
}

export async function signOutFromGoogle() {
  if (!state.firebase) return;
  const { auth, signInAnonymously, signOut } = state.firebase;
  await signOut(auth);
  await signInAnonymously(auth).catch(() => {});
  await refreshFirebaseUserData();
}

export async function toggleFavoritePreference(gameKeyValue) {
  if (state.backendMode !== "firebase" || !state.firebase) {
    if (state.favorites.has(gameKeyValue)) state.favorites.delete(gameKeyValue);
    else state.favorites.add(gameKeyValue);
    persistLocalFavorites();
    return state.favorites.has(gameKeyValue);
  }

  const { auth, db, deleteDoc, doc, serverTimestamp, setDoc } = state.firebase;
  const uid = auth.currentUser?.uid;
  if (!uid) return state.favorites.has(gameKeyValue);

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

export async function setRatingPreference(gameKeyValue, requestedRating) {
  const clamped = Math.max(0, Math.min(5, Number(requestedRating) || 0));
  const current = state.userRatings.get(gameKeyValue) || 0;
  const next = current === clamped ? 0 : clamped;

  if (state.backendMode !== "firebase" || !state.firebase) {
    if (next > 0) state.userRatings.set(gameKeyValue, next);
    else state.userRatings.delete(gameKeyValue);
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
      if (next > 0) state.userRatings.set(gameKeyValue, next);
      else state.userRatings.delete(gameKeyValue);
      persistLocalRatings();
      return next;
    }
  }
  if (!uid) return current;

  const ratingRef = doc(db, "users", uid, "ratings", gameDocId(gameKeyValue));
  const summaryRef = doc(db, "ratingSummary", gameDocId(gameKeyValue));

  await runTransaction(db, async (tx) => {
    const summarySnap = await tx.get(summaryRef);
    const data = summarySnap.exists() ? summarySnap.data() : {};
    let sum = Number(data.sum || 0);
    let count = Number(data.count || 0);

    if (current > 0) { sum -= current; count -= 1; }
    if (next > 0) {
      sum += next; count += 1;
      tx.set(ratingRef, { value: next, updatedAt: serverTimestamp() }, { merge: true });
    } else {
      tx.delete(ratingRef);
    }

    if (count <= 0) { tx.delete(summaryRef); return; }
    tx.set(summaryRef, { sum, count, avg: Number((sum / count).toFixed(2)), updatedAt: serverTimestamp() }, { merge: true });
  });

  if (next > 0) state.userRatings.set(gameKeyValue, next);
  else state.userRatings.delete(gameKeyValue);

  const existing = state.ratingSummary.get(gameKeyValue) || { avg: 0, count: 0 };
  let sum = existing.avg * existing.count;
  let count = existing.count;
  if (current > 0) { sum -= current; count -= 1; }
  if (next > 0) { sum += next; count += 1; }

  if (count <= 0) state.ratingSummary.delete(gameKeyValue);
  else state.ratingSummary.set(gameKeyValue, { avg: Number((sum / count).toFixed(2)), count });

  return next;
}

export async function reportBroken(gameKeyValue) {
  if (state.backendMode !== "firebase" || !state.firebase) return;
  const { auth, collection, db, doc, runTransaction, serverTimestamp } = state.firebase;
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const adminReporting = isAdmin();
  const userReportRef = doc(db, "users", uid, "reports", gameDocId(gameKeyValue));
  const summaryRef = doc(db, "brokenReports", gameDocId(gameKeyValue));

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

export async function loadSubmissions() {
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
}
