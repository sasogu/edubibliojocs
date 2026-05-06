/**
 * EJEMPLO DE INTEGRACIÓN: Actividades desde APIs
 * 
 * Este archivo muestra cómo integrar las actividades importadas desde APIs
 * en tu aplicación existente (app.js)
 * 
 * Opciones de integración:
 * 1. Mantener por separado (data/activities-*.json)
 * 2. Combinar con games.json existente
 * 3. Cargar dinámicamente según filtros
 */

// ============================================================================
// OPCIÓN 1: Cargar actividades desde APIs como fuente separada
// ============================================================================

/**
 * Gestor de actividades desde APIs
 */
class APIActivityManager {
  constructor() {
    this.activities = [];
    this.sources = {
      learningapps: 'data/activities-learningapps.json',
      didactalia: 'data/activities-didactalia.json',
      h5p: 'data/activities-h5p.json',
      combined: 'data/combined-activities.json'
    };
  }

  /**
   * Cargar actividades de una fuente específica
   */
  async loadSource(source = 'combined') {
    try {
      const url = this.sources[source];
      if (!url) throw new Error(`Fuente desconocida: ${source}`);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      this.activities = await response.json();
      console.log(`✅ Cargadas ${this.activities.length} actividades desde ${source}`);
      return this.activities;
    } catch (error) {
      console.error(`❌ Error cargando ${source}:`, error);
      return [];
    }
  }

  /**
   * Obtener actividades de una fuente específica
   */
  getBySource(source) {
    return this.activities.filter(a => a.source === source);
  }

  /**
   * Filtrar por área
   */
  filterByArea(area) {
    return this.activities.filter(a => a.area === area);
  }

  /**
   * Filtrar por nivel
   */
  filterByLevel(level) {
    return this.activities.filter(a =>
      a.levels && a.levels.some(l => l.includes(level))
    );
  }

  /**
   * Buscar por texto
   */
  search(query) {
    const q = query.toLowerCase();
    return this.activities.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.notes.toLowerCase().includes(q) ||
      a.area.toLowerCase().includes(q)
    );
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    return {
      total: this.activities.length,
      bySources: this.groupBy('source'),
      byArea: this.groupBy('area'),
      byLevels: this.groupBy('levels')
    };
  }

  /**
   * Agrupar por campo
   */
  groupBy(field) {
    return this.activities.reduce((acc, activity) => {
      let key = activity[field];
      if (!key) return acc;

      if (field === 'levels' && Array.isArray(key)) {
        key.forEach(level => {
          acc[level] = (acc[level] || 0) + 1;
        });
      } else {
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {});
  }
}

// ============================================================================
// OPCIÓN 2: Combinar actividades de APIs con games.json existente
// ============================================================================

/**
 * Combinar ambas fuentes en una sola lista
 */
async function loadAllActivities() {
  try {
    // Cargar games.json existente
    const gamesResponse = await fetch('./data/games.json');
    const existingGames = gamesResponse.ok ? await gamesResponse.json() : [];

    // Cargar actividades desde APIs
    const apiManager = new APIActivityManager();
    const apiActivities = await apiManager.loadSource('combined');

    // Combinar
    const allActivities = [...existingGames, ...apiActivities];

    console.log(`📊 Total: ${allActivities.length} actividades`);
    console.log(`   • Existentes: ${existingGames.length}`);
    console.log(`   • De APIs: ${apiActivities.length}`);

    return allActivities;
  } catch (error) {
    console.error('❌ Error cargando actividades:', error);
    return [];
  }
}

// ============================================================================
// OPCIÓN 3: Componentes visuales para mostrar actividades
// ============================================================================

/**
 * Crear elemento HTML para una actividad
 */
function createActivityCard(activity) {
  const card = document.createElement('div');
  card.className = 'activity-card';
  card.style.cssText = `
    border-left: 4px solid ${activity.sourceColor || '#ccc'};
    padding: 12px;
    margin-bottom: 12px;
    background: #f9f9f9;
    border-radius: 4px;
    cursor: pointer;
  `;

  const badge = document.createElement('span');
  badge.className = 'source-badge';
  badge.style.cssText = `
    display: inline-block;
    background: ${activity.sourceColor || '#ccc'};
    color: white;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 8px;
  `;
  badge.textContent = activity.source || 'Desconocida';

  const title = document.createElement('h3');
  title.style.margin = '8px 0';
  title.textContent = activity.title;

  const meta = document.createElement('div');
  meta.style.cssText = 'font-size: 12px; color: #666; margin: 8px 0;';
  meta.innerHTML = `
    <div>📚 ${activity.area || 'Sin categoría'}</div>
    <div>🎓 ${activity.levels?.join(', ') || 'Sin nivel'}</div>
    ${activity.notes ? `<div>ℹ️ ${activity.notes}</div>` : ''}
  `;

  const link = document.createElement('a');
  link.href = activity.url;
  link.target = '_blank';
  link.style.cssText = `
    display: inline-block;
    margin-top: 8px;
    padding: 6px 12px;
    background: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 3px;
    font-size: 12px;
  `;
  link.textContent = '🔗 Abrir actividad';

  card.appendChild(badge);
  card.appendChild(title);
  card.appendChild(meta);
  card.appendChild(link);

  return card;
}

/**
 * Renderizar lista de actividades
 */
function renderActivities(activities, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Contenedor no encontrado: ${containerId}`);
    return;
  }

  container.innerHTML = '';

  if (activities.length === 0) {
    container.innerHTML = '<p>No se encontraron actividades.</p>';
    return;
  }

  activities.forEach(activity => {
    container.appendChild(createActivityCard(activity));
  });
}

// ============================================================================
// OPCIÓN 4: Filtros interactivos
// ============================================================================

/**
 * Crear controles de filtro
 */
class ActivityFilters {
  constructor(activities) {
    this.activities = activities;
    this.filters = {
      source: null,
      area: null,
      level: null,
      search: ''
    };
  }

  /**
   * Aplicar filtros
   */
  apply() {
    let results = this.activities;

    // Filtro por fuente
    if (this.filters.source) {
      results = results.filter(a => a.source === this.filters.source);
    }

    // Filtro por área
    if (this.filters.area) {
      results = results.filter(a => a.area === this.filters.area);
    }

    // Filtro por nivel
    if (this.filters.level) {
      results = results.filter(a =>
        a.levels && a.levels.some(l => l.includes(this.filters.level))
      );
    }

    // Búsqueda por texto
    if (this.filters.search) {
      const q = this.filters.search.toLowerCase();
      results = results.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.notes.toLowerCase().includes(q)
      );
    }

    return results;
  }

  /**
   * Obtener opciones únicas para un filtro
   */
  getOptions(filterType) {
    const options = new Set();

    if (filterType === 'source') {
      this.activities.forEach(a => {
        if (a.source) options.add(a.source);
      });
    } else if (filterType === 'area') {
      this.activities.forEach(a => {
        if (a.area) options.add(a.area);
      });
    } else if (filterType === 'level') {
      this.activities.forEach(a => {
        if (a.levels && Array.isArray(a.levels)) {
          a.levels.forEach(l => options.add(l));
        }
      });
    }

    return Array.from(options).sort();
  }

  /**
   * Crear elementos select para filtros
   */
  createFilterUI() {
    const container = document.createElement('div');
    container.className = 'filters';
    container.style.cssText = `
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    `;

    // Filtro por fuente
    const sourceLabel = document.createElement('label');
    sourceLabel.textContent = 'Fuente: ';
    const sourceSelect = document.createElement('select');
    sourceSelect.style.padding = '4px 8px';
    sourceSelect.innerHTML = '<option value="">Todas</option>';
    this.getOptions('source').forEach(source => {
      const option = document.createElement('option');
      option.value = source;
      option.textContent = source;
      sourceSelect.appendChild(option);
    });
    sourceSelect.addEventListener('change', (e) => {
      this.filters.source = e.target.value || null;
      this.updateResults();
    });
    sourceLabel.appendChild(sourceSelect);

    // Filtro por área
    const areaLabel = document.createElement('label');
    areaLabel.textContent = 'Área: ';
    const areaSelect = document.createElement('select');
    areaSelect.style.padding = '4px 8px';
    areaSelect.innerHTML = '<option value="">Todas</option>';
    this.getOptions('area').forEach(area => {
      const option = document.createElement('option');
      option.value = area;
      option.textContent = area;
      areaSelect.appendChild(option);
    });
    areaSelect.addEventListener('change', (e) => {
      this.filters.area = e.target.value || null;
      this.updateResults();
    });
    areaLabel.appendChild(areaSelect);

    // Búsqueda
    const searchLabel = document.createElement('label');
    searchLabel.textContent = 'Buscar: ';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Búsqueda...';
    searchInput.style.padding = '4px 8px';

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filters.search = e.target.value;
        this.updateResults();
      }, 300);
    });
    searchLabel.appendChild(searchInput);

    container.appendChild(sourceLabel);
    container.appendChild(areaLabel);
    container.appendChild(searchLabel);

    return container;
  }

  updateResults() {
    const results = this.apply();
    renderActivities(results, 'activitiesContainer');
  }
}

// ============================================================================
// EJEMPLO DE USO
// ============================================================================

/*
// En tu HTML:
<div id="activitiesContainer"></div>

// En tu script:
document.addEventListener('DOMContentLoaded', async () => {
  // Opción 1: Solo desde APIs
  const apiManager = new APIActivityManager();
  const activities = await apiManager.loadSource('combined');
  renderActivities(activities, 'activitiesContainer');

  // Opción 2: Combinar con games.json
  const allActivities = await loadAllActivities();
  renderActivities(allActivities, 'activitiesContainer');

  // Opción 3: Con filtros interactivos
  const apiManager = new APIActivityManager();
  const activities = await apiManager.loadSource('combined');
  const filters = new ActivityFilters(activities);
  
  document.getElementById('activitiesContainer').appendChild(
    filters.createFilterUI()
  );
  filters.updateResults();
});
*/

// ============================================================================
// EXPORTAR PARA USO EN OTROS MÓDULOS
// ============================================================================

export { APIActivityManager, ActivityFilters, createActivityCard, renderActivities, loadAllActivities };
