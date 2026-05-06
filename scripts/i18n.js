const STORAGE_KEY = "bibliojocs-lang";
export const LANGS = ["es", "ca"];

const strings = {
  es: {
    subtitle: "Directorio de juegos educativos, mantenido sin WordPress para poder depurar y validar enlaces con rapidez.",
    search_label: "Buscar",
    search_placeholder: "Título, área o notas",
    level_label: "Etapa",
    level_all: "Todas",
    language_label: "Idioma",
    language_all: "Todos",
    broken_only: "Solo enlaces con incidencia",
    area_label: "Materia",
    area_all: "Todas",
    section_title: "Juegos",
    result_count: (n, total) => `${n} de ${total} juegos`,
    empty: "No hay resultados con los filtros actuales.",
    open_game: "Abrir juego",
    play_ruffle: "▶ Jugar con Ruffle",
    no_title: "Sin título",
    no_notes: "Sin notas.",
    no_level: "Sin etapa",
    not_checked: "Sin comprobar",
    link_ok: (status) => `OK (${status})`,
    link_warn: (reason) => `Aviso: ${reason}`,
    link_error: (reason) => `Incidencia: ${reason}`,
    status_ok: (n, date) => `Último chequeo: ${n} enlaces sin incidencias (${date}).`,
    status_warn: (n, err, warn, date) => `Último chequeo: ${n} enlaces — ${err} errores, ${warn} avisos (${date}).`,
    status_no_report: "Sin informe de enlaces. Ejecuta: npm run check:links",
    boot_error: "Error cargando datos. Revisa consola o formato del JSON.",
    load_more: (n) => `Cargar ${n} más`,
    flash_player_label: "Reproductor Flash",
    flash_close_label: "Cerrar",
  },
  ca: {
    subtitle: "Directori de jocs educatius, mantingut sense WordPress per poder depurar i validar enllaços ràpidament.",
    search_label: "Cercar",
    search_placeholder: "Títol, àrea o notes",
    level_label: "Etapa",
    level_all: "Totes",
    language_label: "Idioma",
    language_all: "Tots",
    broken_only: "Sols enllaços amb incidència",
    area_label: "Matèria",
    area_all: "Totes",
    section_title: "Jocs",
    result_count: (n, total) => `${n} de ${total} jocs`,
    empty: "No hi ha resultats amb els filtres actuals.",
    open_game: "Obrir joc",
    play_ruffle: "▶ Jugar amb Ruffle",
    no_title: "Sense títol",
    no_notes: "Sense notes.",
    no_level: "Sense etapa",
    not_checked: "Sense comprovar",
    link_ok: (status) => `OK (${status})`,
    link_warn: (reason) => `Avís: ${reason}`,
    link_error: (reason) => `Incidència: ${reason}`,
    status_ok: (n, date) => `Darrer anàlisi: ${n} enllaços sense incidències (${date}).`,
    status_warn: (n, err, warn, date) => `Darrer anàlisi: ${n} enllaços — ${err} errors, ${warn} avisos (${date}).`,
    status_no_report: "Sense informe d'enllaços. Executa: npm run check:links",
    boot_error: "Error carregant dades. Revisa la consola o el format del JSON.",
    load_more: (n) => `Carregar ${n} més`,
    flash_player_label: "Reproductor Flash",
    flash_close_label: "Tancar",
  },
};

let _lang = "es";

export function detectLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && LANGS.includes(stored)) return stored;
  const browser = (navigator.language || "es").toLowerCase();
  return browser.startsWith("ca") || browser.startsWith("va") ? "ca" : "es";
}

export function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  _lang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
}

export function getLang() {
  return _lang;
}

export function i18n(key, ...args) {
  const val = strings[_lang]?.[key] ?? strings.es[key];
  return typeof val === "function" ? val(...args) : (val ?? key);
}
