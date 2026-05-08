export function initOfflineBanner(banner, translate) {
  if (!banner) return;

  const update = () => {
    banner.textContent = translate("offline_banner");
    banner.classList.toggle("hidden", navigator.onLine);
  };

  window.addEventListener("offline", update);
  window.addEventListener("online", update);
  update();
}

export function readFiltersFromUrl(controls) {
  const params = new URLSearchParams(location.search);

  if (params.has("q")) controls.searchInput.value = params.get("q");
  if (params.has("level")) controls.levelFilter.value = params.get("level");
  if (params.has("lang")) controls.languageFilter.value = params.get("lang");
  if (params.has("area")) controls.areaFilter.value = params.get("area");
  if (params.has("rating")) controls.ratingFilter.value = params.get("rating");
  if (params.get("fav") === "1") controls.favoritesOnly.checked = true;
}

export function syncFiltersToUrl(controls) {
  const params = new URLSearchParams();
  const q = controls.searchInput.value.trim();

  if (q) params.set("q", q);
  if (controls.levelFilter.value) params.set("level", controls.levelFilter.value);
  if (controls.languageFilter.value) params.set("lang", controls.languageFilter.value);
  if (controls.areaFilter.value) params.set("area", controls.areaFilter.value);
  if (controls.ratingFilter.value && controls.ratingFilter.value !== "0") {
    params.set("rating", controls.ratingFilter.value);
  }
  if (controls.favoritesOnly.checked) params.set("fav", "1");

  const qs = params.toString();
  const newUrl = qs ? `${location.pathname}?${qs}` : location.pathname;
  const current = location.search ? location.pathname + location.search : location.pathname;

  if (current !== newUrl) history.replaceState(null, "", newUrl);
}