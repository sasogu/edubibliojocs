const STORAGE_KEY = "bibliojocs-lang";
export const LANGS = ["es", "ca"];

const strings = {
  es: {
    subtitle: "Directorio de juegos educativos, mantenido sin WordPress para poder depurar y validar enlaces con rapidez.",
    auth_title: "Cuenta",
    auth_loading: "Conectando cuenta...",
    auth_signin_google: "Entrar con Google",
    auth_signout: "Cerrar sesion",
    auth_status_local: "Modo local sin cuenta en la nube.",
    auth_status_anon: "Sesion anonima en Firebase.",
    auth_status_google: (name) => `Conectado como ${name}`,
    auth_status_google_available: "Puedes iniciar sesion con Google para sincronizar en todos tus dispositivos.",
    auth_status_google_disabled: "Google no esta activado en esta instalacion.",
    auth_error_google: "No se pudo iniciar sesion con Google.",
    search_label: "Buscar",
    search_placeholder: "Título, área o notas",
    level_label: "Etapa",
    level_all: "Todas",
    language_label: "Idioma",
    language_all: "Todos",
    broken_only: "Solo enlaces con incidencia",
    favorites_only: "Solo mis favoritos",
    rating_min_label: "Valoracion minima",
    rating_all_filter: "Todas las valoraciones",
    personal_prefs_note_local: "Favoritos y valoraciones se guardan solo en este navegador (localStorage).",
    personal_prefs_note_firebase: "Favoritos por usuario y valoraciones compartidas guardadas en Firebase.",
    area_label: "Materia",
    area_all: "Todas",
    section_title: "Juegos",
    result_count: (n, total) => `${n} de ${total} juegos`,
    empty: "No hay resultados con los filtros actuales.",
    open_game: "Abrir juego",
    play_ruffle: "▶ Jugar con Ruffle",
    favorite_add: "Guardar en favoritos",
    favorite_remove: "Quitar de favoritos",
    rating_group_label: "Valoracion de la actividad",
    rating_label: "Valoracion:",
    rating_set: (n) => `Calificar con ${n} estrella${n === 1 ? "" : "s"}`,
    rating_no_votes: "Sin votos",
    rating_avg: (avg, n) => `Media ${avg} (${n} voto${n === 1 ? "" : "s"})`,
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
    auth_title: "Compte",
    auth_loading: "Connectant compte...",
    auth_signin_google: "Entrar amb Google",
    auth_signout: "Tancar sessio",
    auth_status_local: "Mode local sense compte en el nuvol.",
    auth_status_anon: "Sessio anonima en Firebase.",
    auth_status_google: (name) => `Connectat com ${name}`,
    auth_status_google_available: "Pots iniciar sessio amb Google per sincronitzar en tots els teus dispositius.",
    auth_status_google_disabled: "Google no esta activat en esta instal.lacio.",
    auth_error_google: "No s'ha pogut iniciar sessio amb Google.",
    search_label: "Cercar",
    search_placeholder: "Títol, àrea o notes",
    level_label: "Etapa",
    level_all: "Totes",
    language_label: "Idioma",
    language_all: "Tots",
    broken_only: "Sols enllaços amb incidència",
    favorites_only: "Sols els meus favorits",
    rating_min_label: "Valoracio minima",
    rating_all_filter: "Totes les valoracions",
    personal_prefs_note_local: "Favorits i valoracions es guarden nomes en este navegador (localStorage).",
    personal_prefs_note_firebase: "Favorits per usuari i valoracions compartides guardades en Firebase.",
    area_label: "Matèria",
    area_all: "Totes",
    section_title: "Jocs",
    result_count: (n, total) => `${n} de ${total} jocs`,
    empty: "No hi ha resultats amb els filtres actuals.",
    open_game: "Obrir joc",
    play_ruffle: "▶ Jugar amb Ruffle",
    favorite_add: "Guardar en favorits",
    favorite_remove: "Traure de favorits",
    rating_group_label: "Valoracio de l'activitat",
    rating_label: "Valoracio:",
    rating_set: (n) => `Valorar amb ${n} estrella${n === 1 ? "" : "es"}`,
    rating_no_votes: "Sense vots",
    rating_avg: (avg, n) => `Mitjana ${avg} (${n} vot${n === 1 ? "" : "s"})`,
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
