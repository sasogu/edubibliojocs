#!/usr/bin/env node

/**
 * Gestor de Actividades Educativas
 * Herramientas para combinar, filtrar y gestionar actividades desde múltiples fuentes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

class ActivityManager {
  constructor() {
    this.activities = [];
  }

  /**
   * Cargar actividades desde archivo
   */
  loadFromFile(filepath) {
    try {
      const data = fs.readFileSync(filepath, 'utf-8');
      const activities = JSON.parse(data);
      this.activities = this.activities.concat(
        Array.isArray(activities) ? activities : [activities]
      );
      console.log(`✅ Cargadas ${Array.isArray(activities) ? activities.length : 1} actividades de ${path.basename(filepath)}`);
    } catch (error) {
      console.error(`❌ Error cargando ${filepath}: ${error.message}`);
    }
  }

  /**
   * Filtrar actividades por fuente
   */
  filterBySource(source) {
    return this.activities.filter(a => a.source === source);
  }

  /**
   * Filtrar actividades por área
   */
  filterByArea(area) {
    return this.activities.filter(a => a.area === area);
  }

  /**
   * Filtrar actividades por nivel
   */
  filterByLevel(level) {
    return this.activities.filter(a =>
      a.levels && a.levels.includes(level)
    );
  }

  /**
   * Filtrar actividades por idioma
   */
  filterByLanguage(language) {
    return this.activities.filter(a => a.language === language);
  }

  /**
   * Obtener actividades únicas (evitar duplicados por URL)
   */
  getUnique() {
    const seen = new Set();
    return this.activities.filter(activity => {
      if (!activity.url) return true;
      if (seen.has(activity.url)) return false;
      seen.add(activity.url);
      return true;
    });
  }

  /**
   * Ordenar actividades por campo
   */
  sortBy(field, order = 'asc') {
    return [...this.activities].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Agrupar actividades por campo
   */
  groupBy(field) {
    return this.activities.reduce((acc, activity) => {
      const key = activity[field] || 'Sin categoría';
      if (!acc[key]) acc[key] = [];
      acc[key].push(activity);
      return acc;
    }, {});
  }

  /**
   * Estadísticas generales
   */
  getStats() {
    return {
      total: this.activities.length,
      unique: this.getUnique().length,
      sources: this.groupBy('source'),
      areas: this.groupBy('area'),
      languages: this.groupBy('language'),
      levels: this.groupBy('levels'),
      fetchDate: new Date().toISOString()
    };
  }

  /**
   * Guardar actividades
   */
  saveTo(filepath) {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filepath, JSON.stringify(this.activities, null, 2));
    console.log(`💾 Guardadas ${this.activities.length} actividades en ${filepath}`);
  }

  /**
   * Exportar estadísticas a archivo
   */
  exportStats(filepath) {
    const stats = this.getStats();
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filepath, JSON.stringify(stats, null, 2));
    console.log(`📊 Estadísticas guardadas en ${filepath}`);
  }

  /**
   * Generar reporte HTML
   */
  generateHTMLReport(filepath) {
    const stats = this.getStats();
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Actividades Educativas</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
      color: #333;
    }
    h1, h2 { color: #2c3e50; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-card h3 {
      margin: 0 0 10px 0;
      color: #3498db;
      font-size: 14px;
      text-transform: uppercase;
    }
    .stat-card .number {
      font-size: 36px;
      font-weight: bold;
      color: #2c3e50;
    }
    .source-list {
      list-style: none;
      padding: 0;
    }
    .source-list li {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
    }
    .source-list li:last-child {
      border-bottom: none;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      color: white;
    }
    .badge-learningapps { background: #4E7BA8; }
    .badge-didactalia { background: #F5991A; }
    .badge-h5p { background: #1D7FA3; }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    th {
      background: #2c3e50;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .timestamp {
      color: #7f8c8d;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>📚 Reporte de Actividades Educativas</h1>
  <p class="timestamp">Generado: ${new Date().toLocaleString('es-ES')}</p>

  <div class="stats-grid">
    <div class="stat-card">
      <h3>Total de Actividades</h3>
      <div class="number">${stats.total}</div>
    </div>
    <div class="stat-card">
      <h3>Actividades Únicas</h3>
      <div class="number">${stats.unique}</div>
    </div>
    <div class="stat-card">
      <h3>Fuentes</h3>
      <div class="number">${Object.keys(stats.sources).length}</div>
    </div>
    <div class="stat-card">
      <h3>Áreas Educativas</h3>
      <div class="number">${Object.keys(stats.areas).length}</div>
    </div>
  </div>

  <h2>Actividades por Fuente</h2>
  <table>
    <tr>
      <th>Fuente</th>
      <th>Cantidad</th>
      <th>Porcentaje</th>
    </tr>
    ${Object.entries(stats.sources).map(([source, activities]) => `
    <tr>
      <td><span class="badge badge-${source.toLowerCase().split('.')[0]}">${source}</span></td>
      <td>${activities.length}</td>
      <td>${((activities.length / stats.total) * 100).toFixed(1)}%</td>
    </tr>
    `).join('')}
  </table>

  <h2>Actividades por Área</h2>
  <table>
    <tr>
      <th>Área</th>
      <th>Cantidad</th>
    </tr>
    ${Object.entries(stats.areas).map(([area, activities]) => `
    <tr>
      <td>${area}</td>
      <td>${activities.length}</td>
    </tr>
    `).join('')}
  </table>

  <h2>Distribución por Idioma</h2>
  <table>
    <tr>
      <th>Idioma</th>
      <th>Cantidad</th>
    </tr>
    ${Object.entries(stats.languages).map(([lang, activities]) => `
    <tr>
      <td>${lang}</td>
      <td>${activities.length}</td>
    </tr>
    `).join('')}
  </table>
</body>
</html>
    `;

    fs.writeFileSync(filepath, html);
    console.log(`📋 Reporte HTML generado en ${filepath}`);
  }
}

/**
 * Función principal para CLI
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const params = args.slice(1);

  const manager = new ActivityManager();

  console.log('🎓 Gestor de Actividades Educativas\n');

  switch (command) {
    case 'merge': {
      // Combinar múltiples archivos
      console.log('🔗 Combinando archivos...\n');
      params.forEach(filepath => {
        manager.loadFromFile(filepath);
      });

      const output = path.join(DATA_DIR, 'combined-activities.json');
      manager.saveTo(output);
      break;
    }

    case 'stats': {
      // Mostrar estadísticas
      if (params.length === 0) {
        console.error('❌ Especifica archivos: combine stats archivo1.json archivo2.json ...');
        process.exit(1);
      }

      params.forEach(filepath => {
        manager.loadFromFile(filepath);
      });

      console.log('\n📊 ESTADÍSTICAS\n');
      const stats = manager.getStats();
      console.log(`Total: ${stats.total}`);
      console.log(`Únicos: ${stats.unique}\n`);

      console.log('Por fuente:');
      Object.entries(stats.sources).forEach(([source, items]) => {
        console.log(`  • ${source}: ${items.length}`);
      });

      console.log('\nPor área:');
      Object.entries(stats.areas).forEach(([area, items]) => {
        console.log(`  • ${area}: ${items.length}`);
      });

      console.log('\nPor idioma:');
      Object.entries(stats.languages).forEach(([lang, items]) => {
        console.log(`  • ${lang}: ${items.length}`);
      });

      // Guardar estadísticas
      const statsFile = path.join(DATA_DIR, 'statistics.json');
      manager.exportStats(statsFile);
      break;
    }

    case 'report': {
      // Generar reporte HTML
      if (params.length === 0) {
        console.error('❌ Especifica archivos: report archivo1.json archivo2.json ...');
        process.exit(1);
      }

      params.forEach(filepath => {
        manager.loadFromFile(filepath);
      });

      const htmlFile = path.join(DATA_DIR, 'activities-report.html');
      manager.generateHTMLReport(htmlFile);
      break;
    }

    case 'filter': {
      // Filtrar por criterio
      if (params.length < 3) {
        console.error('❌ Uso: filter <archivo> <field> <value>');
        console.error('   Campos: source, area, language, level');
        process.exit(1);
      }

      manager.loadFromFile(params[0]);

      const [field, value] = [params[1], params[2]];
      let filtered = [];

      if (field === 'source') {
        filtered = manager.filterBySource(value);
      } else if (field === 'area') {
        filtered = manager.filterByArea(value);
      } else if (field === 'language') {
        filtered = manager.filterByLanguage(value);
      } else if (field === 'level') {
        filtered = manager.filterByLevel(value);
      } else {
        console.error(`❌ Campo desconocido: ${field}`);
        process.exit(1);
      }

      console.log(`\n✅ ${filtered.length} actividades encontradas\n`);
      filtered.forEach(a => {
        console.log(`${a.title} (${a.source})`);
      });

      const output = path.join(DATA_DIR, `filtered-${field}-${value}.json`);
      manager.activities = filtered;
      manager.saveTo(output);
      break;
    }

    case 'unique': {
      // Eliminar duplicados
      if (params.length === 0) {
        console.error('❌ Especifica archivo: unique archivo.json');
        process.exit(1);
      }

      manager.loadFromFile(params[0]);
      manager.activities = manager.getUnique();
      console.log(`✅ ${manager.activities.length} actividades únicas`);

      const output = path.join(DATA_DIR, 'unique-activities.json');
      manager.saveTo(output);
      break;
    }

    default:
      console.log(`
Uso: node import-activities-manager.mjs <comando> [parámetros]

Comandos:

  merge <archivo1> <archivo2> ...
    Combina múltiples archivos de actividades

  stats <archivo1> <archivo2> ...
    Muestra estadísticas de actividades

  report <archivo1> <archivo2> ...
    Genera reporte HTML con estadísticas

  filter <archivo> <field> <value>
    Filtra actividades por criterio
    Campos: source, area, language, level

  unique <archivo>
    Elimina duplicados por URL

Ejemplos:

  node import-activities-manager.mjs merge learningapps.json didactalia.json h5p.json
  node import-activities-manager.mjs stats combined-activities.json
  node import-activities-manager.mjs report combined-activities.json
  node import-activities-manager.mjs filter combined-activities.json area Lengua
  node import-activities-manager.mjs unique combined-activities.json
      `);
      break;
  }

  console.log('\n✨ Operación completada.\n');
}

main();
