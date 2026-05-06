#!/usr/bin/env node

/**
 * Script para importar actividades educativas desde múltiples APIs (Versión Demo)
 * Usa datos de ejemplo para demostración
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

// Crear directorio de datos si no existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Datos de ejemplo - LearningApps
const LEARNINGAPPS_DATA = [
  {
    id: 'lrn-001',
    title: 'Tabla de Multiplicar del 7',
    area: 'Matematicas',
    notes: 'Practica la multiplicación del 7',
    levels: ['Primaria 3er ciclo'],
    source: 'LearningApps.org'
  },
  {
    id: 'lrn-002',
    title: 'Ortografía: Uso de Z vs C',
    area: 'Lengua',
    notes: 'Aprende cuándo usar z o c',
    levels: ['Primaria'],
    source: 'LearningApps.org'
  },
  {
    id: 'lrn-003',
    title: 'Capitales de Europa',
    area: 'Geografía',
    notes: 'Identifica capitales europeas',
    levels: ['Primaria 3er ciclo'],
    source: 'LearningApps.org'
  },
  {
    id: 'lrn-004',
    title: 'Ciclo del Agua',
    area: 'Ciencias',
    notes: 'Aprende el ciclo del agua en la Tierra',
    levels: ['Primaria'],
    source: 'LearningApps.org'
  },
  {
    id: 'lrn-005',
    title: 'Verbos Regulares en Inglés',
    area: 'Lengua',
    notes: 'Conjugación de verbos regulares',
    levels: ['Primaria 3er ciclo'],
    source: 'LearningApps.org'
  }
];

// Datos de ejemplo - Didactalia
const DIDACTALIA_DATA = [
  {
    id: 'did-001',
    title: 'Recursos Naturales de España',
    area: 'Ciencias',
    notes: 'Aprende sobre los recursos naturales españoles',
    levels: ['Primaria'],
    source: 'Didactalia'
  },
  {
    id: 'did-002',
    title: 'Historia Medieval en Europa',
    area: 'Historia',
    notes: 'Período medieval europeo y sus características',
    levels: ['Secundaria'],
    source: 'Didactalia'
  },
  {
    id: 'did-003',
    title: 'Fracciones Matemáticas',
    area: 'Matematicas',
    notes: 'Introducción a las fracciones y operaciones',
    levels: ['Primaria 2º ciclo'],
    source: 'Didactalia'
  },
  {
    id: 'did-004',
    title: 'La Literatura del Siglo de Oro',
    area: 'Lengua',
    notes: 'Autores clásicos españoles del Siglo de Oro',
    levels: ['Secundaria'],
    source: 'Didactalia'
  },
  {
    id: 'did-005',
    title: 'Volcanes y Terremotos',
    area: 'Ciencias',
    notes: 'Fenómenos geológicos: vulcanismo y sismicidad',
    levels: ['Primaria 3er ciclo'],
    source: 'Didactalia'
  },
  {
    id: 'did-006',
    title: 'Economía Española',
    area: 'Sociales',
    notes: 'Sectores económicos de España',
    levels: ['Secundaria'],
    source: 'Didactalia'
  }
];

// Datos de ejemplo - H5P
const H5P_DATA = [
  {
    id: 'h5p-001',
    title: 'Fotosíntesis: Video Interactivo',
    area: 'Ciencias',
    notes: 'Aprende sobre la fotosíntesis con video interactivo',
    levels: ['Primaria 3er ciclo'],
    source: 'H5P'
  },
  {
    id: 'h5p-002',
    title: 'Quiz: Capitales del Mundo',
    area: 'Geografía',
    notes: 'Test interactivo de capitales mundiales',
    levels: ['Primaria'],
    source: 'H5P'
  },
  {
    id: 'h5p-003',
    title: 'La Revolución Francesa',
    area: 'Historia',
    notes: 'Presentación interactiva sobre la Revolución Francesa',
    levels: ['Secundaria'],
    source: 'H5P'
  },
  {
    id: 'h5p-004',
    title: 'Mapa de España - Puzzle Interactivo',
    area: 'Geografía',
    notes: 'Identifica regiones en el mapa de España',
    levels: ['Primaria'],
    source: 'H5P'
  },
  {
    id: 'h5p-005',
    title: 'Memoria: Vocabulario Inglés',
    area: 'Lengua',
    notes: 'Juego de memoria con vocabulario en inglés',
    levels: ['Primaria 2º ciclo'],
    source: 'H5P'
  },
  {
    id: 'h5p-006',
    title: 'Ecuaciones de Primer Grado',
    area: 'Matematicas',
    notes: 'Aprende a resolver ecuaciones lineales',
    levels: ['Secundaria 1º'],
    source: 'H5P'
  },
  {
    id: 'h5p-007',
    title: 'La Célula: Estructura y Funciones',
    area: 'Ciencias',
    notes: 'Conoce las partes de la célula',
    levels: ['Secundaria 1º'],
    source: 'H5P'
  }
];

/**
 * Enriquecer datos con URL y metadatos
 */
function enrichActivity(activity, source) {
  return {
    id: `${source.toLowerCase()}-${activity.id}`,
    title: activity.title,
    area: activity.area,
    language: 'Castellano',
    url: `https://${source.toLowerCase()}.example.com/activity/${activity.id}`,
    notes: activity.notes,
    levels: activity.levels,
    image: '',
    imageSource: '',
    source: activity.source,
    sourceColor: getSourceColor(activity.source),
    sourceUrl: `https://${source.toLowerCase()}.example.com`,
    fetchedAt: new Date().toISOString()
  };
}

/**
 * Obtener color por fuente
 */
function getSourceColor(source) {
  const colors = {
    'LearningApps.org': '#4E7BA8',
    'Didactalia': '#F5991A',
    'H5P': '#1D7FA3'
  };
  return colors[source] || '#999';
}

/**
 * Guardar actividades en JSON
 */
function saveActivities(activities, filename) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(activities, null, 2));
  console.log(`💾 Guardado: ${filepath} (${activities.length} actividades)`);
  return activities.length;
}

/**
 * Generar reporte
 */
function generateReport(allActivities) {
  const report = {
    timestamp: new Date().toISOString(),
    totalActivities: allActivities.length,
    bySource: {},
    byArea: {},
    byLanguage: {}
  };

  allActivities.forEach(activity => {
    if (!report.bySource[activity.source]) {
      report.bySource[activity.source] = 0;
    }
    report.bySource[activity.source]++;

    if (!report.byArea[activity.area]) {
      report.byArea[activity.area] = 0;
    }
    report.byArea[activity.area]++;

    if (!report.byLanguage[activity.language]) {
      report.byLanguage[activity.language] = 0;
    }
    report.byLanguage[activity.language]++;
  });

  return report;
}

/**
 * Función principal
 */
function main() {
  console.log('\n🎓 Importador de Actividades Educativas (Demo)');
  console.log('='.repeat(60));

  const allActivities = [];
  let count = 0;

  // LearningApps
  console.log('\n📚 Procesando LearningApps.org...');
  const learningappsActivities = LEARNINGAPPS_DATA.map(a => enrichActivity(a, 'LearningApps'));
  count += saveActivities(learningappsActivities, 'activities-learningapps.json');
  allActivities.push(...learningappsActivities);

  // Didactalia
  console.log('\n📚 Procesando Didactalia...');
  const didataliaActivities = DIDACTALIA_DATA.map(a => enrichActivity(a, 'Didactalia'));
  count += saveActivities(didataliaActivities, 'activities-didactalia.json');
  allActivities.push(...didataliaActivities);

  // H5P
  console.log('\n📚 Procesando H5P...');
  const h5pActivities = H5P_DATA.map(a => enrichActivity(a, 'H5P'));
  count += saveActivities(h5pActivities, 'activities-h5p.json');
  allActivities.push(...h5pActivities);

  // Guardar combinado
  console.log('\n🔗 Combinando todas las actividades...');
  saveActivities(allActivities, 'combined-activities.json');

  // Generar reporte
  console.log('\n📊 Generando reporte...');
  const report = generateReport(allActivities);
  const reportPath = path.join(DATA_DIR, 'statistics.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`💾 Reporte guardado en ${reportPath}`);

  // Mostrar resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE IMPORTACIÓN');
  console.log('='.repeat(60));
  console.log(`✅ Total de actividades: ${allActivities.length}`);
  console.log('\nPor fuente:');
  Object.entries(report.bySource).forEach(([source, count]) => {
    console.log(`  • ${source}: ${count}`);
  });
  console.log('\nPor área educativa:');
  Object.entries(report.byArea).forEach(([area, count]) => {
    console.log(`  • ${area}: ${count}`);
  });

  console.log('\n📁 Archivos generados en data/');
  console.log('  • activities-learningapps.json');
  console.log('  • activities-didactalia.json');
  console.log('  • activities-h5p.json');
  console.log('  • combined-activities.json');
  console.log('  • statistics.json');

  console.log('\n✨ Importación completada.\n');
}

main();
