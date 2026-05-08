const STORAGE_KEY = "bibliojocs-lang";
export const LANGS = ["es", "ca"];

const strings = {
  es: {
    subtitle: "Juegos educativos seleccionados para Infantil, Primaria y Secundaria, con filtros rápidos para encontrar la actividad perfecta en cada momento.",
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
    favorites_only: "Solo mis favoritos",
    rating_min_label: "Valoracion minima",
    rating_all_filter: "Todas las valoraciones",
    personal_prefs_note_local: "Favoritos y valoraciones se guardan solo en este navegador (localStorage).",
    personal_prefs_note_firebase: "Favoritos por usuario y valoraciones compartidas guardadas en la nube.",
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
    submissions_only: "Solo propuestas",
    submission_badge: "Nueva",
    submission_by: (name) => `Propuesto por ${name}`,
    submit_btn: "Proponer actividad",
    submit_dialog_title: "Proponer una actividad",
    submit_field_title: "Nombre de la actividad",
    submit_field_url: "Enlace (URL)",
    submit_field_notes: "Descripcion (opcional)",
    submit_send: "Enviar",
    submit_cancel: "Cancelar",
    submit_success: "¡Gracias! La actividad se ha enviado.",
    submit_error: "No se pudo enviar. Inténtalo de nuevo.",
    submit_loading: "Enviando...",
    report_broken: "Reportar que no funciona",
    report_broken_active: "Ya lo has reportado",
    report_broken_feedback: "Gracias, lo revisaremos pronto.",
    broken_only: "No funciona (admin)",
    reported_only: "Reportadas (admin)",
    offline_banner: "Sin conexión — navegando en modo sin red",
  },
  ca: {
    subtitle: "Jocs educatius seleccionats per a Infantil, Primària i Secundària, amb filtres ràpids per trobar l'activitat perfecta en cada moment.",
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
    favorites_only: "Sols els meus favorits",
    rating_min_label: "Valoracio minima",
    rating_all_filter: "Totes les valoracions",
    personal_prefs_note_local: "Favorits i valoracions es guarden nomes en este navegador (localStorage).",
    personal_prefs_note_firebase: "Favorits per usuari i valoracions compartides guardades en el núvol.",
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
    submissions_only: "Sols propostes",
    submission_badge: "Nova",
    submission_by: (name) => `Proposat per ${name}`,
    submit_btn: "Proposar activitat",
    submit_dialog_title: "Proposar una activitat",
    submit_field_title: "Nom de l'activitat",
    submit_field_url: "Enllaç (URL)",
    submit_field_notes: "Descripció (opcional)",
    submit_send: "Enviar",
    submit_cancel: "Cancel·lar",
    submit_success: "Gràcies! L'activitat s'ha enviat.",
    submit_error: "No s'ha pogut enviar. Torna-ho a intentar.",
    submit_loading: "Enviant...",
    report_broken: "Reportar que no funciona",
    report_broken_active: "Ja ho has reportat",
    report_broken_feedback: "Gràcies, ho revisarem aviat.",
    broken_only: "No funciona (admin)",
    reported_only: "Reportades (admin)",
    offline_banner: "Sense connexió — navegant en mode sense xarxa",
  },
};

const areaLabels = {
  es: {
    Artes: "Artes",
    "Ciencias Naturales": "Ciencias Naturales",
    "Ciencias Sociales": "Ciencias Sociales",
    "Conocimiento del Medio": "Conocimiento del Medio",
    "Dias especiales": "Días especiales",
    "Diversas áreas": "Diversas áreas",
    "Educacion emocional": "Educación emocional",
    Frances: "Francés",
    General: "General",
    Juegos: "Juegos",
    Informatica: "Informática",
    Ingles: "Inglés",
    Lectoescritura: "Lectoescritura",
    Lengua: "Lengua",
    Logica: "Lógica",
    Manualitats: "Plástica y Manualidades",
    Matematicas: "Matemáticas",
    Musica: "Música",
    Religion: "Religión",
    "Seguridad Digital": "Seguridad Digital",
    "Educacion Fisica": "Educación Física",
    "Tecnología": "Tecnología",
  },
  ca: {
    Artes: "Arts",
    "Ciencias Naturales": "Ciències naturals",
    "Ciencias Sociales": "Ciències socials",
    "Conocimiento del Medio": "Coneixement del medi",
    "Dias especiales": "Dies especials",
    "Diversas áreas": "Diverses àrees",
    "Educacion emocional": "Educació emocional",
    Frances: "Francés",
    General: "General",
    Juegos: "Jocs",
    Informatica: "Informàtica",
    Ingles: "Anglés",
    Lectoescritura: "Lectoescriptura",
    Lengua: "Llengua",
    Logica: "Lògica",
    Manualitats: "Plàstica i Manualitats",
    Matematicas: "Matemàtiques",
    Musica: "Música",
    Religion: "Religió",
    "Educacion Fisica": "Educació Física",
    "Seguridad Digital": "Seguretat digital",
    "Tecnología": "Tecnologia",
  },
};

const languageLabels = {
  es: {
    Aranes: "Aranés",
    Castellano: "Castellano",
    "Català/Valencià": "Catalán/Valenciano",
    Frances: "Francés",
    Ingles: "Inglés",
  },
  ca: {
    Aranes: "Aranés",
    Castellano: "Castellà",
    "Català/Valencià": "Català/Valencià",
    Frances: "Francés",
    Ingles: "Anglés",
  },
};

const levelLabels = {
  es: {
    Infantil: "Infantil",
    Primaria: "Primaria",
    "Primaria 1er ciclo": "Primaria 1er ciclo",
    "Primaria 2o ciclo": "Primaria 2.º ciclo",
    "Primaria 3er ciclo": "Primaria 3er ciclo",
    Secundaria: "Secundaria",
  },
  ca: {
    Infantil: "Infantil",
    Primaria: "Primària",
    "Primaria 1er ciclo": "Primària 1r cicle",
    "Primaria 2o ciclo": "Primària 2n cicle",
    "Primaria 3er ciclo": "Primària 3r cicle",
    Secundaria: "Secundària",
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

export function areaLabel(area) {
  return areaLabels[_lang]?.[area] ?? areaLabels.es[area] ?? area;
}

export function languageLabel(language) {
  return languageLabels[_lang]?.[language] ?? languageLabels.es[language] ?? language;
}

export function levelLabel(level) {
  return levelLabels[_lang]?.[level] ?? levelLabels.es[level] ?? level;
}
