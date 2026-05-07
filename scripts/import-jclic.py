#!/usr/bin/env python3
"""
Importa activitats de l'app JClic (online-activities.json) a bibliojocs games.json.
- Activitats online (online_ok=True): usa l'URL de clic.xtec.cat
- Activitats locals (local_exists=True): usa https://jclic.edutictac.es/play.html?project=...
- Copia portades de assets/covers/{slug}/cover.webp → assets/game-images/jclic/{slug}.webp
- Deduplica per URL (case-insensitive)
"""

import json
import shutil
from pathlib import Path

JCLIC_ROOT = Path("/home/sasogu/github/JaumeBalmes2017_html5_JCLIC")
BIBLIO_ROOT = Path("/home/sasogu/github/my_webapp__4")
JCLIC_BASE_URL = "https://jclic.edutictac.es/"
IMAGE_DST_DIR = BIBLIO_ROOT / "assets" / "game-images" / "jclic"

LANG_MAP = {
    "castellano": "Castellano",
    "castellà":   "Castellano",
    "valencià":   "Català/Valencià",
    "english":    "Ingles",
}

AREA_MAP = {
    "diversas":               "Diversas áreas",
    "diverses":               "Diversas áreas",
    "varios":                 "Diversas áreas",
    "experiencias":           "General",
    "experiències":           "General",
    "lengua":                 "Lengua",
    "llengua":                "Lengua",
    "matemáticas":            "Matematicas",
    "matemàtiques":           "Matematicas",
    "conocimiento del medio": "Conocimiento del Medio",
    "coneixement del medi":   "Conocimiento del Medio",
    "música":                 "Musica",
    "musica":                 "Musica",
    "educación física":       "Educacion Fisica",
    "educació física":        "Educacion Fisica",
}


def parse_category(cat):
    parts = [p.strip() for p in cat.split("/")]
    level = "Primaria"
    language = ""
    area = "General"

    first = parts[0].strip().lower()

    if first == "infantil":
        level = "Infantil"
        if len(parts) >= 2:
            language = LANG_MAP.get(parts[1].strip().lower(), "")
        if len(parts) >= 3:
            area = AREA_MAP.get(parts[2].strip().lower(), "General")

    elif first == "primaria":
        cycle = parts[1].strip().lower() if len(parts) > 1 else ""
        if "ciclo 1" in cycle:
            level = "Primaria 1er ciclo"
        elif "ciclo 2" in cycle:
            level = "Primaria 2o ciclo"
        elif "ciclo 3" in cycle:
            level = "Primaria 3er ciclo"
        else:
            level = "Primaria"
        if len(parts) >= 3:
            language = LANG_MAP.get(parts[2].strip().lower(), "")
        if len(parts) >= 4:
            area = AREA_MAP.get(parts[3].strip().lower(), "General")

    elif first == "compensatoria":
        level = "Primaria"
        if len(parts) >= 2:
            second = parts[1].strip().lower()
            if second in LANG_MAP:
                language = LANG_MAP[second]
            else:
                area = AREA_MAP.get(second, "General")

    elif first in ("música", "musica"):
        level = "Primaria"
        area = "Musica"
        if len(parts) >= 2:
            language = LANG_MAP.get(parts[1].strip().lower(), "")

    elif "educaci" in first and ("física" in first or "fisica" in first):
        level = "Primaria"
        area = "Educacion Fisica"
        if len(parts) >= 2:
            language = LANG_MAP.get(parts[1].strip().lower(), "")

    elif first == "english":
        level = "Primaria"
        language = "Ingles"
        area = "Ingles"

    return level, language, area


# ── Load existing games ────────────────────────────────────────────────────────
games_path = BIBLIO_ROOT / "data" / "games.json"
games = json.loads(games_path.read_text(encoding="utf-8"))
existing_urls = {g["url"].strip().lower() for g in games if g.get("url")}
print(f"Jocs existents:     {len(games)}")

# ── Load JClic activities ──────────────────────────────────────────────────────
jclic = json.loads((JCLIC_ROOT / "online-activities.json").read_text(encoding="utf-8"))
print(f"Activitats JClic:   {len(jclic)}")

IMAGE_DST_DIR.mkdir(parents=True, exist_ok=True)

imported = 0
skipped_dup = 0
skipped_bad = 0
images_copied = 0
new_games = []

for activity in jclic:
    if activity.get("online_ok"):
        url = activity["url"].strip()
    elif activity.get("local_exists"):
        href = activity.get("href", "").strip()
        if not href or href == "#":
            skipped_bad += 1
            continue
        url = JCLIC_BASE_URL + href
    else:
        skipped_bad += 1
        continue

    if url.lower() in existing_urls:
        skipped_dup += 1
        continue

    level, language, area = parse_category(activity.get("category", ""))

    slug = activity.get("slug", "")
    image_path = ""
    if slug:
        cover_src = JCLIC_ROOT / "assets" / "covers" / slug / "cover.webp"
        if cover_src.exists():
            dst = IMAGE_DST_DIR / f"{slug}.webp"
            shutil.copy2(cover_src, dst)
            image_path = f"./assets/game-images/jclic/{slug}.webp"
            images_copied += 1

    game = {
        "title":    activity["title"],
        "url":      url,
        "area":     area,
        "levels":   [level],
        "language": language,
        "notes":    "",
        "source":   "jclic",
    }
    if image_path:
        game["image"] = image_path

    new_games.append(game)
    existing_urls.add(url.lower())
    imported += 1

print(f"Importades:         {imported}")
print(f"Descartades (dup):  {skipped_dup}")
print(f"Descartades (s/URL):{skipped_bad}")
print(f"Portades copiades:  {images_copied}")

games.extend(new_games)
games_path.write_text(json.dumps(games, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Total jocs final:   {len(games)}")
