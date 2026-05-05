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

### Deploy local por SSH (directo al servidor)

Si quieres subir desde tu maquina al servidor que ya usas por SSH, tienes este script:

1. Ruta: `scripts/deploy.sh`
2. Comando: `npm run deploy`
3. Destino preconfigurado: `samgua@edutictac.es:2222` -> `/var/www/my_webapp__4/www`

Variables opcionales (si quieres sobreescribir):

- `DEPLOY_HOST`: host o IP del servidor
- `DEPLOY_USER`: usuario SSH
- `DEPLOY_PORT` (opcional): por defecto `22`
- `DEPLOY_PATH` (opcional): por defecto `/var/www/my_webapp__4/www`
- `DEPLOY_SSH_KEY` (opcional): ruta a clave privada SSH
- `DRY_RUN=1` (opcional): simula sin copiar
- `VERIFY_URL` (opcional): URL publica para verificacion HTTP opcional
- `VERIFY_TIMEOUT` (opcional): timeout HTTP en segundos
- `SKIP_VERIFY=1` (opcional): omite la verificacion final
- `VERIFY_STRICT=1` (opcional): si falla la verificacion HTTP opcional, termina con error
- `FIX_PERMS=1` (opcional): fuerza permisos seguros web (carpetas 755, ficheros 644)

Ejemplo real:

```bash
npm run deploy
```

Prueba en modo simulacion:

```bash
npm run deploy:dry
```

Por defecto, en deploy real el script ajusta permisos web en destino, luego comprueba por SSH que existe `index.html`. La verificacion HTTP publica solo se ejecuta si defines `VERIFY_URL`.

Tambien tienes despliegue automatico por SSH con GitHub Actions en `.github/workflows/deploy.yml`.

### Deploy a servidor por SSH

1. Crea estos Secrets en GitHub (Settings > Secrets and variables > Actions):
  - `DEPLOY_HOST`: host o IP del servidor
  - `DEPLOY_USER`: usuario SSH
  - `DEPLOY_PATH`: carpeta destino en el servidor (por ejemplo `/var/www/bibliojocs`)
  - `DEPLOY_SSH_KEY`: clave privada SSH (formato OpenSSH)
  - `DEPLOY_PORT` (opcional): puerto SSH, por defecto `22`
2. Sube la clave publica correspondiente al archivo `authorized_keys` del servidor.
3. Haz push a `main` o ejecuta manualmente el workflow `Deploy to Server`.

El deploy sincroniza el sitio con `rsync --delete` y excluye archivos de desarrollo.
