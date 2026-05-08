export const PAGE_SIZE = 48;
export const REPORT_THRESHOLD = 3;
export const FAVORITES_STORAGE_KEY = "bibliojocs-favorites";
export const RATINGS_STORAGE_KEY = "bibliojocs-ratings";
export const FIREBASE_CONFIG_MODULE = "../firebase-config.js";
export const DEFAULT_GAME_IMAGE = "./assets/game-images/generic-game.svg";

export const state = {
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
