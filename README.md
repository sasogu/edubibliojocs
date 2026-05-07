# Bibliojocs

Directori de jocs educatius per a Infantil, Primària i Secundària. Lloc estàtic (HTML + CSS + JS pur) amb sincronització opcional via Firebase.

🌐 **Producció**: [edutictac.es](https://edutictac.es)

---

## Índex

- [Estructura del projecte](#estructura-del-projecte)
- [Instal·lació](#installació)
- [Gestió del catàleg](#gestió-del-catàleg)
- [Importació de continguts](#importació-de-continguts)
- [Captura d'imatges](#captura-dimatges)
- [Verificació d'enllaços](#verificació-denllaços)
- [Firebase](#firebase)
- [Deploy](#deploy)

---

## Estructura del projecte

```
├── index.html                  Pàgina principal
├── firebase-config.js          Credencials Firebase (NO està en git)
├── sw.js                       Service Worker (PWA)
├── data/
│   ├── games.json              Catàleg principal d'activitats
│   ├── games-home.json         Subconjunt per la càrrega inicial (generat)
│   └── archive-flash-staging.json  Entrades pendents de revisió (Archive.org)
├── assets/
│   ├── game-images/            Captures de pantalla dels jocs
│   └── flash/                  Fitxers .swf locals (NO estan en git)
├── reports/
│   └── link-report.json        Informe d'estat dels enllaços (generat)
├── scripts/
│   ├── check-links.mjs         Verificador d'enllaços
│   ├── generate-home.mjs       Genera games-home.json
│   ├── import-csv.mjs          Importa des de CSV
│   ├── import-wordpress.mjs    Importa des de WordPress
│   ├── import-archive-flash.mjs  Importa Flash educatiu d'Archive.org
│   ├── capture-game-images.mjs Captura automàtica d'imatges
│   └── deploy.sh               Script de deploy per SSH
└── styles/
    └── site.css
```

---

## Instal·lació

```bash
git clone https://github.com/sasogu/edubibliojocs.git
cd edubibliojocs
npm install
```

---

## Gestió del catàleg

El catàleg és `data/games.json`. Cada entrada té aquest format:

```json
{
  "id": "id-unic",
  "title": "Títol del joc",
  "title_ca": "Títol en català (opcional)",
  "area": "Matematicas",
  "language": "Castellano",
  "url": "https://exemple.com/joc",
  "notes": "Descripció breu",
  "notes_ca": "Descripció en català (opcional)",
  "levels": ["Primaria 1er ciclo", "Primaria 2o ciclo"],
  "image": "assets/game-images/nom-del-joc.png",
  "flash": true
}
```

**Camps obligatoris**: `id`, `title`, `url`

**Valors vàlids per `area`**: `Matematicas`, `Lengua`, `Ciencias Naturales`, `Sociales`, `Plastica`, `Musica`, `Ingles`, `Educación Física`, `Informática`, `Logica`, `General`, `Seguridad Digital`, `Tecnologia`, `Religion`, `Frances`

**Valors vàlids per `levels`**: `Infantil`, `Primaria`, `Primaria 1er ciclo`, `Primaria 2o ciclo`, `Primaria 3er ciclo`, `Secundaria`

**Valors vàlids per `language`**: `Castellano`, `Català/Valencià`, `Inglés`, `Francés`, `Aranes`

El camp `flash: true` activa el reproductor Ruffle integrat per a fitxers `.swf`.

---

## Importació de continguts

### Des de CSV

Format de les columnes: `id,title,area,level,language,url,notes`

```bash
npm run import:csv                          # llegeix data/games.csv
node scripts/import-csv.mjs ruta/arxiu.csv  # fitxer alternatiu
```

### Des de WordPress

```bash
npm run import:wp          # importació completa
npm run import:wp:merge    # fusiona amb el catàleg existent
npm run import:wp:images   # descarrega imatges de WordPress
```

### Flash educatiu d'Archive.org

Descarrega jocs Flash educatius d'Archive.org i els allotja localment (necessari perquè Archive.org està bloquejat a les xarxes escolars).

```bash
# 1. Cerca sense descarregar (per veure quants jocs hi ha)
npm run import:flash:dry

# 2. Descàrrega real (es pot aturar i reprendre)
npm run import:flash

# 3. Opcions avançades
node scripts/import-archive-flash.mjs --limit 50
node scripts/import-archive-flash.mjs --query "math elementary"

# 4. Revisa data/archive-flash-staging.json i elimina els que no vulguis

# 5. Afegeix els aprovats a games.json
npm run import:flash:apply
```

**Notes**:
- Els `.swf` es guarden a `assets/flash/` i **no estan en git** (massa pesats), però el deploy els puja al servidor via rsync.
- El script és *resumible*: guarda el progrés a `data/archive-flash-state.json`.
- Mida màxima per fitxer: 100 MB.
- Mapatge automàtic de matèries, idiomes i etapes a partir dels tags d'Archive.org.

---

## Captura d'imatges

Genera captures de pantalla automàtiques per als jocs sense imatge usant Chromium en mode headless:

```bash
npm run capture:images -- --limit 25        # fins a 25 captures
npm run capture:images -- --id nom-del-joc  # un joc concret
npm run capture:images -- --host clic.xtec.cat --limit 50
npm run capture:images -- --force           # força recaptura
npm run capture:images -- --dry-run        # simula sense escriure
```

Variables d'entorn opcionals: `CHROMIUM_BIN`, `BROWSER_BIN`

---

## Verificació d'enllaços

```bash
npm run check:links               # verifica tots els URL del catàleg
STRICT_WARNINGS=true npm run check:links  # tracta avisos com a errors
```

Genera `reports/link-report.json` amb l'estat HTTP de cada URL. La interfície mostra el resultat directament a cada targeta.

El workflow `.github/workflows/link-check.yml` executa la verificació diàriament de forma automàtica.

---

## Firebase

La app funciona en dos modes:

| Mode | Favorits | Valoracions | Sincronització |
|------|----------|-------------|----------------|
| Local (per defecte) | localStorage | localStorage | No |
| Firebase | Firestore per usuari | Firestore compartides | Sí (tots els dispositius) |

### 1. Configurar `firebase-config.js`

Crea el fitxer `firebase-config.js` a l'arrel del projecte (no està en git):

```js
export const firebaseSettings = {
  enabled: true,
  googleAuthEnabled: true,
  adminEmail: "el-teu-email@gmail.com",  // email de l'administrador
};

export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

### 2. Activar serveis a Firebase Console

1. **Authentication → Sign-in method** → habilita `Anonymous`
2. **Authentication → Sign-in method** → habilita `Google` (si vols comptes)
3. **Authentication → Settings → Authorized domains** → afegeix el teu domini
4. **Firestore Database** → crea la base de dades en mode producció

### 3. Regles de Firestore

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /ratingSummary/{gameId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.auth.token.firebase.sign_in_provider != 'anonymous';
    }

    match /brokenReports/{gameId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.auth.token.firebase.sign_in_provider != 'anonymous';
    }

    match /submissions/{submissionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.auth.token.firebase.sign_in_provider != 'anonymous';
    }
  }
}
```

### 4. Estructura de dades a Firestore

```
users/{uid}/favorites/{gameId}       → favorits per usuari
users/{uid}/ratings/{gameId}         → valoració personal (value: 1-5)
users/{uid}/reports/{gameId}         → reportes "no funciona" per usuari
ratingSummary/{gameId}               → {avg, count} valoració agregada
brokenReports/{gameId}               → {count, adminReported} reportes agregats
submissions/{submissionId}           → activitats proposades pels usuaris
```

### 5. Funcions d'administrador

L'usuari amb l'email configurat a `adminEmail` té accés a:

- **Filtre "No funciona (admin)"**: activitats amagades (≥ 3 reports d'usuaris o marcades per l'admin). L'admin pot marcar una activitat i desapareix immediatament per a tothom.
- **Filtre "Reportades (admin)"**: activitats amb 1-2 reports, visibles però vigilades.

---

## Deploy

### Deploy ràpid (sense verificació d'enllaços)

```bash
npm run deploy:fast
```

### Deploy complet (amb verificació d'enllaços)

```bash
npm run deploy
```

### Simulació sense pujar res

```bash
npm run deploy:dry
```

### Variables de configuració del deploy

| Variable | Per defecte | Descripció |
|----------|-------------|------------|
| `DEPLOY_HOST` | `edutictac.es` | Host del servidor |
| `DEPLOY_USER` | `samgua` | Usuari SSH |
| `DEPLOY_PORT` | `2222` | Port SSH |
| `DEPLOY_PATH` | `/var/www/my_webapp__4/www` | Ruta remota |
| `DEPLOY_SSH_KEY` | — | Clau privada SSH |
| `DRY_RUN=1` | — | Simula sense copiar |
| `SKIP_LINKS=1` | — | Omet la verificació d'enllaços |
| `SKIP_VERIFY=1` | — | Omet la verificació post-deploy |
| `FIX_PERMS=1` | `1` | Ajusta permisos (dirs 755, fitxers 644) |

### Deploy automàtic via GitHub Actions

El workflow `.github/workflows/deploy.yml` fa el deploy automàticament en fer push a `main`. Configura aquests Secrets a GitHub (Settings → Secrets → Actions):

- `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_SSH_KEY`, `DEPLOY_PORT`
