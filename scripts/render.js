import { i18n, areaLabel, languageLabel, levelLabel, getLang } from "./i18n.js";
import { openFlashDialog } from "./flash.js";
import { state, DEFAULT_GAME_IMAGE, REPORT_THRESHOLD } from "./state.js";
import { normalizeUrl, gameKey, gameLanguages, gameLanguageText } from "./filters.js";
import { isAdmin } from "./firebase.js";

export function clearSelect(select) {
  select.querySelectorAll("option:not([value=''])").forEach((o) => o.remove());
}

export function fillSelect(select, values, formatLabel = (v) => v) {
  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = formatLabel(value);
    select.append(option);
  }
}

export function updateSelectLabels(select, formatLabel) {
  select.querySelectorAll("option").forEach((option) => {
    if (option.value) option.textContent = formatLabel(option.value);
  });
}

export function tag(text, extraClass = "") {
  const span = document.createElement("span");
  span.className = `tag ${extraClass}`.trim();
  span.textContent = text;
  return span;
}

export function localizedTitle(game) {
  return getLang() === "ca" ? (game.title_ca || game.title) : game.title;
}

export function localizedNotes(game) {
  return getLang() === "ca" ? (game.notes_ca || game.notes) : game.notes;
}

export function linkHealth(url) {
  const item = state.reportByUrl.get(normalizeUrl(url));
  if (!item) return { ok: null, text: i18n("not_checked") };
  if (item.ok) return { ok: true, text: i18n("link_ok", item.httpStatus || "200") };
  if (item.severity === "warning") {
    return { ok: false, text: i18n("link_warn", item.error || `HTTP ${item.httpStatus || "warning"}`) };
  }
  return { ok: false, text: i18n("link_error", item.error || `HTTP ${item.httpStatus || "error"}`) };
}

export function formatRatingSummary(summary) {
  if (!summary || !summary.count) return i18n("rating_no_votes");
  return i18n("rating_avg", summary.avg.toFixed(1), summary.count);
}

export function updateStars(container, rating) {
  container.querySelectorAll(".star-btn").forEach((btn, index) => {
    const active = index + 1 <= rating;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
}

export function createCardImageAction(game) {
  const image = document.createElement("img");
  image.className = "card-image";
  image.src = game.image || DEFAULT_GAME_IMAGE;
  image.alt = game.title || i18n("no_title");
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => {
    if (!image.src.endsWith("generic-game.svg")) image.src = DEFAULT_GAME_IMAGE;
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

export function createFavoriteButton(gameKeyValue, isFavorite, { onToggle, onRender, favoritesOnlyEl }) {
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
      const active = await onToggle(gameKeyValue);
      button.classList.toggle("active", active);
      button.title = active ? i18n("favorite_remove") : i18n("favorite_add");
      button.setAttribute("aria-label", button.title);
      button.setAttribute("aria-pressed", String(active));
      if (favoritesOnlyEl?.checked && !active) onRender();
    } catch (error) {
      console.error("No se pudo actualizar favorito", error);
    } finally {
      button.disabled = false;
    }
  });

  return button;
}

export function createReportButton(gameKeyValue, article, { onReport, onRender }) {
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
        await onReport(gameKeyValue);
        button.classList.add("active");
        button.title = i18n("report_broken_active");
        button.setAttribute("aria-label", button.title);

        const feedback = document.createElement("p");
        feedback.className = "report-feedback";
        feedback.textContent = i18n("report_broken_feedback");
        article.appendChild(feedback);
        setTimeout(() => feedback.remove(), 4000);

        const bd = state.brokenSummary.get(gameKeyValue);
        if ((bd?.count || 0) >= REPORT_THRESHOLD || bd?.adminReported) onRender();
      } catch (error) {
        console.error("No se pudo reportar actividad", error);
        button.disabled = false;
      }
    });
  }

  return button;
}

export function createRatingControl(gameKeyValue, selectedRating, ratingSummary, { onRatingSet, onRender }) {
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
      allStars.forEach((btn) => { btn.disabled = true; });
      try {
        await onRatingSet(gameKeyValue, value);
        onRender();
      } catch (error) {
        console.error("No se pudo actualizar valoracion", error);
      } finally {
        allStars.forEach((btn) => { btn.disabled = false; });
      }
    });

    stars.appendChild(star);
  }

  wrapper.appendChild(stars);
  return wrapper;
}

export function buildCard(game, cardDeps) {
  const { onFavoriteToggle, onRatingSet, onReport, onRender, favoritesOnlyEl } = cardDeps;
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

  article.appendChild(createCardImageAction(game));

  const title = document.createElement("h3");
  title.textContent = localizedTitle(game) || i18n("no_title");

  const cardHead = document.createElement("div");
  cardHead.className = "card-head";
  const reportBtn = createReportButton(key, article, { onReport, onRender });
  const headButtons = [createFavoriteButton(key, isFavorite, { onToggle: onFavoriteToggle, onRender, favoritesOnlyEl })];
  if (reportBtn) headButtons.push(reportBtn);
  cardHead.append(title, ...headButtons);

  const meta = document.createElement("div");
  meta.className = "meta";
  const gameLevels = game.levels || (game.level ? [game.level] : [i18n("no_level")]);
  meta.append(
    ...(game._isSubmission ? [tag(i18n("submission_badge"), "submission")] : []),
    tag(areaLabel(game.area || "General")),
    ...gameLevels.map((l) => tag(levelLabel(l))),
    tag(gameLanguageText(game) || "Idioma no definido", "lang"),
    ...(game.flash ? [tag("Flash", "flash")] : []),
  );

  const note = document.createElement("p");
  note.className = "note";
  note.textContent = localizedNotes(game) || i18n("no_notes");

  article.append(cardHead, meta, createRatingControl(key, userRating, ratingSummary, { onRatingSet, onRender }), note);

  if (health.ok !== true) {
    const healthText = document.createElement("p");
    healthText.className = "health";
    healthText.textContent = health.text;
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
