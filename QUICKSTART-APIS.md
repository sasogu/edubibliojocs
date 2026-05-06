# 🚀 Guía Rápida: Importar Actividades desde APIs Abiertas

## Inicio Rápido

### Opción 1: Importar TODAS las APIs de una vez (Recomendado)

```bash
npm run import:apis
```

Esto ejecutará:
1. ✅ Extrae actividades de LearningApps, Didactalia y H5P
2. ✅ Las guarda en archivos separados por fuente
3. ✅ Las combina en un archivo único
4. ✅ Genera reporte HTML con estadísticas

**Resultado:**
- `data/activities-learningapps.json` - Actividades de LearningApps
- `data/activities-didactalia.json` - Actividades de Didactalia
- `data/activities-h5p.json` - Actividades de H5P
- `data/combined-activities.json` - Todas combinadas
- `data/activities-report.html` - **Reporte visual** (¡Abre esto en el navegador!)
- `data/statistics.json` - Estadísticas en JSON

---

## Comandos Individuales

### Extraer de una fuente específica

```bash
# Solo LearningApps.org
npm run import:apis:learningapps

# Solo Didactalia
npm run import:apis:didactalia

# Solo H5P
npm run import:apis:h5p
```

### Extracción sin combinar

```bash
npm run import:apis:extract
```

Solo extrae y guarda por separado, sin combinar ni generar reportes.

---

## Gestionar Actividades

### Ver estadísticas

```bash
npm run import:apis:manager stats data/combined-activities.json
```

Mostrará:
- Total de actividades
- Distribución por fuente
- Distribución por área educativa
- Distribución por idioma

### Generar reporte HTML

```bash
npm run import:apis:manager report data/combined-activities.json
```

Genera un reporte visual bonito en `data/activities-report.html`.

### Filtrar actividades

```bash
# Solo actividades de Lengua
npm run import:apis:manager filter data/combined-activities.json area Lengua

# Solo de LearningApps.org
npm run import:apis:manager filter data/combined-activities.json source "LearningApps.org"

# Solo de Primaria
npm run import:apis:manager filter data/combined-activities.json level Primaria
```

### Eliminar duplicados

```bash
npm run import:apis:manager unique data/combined-activities.json
```

---

## Integración en tu App

### JavaScript (Node.js/Browser)

```javascript
// Cargar actividades
const activities = require('./data/combined-activities.json');

// Filtrar por fuente
const learningappsActivities = activities.filter(
  a => a.source === 'LearningApps.org'
);

// Filtrar por área
const languageActivities = activities.filter(
  a => a.area === 'Lengua'
);

// Mostrar en tabla/lista
activities.forEach(activity => {
  console.log(`${activity.title} (${activity.source})`);
  console.log(`  Area: ${activity.area}`);
  console.log(`  URL: ${activity.url}`);
  console.log(`  Niveles: ${activity.levels.join(', ')}`);
});
```

### HTML (Embeber iframes)

```html
<!-- LearningApps actividades embebidas -->
<div class="activities">
  <template id="activity">
    <div class="activity-card">
      <h3>{{title}}</h3>
      <p>{{area}} - {{source}}</p>
      <iframe src="{{url}}"></iframe>
      <p>{{notes}}</p>
    </div>
  </template>
</div>

<script>
fetch('./data/combined-activities.json')
  .then(r => r.json())
  .then(activities => {
    const template = document.querySelector('#activity');
    activities.forEach(activity => {
      const html = template.innerHTML
        .replace('{{title}}', activity.title)
        .replace('{{area}}', activity.area)
        .replace('{{source}}', activity.source)
        .replace('{{url}}', activity.url)
        .replace('{{notes}}', activity.notes);
      
      document.querySelector('.activities').innerHTML += html;
    });
  });
</script>
```

---

## Estructura de los Datos

Cada actividad tiene esta estructura:

```json
{
  "id": "learningapps-12345",
  "title": "Multiplicación de números",
  "area": "Matematicas",
  "language": "Castellano",
  "url": "https://learningapps.org/12345",
  "notes": "Práctica de tablas de multiplicar",
  "levels": ["Primaria 3er ciclo"],
  "image": "https://...",
  "source": "LearningApps.org",
  "sourceColor": "#4E7BA8",
  "sourceUrl": "https://learningapps.org",
  "fetchedAt": "2024-05-06T10:30:00.000Z"
}
```

---

## Casos de Uso

### 1. Agregar actividades a games.json existente

```bash
# Extraer
npm run import:apis

# Combinar con games.json existente
cp data/combined-activities.json data/games-new.json

# En tu app, cargar ambos:
const existingGames = require('./data/games.json');
const newActivities = require('./data/combined-activities.json');
const allGames = [...existingGames, ...newActivities];
```

### 2. Actualizar regularmente (Cron)

```bash
# Añade a crontab:
0 2 * * * cd /path/to/edubibliojocs && npm run import:apis
```

Ejecutará la importación cada día a las 2 AM.

### 3. Solo actividades de cierta área

```bash
npm run import:apis:manager filter data/combined-activities.json area Lengua > data/lengua-activities.json
```

### 4. Por nivel educativo

```bash
npm run import:apis:manager filter data/combined-activities.json level Primaria
```

---

## Solución de Problemas

### "Error: Cannot find module 'node-fetch'"

```bash
npm install node-fetch
```

### "Timeout Error"

Las APIs pueden ser lentas la primera vez. Espera unos segundos y reintenta:

```bash
npm run import:apis:extract
```

### Archivos vacíos o sin actividades

Esto puede ocurrir si:
1. Las APIs no están disponibles (revisa conexión)
2. El filtrado es muy restrictivo (ej: idioma no disponible)
3. Las APIs han cambiado su estructura

Para debug, ejecuta una por una:

```bash
npm run import:apis:learningapps
npm run import:apis:didactalia
npm run import:apis:h5p
```

### Ver logs detallados

Edita `scripts/import-educational-apis.mjs` y descomenta la línea:

```javascript
// console.log(JSON.stringify(data, null, 2)); // Descomenta para debug
```

---

## Personalizaciones

### Cambiar idioma de extracción

En `scripts/import-educational-apis.mjs`, busca:

```javascript
const activities = await fetchFromLearningApps('es', 50);
```

Y cambia `'es'` a otro código de idioma (ej: `'en'`, `'fr'`, `'ca'`).

### Cambiar cantidad de actividades

En el mismo archivo, cambia el `50` a otro número:

```javascript
const activities = await fetchFromLearningApps('es', 100); // 100 en vez de 50
```

### Añadir nueva API

1. Abre `scripts/import-educational-apis.mjs`
2. Crea una nueva función `fetchFromMiAPI()`
3. Añade en la sección `main()`:

```javascript
} else if (source === 'miapi') {
  activities = await fetchFromMiAPI('es', 50);
}
```

---

## 📊 Visualizar Reportes

Después de ejecutar `npm run import:apis`, abre en tu navegador:

```
file:///path/to/edubibliojocs/data/activities-report.html
```

Verás:
- 📈 Gráficos de distribución
- 📊 Tablas de estadísticas
- 🞔 Actividades por fuente, área e idioma
- 🎯 Totales y porcentajes

---

## ¿Preguntas?

Revisa la documentación completa en [API-IMPORT-README.md](./API-IMPORT-README.md)

¡Listo! 🎉 Ahora tienes miles de actividades educativas catalogadas y listas para usar.
