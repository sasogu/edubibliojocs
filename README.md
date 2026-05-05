# Bibliojocs

Sitio estatico para gestionar enlaces de juegos educativos.

## Estructura

- `index.html`: pagina principal
- `data/games.json`: listado editable de juegos
- `scripts/check-links.mjs`: verificador de enlaces
- `reports/link-report.json`: informe generado automaticamente
- `.github/workflows/link-check.yml`: chequeo diario en GitHub Actions

## Como editar juegos

1. Abre `data/games.json`.
2. Anade, edita o elimina entradas.
3. Mantiene este formato por juego:

```json
{
  "id": "id-unico",
  "title": "Titulo",
  "area": "Matematicas",
  "level": "Primaria 1er ciclo",
  "language": "Castellano",
  "url": "https://ejemplo.com",
  "notes": "Descripcion corta"
}
```

## Detectar enlaces rotos

Ejecuta:

```bash
npm run check:links
```

Esto crea o actualiza `reports/link-report.json` con estado HTTP y severidad:

- `error`: bloquea la ejecucion (por ejemplo, 404 o fallo de red).
- `warning`: no bloquea por defecto (por ejemplo, timeout o 5xx temporal).

Si quieres que los avisos tambien bloqueen:

```bash
STRICT_WARNINGS=true npm run check:links
```

## Importar desde CSV

Puedes importar un catalogo completo con este formato de columnas:

```csv
id,title,area,level,language,url,notes
```

Hay una plantilla en `data/games.sample.csv`.

Para importar desde `data/games.csv`:

```bash
npm run import:csv
```

Para importar desde otro archivo:

```bash
node scripts/import-csv.mjs ruta/al/archivo.csv
```

## Publicacion

Puedes publicar en GitHub Pages, Netlify o Cloudflare Pages. El sitio no necesita backend.
