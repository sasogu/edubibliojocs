# Importador de Actividades Educativas desde APIs Abiertas

Script automatizado para extraer actividades educativas interactivas desde múltiples fuentes y catalogarlas por procedencia en tu proyecto.

## APIs Soportadas

### 1. **LearningApps.org**
- 📍 Plataforma de actividades interactivas educativas
- 🌐 https://learningapps.org
- 📊 Miles de actividades creadas por docentes (quizzes, puzzles, memory games, etc.)
- 🔑 No requiere API key
- 🎯 Filtrado por: idioma, categoría, nivel educativo

### 2. **Didactalia**
- 📍 Plataforma española de recursos educativos interactivos
- 🌐 https://didactalia.net
- 📊 Recursos especializados en educación española
- 🔑 Acceso libre
- 🎯 Filtrado por: idioma, asignatura, nivel, tipo de recurso

### 3. **H5P**
- 📍 Proveedor de contenidos interactivos reutilizables
- 🌐 https://h5p.org
- 📊 Estándares abiertos para contenidos interactivos
- 🔑 Acceso público
- 🎯 Filtrado por: idioma, tipo de contenido, nivel educativo

## Instalación

### Requisitos
- Node.js 14+ 
- npm/yarn

### Dependencias
```bash
npm install node-fetch
```

## Uso

### Extraer de todas las fuentes
```bash
node scripts/import-educational-apis.mjs all
```

Genera:
- `data/imported-activities.json` - Todas las actividades catalogadas
- `data/imported-activities-report.json` - Reporte de estadísticas

### Extraer de una fuente específica
```bash
# Solo LearningApps
node scripts/import-educational-apis.mjs learningapps data/learningapps-activities.json

# Solo Didactalia
node scripts/import-educational-apis.mjs didactalia data/didactalia-activities.json

# Solo H5P
node scripts/import-educational-apis.mjs h5p data/h5p-activities.json
```

## Estructura de Datos

Cada actividad extraída incluye:

```json
{
  "id": "learningapps-12345",
  "title": "Nombre de la actividad",
  "area": "Matematicas",
  "language": "Castellano",
  "url": "https://learningapps.org/12345",
  "notes": "Descripción de la actividad",
  "levels": ["Primaria 3er ciclo"],
  "image": "URL de thumbnail",
  "imageSource": "URL de la imagen original",
  "source": "LearningApps.org",
  "sourceColor": "#4E7BA8",
  "sourceUrl": "https://learningapps.org",
  "fetchedAt": "2024-05-06T10:30:00.000Z"
}
```

### Campos

| Campo | Descripción |
|-------|------------|
| `id` | Identificador único (prefijado con fuente) |
| `title` | Título de la actividad |
| `area` | Área/materia educativa |
| `language` | Idioma de la actividad |
| `url` | Enlace directo a la actividad |
| `notes` | Descripción o notas |
| `levels` | Niveles educativos |
| `image` | URL del thumbnail |
| `source` | De dónde fue extraída |
| `sourceColor` | Color asociado a la fuente (para UI) |
| `sourceUrl` | URL de la plataforma origen |
| `fetchedAt` | Timestamp de extracción |

## Reporte de Extracción

El script genera un reporte JSON con estadísticas:

```json
{
  "timestamp": "2024-05-06T10:30:00.000Z",
  "totalActivities": 150,
  "bySource": {
    "LearningApps.org": 75,
    "Didactalia": 50,
    "H5P": 25
  },
  "byArea": {
    "Lengua": 40,
    "Matematicas": 60,
    "Ciencias": 30,
    "Historia": 20
  },
  "byLanguage": {
    "Castellano": 140,
    "Catalan": 10
  }
}
```

## Integración en tu Proyecto

### Opción 1: Reemplazar games.json
```bash
node scripts/import-educational-apis.mjs all data/games.json
```

### Opción 2: Mantener catálogos separados
```bash
node scripts/import-educational-apis.mjs learningapps data/games-learningapps.json
node scripts/import-educational-apis.mjs didactalia data/games-didactalia.json
node scripts/import-educational-apis.mjs h5p data/games-h5p.json
```

Luego, en tu código:
```javascript
// Cargar por fuente
const learningappsGames = require('./data/games-learningapps.json');
const didataliaGames = require('./data/games-didactalia.json');
const h5pGames = require('./data/games-h5p.json');

// Combinar
const allGames = [...learningappsGames, ...didataliaGames, ...h5pGames];

// O filtrar por fuente
const educativeGames = allGames.filter(g => g.source === 'LearningApps.org');
```

### Opción 3: Actualización programada (Cron)
```bash
# Actualizar diariamente a las 2 AM
0 2 * * * cd /home/sasogu/github/edubibliojocs && node scripts/import-educational-apis.mjs all
```

## Mapeo de Categorías

El script normaliza las categorías a:
- `Lengua`
- `Matematicas`
- `Ciencias`
- `Historia`
- `Geografía`
- `Artes`
- `Música`
- `Educación Física`
- `Sociales`
- `Otros`

## Mapeo de Niveles

Normaliza a:
- `Infantil`
- `Primaria`
- `Secundaria`
- `Bachillerato`
- `Formación Profesional`
- `Universidad`

## Limitaciones y Notas

- ⚠️ Las APIs tienen rate limits. El script incluye timeouts de 10s por defecto.
- 📍 El límite inicial es de 50 actividades por fuente. Ajusta en el código según necesites.
- 🔄 Algunas APIs pueden requerir registro para mayor precisión en los datos.
- 📝 Los datos se extraen en el idioma especificado (actualmente fijado a 'es').
- ⚡ La extracción de todas las fuentes toma ~30 segundos dependiendo de la latencia.

## Solución de Problemas

### "Error: HTTP 401/403"
Algunas APIs pueden requerir autenticación o tienen reglas CORS. Consideraciones:
- Verifica si necesita API key
- Comprueba regiones de acceso
- Usa proxy si es necesario

### "Timeout Error"
- Aumenta el valor de timeout en el script
- Reduce el número de actividades (`limit`)
- Intenta con una API a la vez

### Actividades sin imagen
Es normal. Muchas plataformas no proporcionan thumbnails. El campo `image` será vacío.

## Personalización

Para añadir una nueva API:

1. Añade configuración en `API_CONFIG`
2. Crea una función `fetchFromNewSource()`
3. Implementa el mapeo de campos
4. Añade la lógica en `main()`

Ejemplo:
```javascript
async function fetchFromMiAPI() {
  // tu código aquí
  return activitiesArray;
}
```

## Licencia

Este script está diseñado para trabajar con fuentes de recursos educativos abiertos. Respeta las licencias de cada plataforma al distribuir los recursos.

---

**Última actualización**: Mayo 2024
