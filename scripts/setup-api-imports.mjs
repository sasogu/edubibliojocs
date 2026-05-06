#!/usr/bin/env node

/**
 * Script de Configuración y Ejecución de Importaciones
 * Ejecuta el pipeline completo de importación desde APIs
 * 
 * Uso:
 *   node scripts/setup-api-imports.mjs
 *   node scripts/setup-api-imports.mjs --extract-only
 *   node scripts/setup-api-imports.mjs --merge-only
 *   node scripts/setup-api-imports.mjs --report-only
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts');

// Asegurar que el directorio de datos existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const config = {
  // Configuración de extracción
  extraction: {
    sources: ['learningapps', 'didactalia', 'h5p'],
    outputDir: DATA_DIR,
    language: 'es',
    separateFiles: true, // Guardar cada fuente por separado
    combinedFile: 'imported-activities-combined.json'
  },

  // Configuración de procesamiento
  processing: {
    removeDuplicates: true,
    sortBy: 'source',
    generateReport: true,
    reportFormat: 'html' // 'html' o 'json'
  },

  // Configuración de análisis
  analysis: {
    showStats: true,
    exportStats: true
  }
};

/**
 * Ejecutar comando y mostrar output
 */
function run(command, description) {
  console.log(`\n📌 ${description}`);
  console.log(`   Ejecutando: ${command}\n`);

  try {
    const output = execSync(command, { stdio: 'inherit', cwd: PROJECT_ROOT });
    console.log(`✅ ${description} completado\n`);
    return true;
  } catch (error) {
    console.error(`❌ Error en ${description}`);
    console.error(error.message);
    return false;
  }
}

/**
 * Función principal
 */
function main() {
  const args = process.argv.slice(2);
  const extractOnly = args.includes('--extract-only');
  const mergeOnly = args.includes('--merge-only');
  const reportOnly = args.includes('--report-only');

  console.log('\n🎓 Pipeline de Importación de Actividades Educativas');
  console.log('='.repeat(60));
  console.log(`📁 Directorio de datos: ${DATA_DIR}`);
  console.log(`⚙️  Configuración:`);
  console.log(`   - Fuentes: ${config.extraction.sources.join(', ')}`);
  console.log(`   - Idioma: ${config.extraction.language}`);
  console.log(`   - Archivos separados: ${config.extraction.separateFiles}`);
  console.log(`   - Eliminar duplicados: ${config.processing.removeDuplicates}`);
  console.log(`   - Generar reporte: ${config.processing.generateReport}`);
  console.log('='.repeat(60));

  let success = true;
  const results = {
    extracted: 0,
    combined: 0,
    processed: 0,
    reportGenerated: false
  };

  // FASE 1: EXTRACCIÓN
  if (!mergeOnly && !reportOnly) {
    console.log('\n🔍 FASE 1: Extrayendo de APIs...');

    if (config.extraction.separateFiles) {
      // Extraer cada fuente por separado
      config.extraction.sources.forEach(source => {
        const outputFile = `activities-${source}.json`;
        const command = `node scripts/import-educational-apis.mjs ${source} data/${outputFile}`;
        success = run(command, `Extracción desde ${source}`) && success;
        if (success) results.extracted++;
      });
    } else {
      // Extraer todas juntas
      const command = `node scripts/import-educational-apis.mjs all data/${config.extraction.combinedFile}`;
      success = run(command, 'Extracción de todas las fuentes') && success;
      if (success) results.extracted = 1;
    }
  }

  // FASE 2: PROCESAMIENTO
  if (!extractOnly && !reportOnly && config.extraction.separateFiles) {
    console.log('\n⚙️  FASE 2: Combinando y procesando...');

    // Combinar archivos
    const sourceFiles = config.extraction.sources
      .map(s => `data/activities-${s}.json`)
      .join(' ');

    const mergeCmd = `node scripts/import-activities-manager.mjs merge ${sourceFiles}`;
    success = run(mergeCmd, 'Combinando actividades') && success;
    if (success) results.combined++;

    // Eliminar duplicados si está configurado
    if (config.processing.removeDuplicates) {
      const uniqueCmd = `node scripts/import-activities-manager.mjs unique data/combined-activities.json`;
      success = run(uniqueCmd, 'Eliminando duplicados') && success;
      if (success) results.processed++;
    }
  }

  // FASE 3: ANÁLISIS Y REPORTES
  if (!extractOnly && !mergeOnly) {
    console.log('\n📊 FASE 3: Generando análisis y reportes...');

    // Estadísticas
    if (config.analysis.showStats) {
      let files = [];
      if (config.extraction.separateFiles && !reportOnly) {
        files = config.extraction.sources
          .map(s => `data/activities-${s}.json`)
          .filter(f => fs.existsSync(path.join(PROJECT_ROOT, f)));
      } else if (fs.existsSync(path.join(DATA_DIR, 'combined-activities.json'))) {
        files = ['data/combined-activities.json'];
      } else if (fs.existsSync(path.join(DATA_DIR, config.extraction.combinedFile))) {
        files = [`data/${config.extraction.combinedFile}`];
      }

      if (files.length > 0) {
        const statsCmd = `node scripts/import-activities-manager.mjs stats ${files.join(' ')}`;
        success = run(statsCmd, 'Generando estadísticas') && success;
      }
    }

    // Reporte HTML
    if (config.processing.generateReport) {
      let files = [];
      if (config.extraction.separateFiles) {
        files = config.extraction.sources
          .map(s => `data/activities-${s}.json`)
          .filter(f => fs.existsSync(path.join(PROJECT_ROOT, f)));
      } else if (fs.existsSync(path.join(DATA_DIR, 'combined-activities.json'))) {
        files = ['data/combined-activities.json'];
      } else if (fs.existsSync(path.join(DATA_DIR, config.extraction.combinedFile))) {
        files = [`data/${config.extraction.combinedFile}`];
      }

      if (files.length > 0) {
        const reportCmd = `node scripts/import-activities-manager.mjs report ${files.join(' ')}`;
        success = run(reportCmd, 'Generando reporte HTML') && success;
        if (success) results.reportGenerated = true;
      }
    }
  }

  // RESUMEN FINAL
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMEN DE EJECUCIÓN');
  console.log('='.repeat(60));
  console.log(`✅ Fuentes extraídas: ${results.extracted}`);
  console.log(`✅ Archivos combinados: ${results.combined}`);
  console.log(`✅ Archivos procesados: ${results.processed}`);
  console.log(`✅ Reporte generado: ${results.reportGenerated ? 'Sí' : 'No'}`);

  console.log('\n📁 Archivos generados:');
  const files = fs.readdirSync(DATA_DIR);
  files
    .filter(f => f.includes('activities') || f.includes('statistics') || f.includes('report'))
    .forEach(f => {
      const filepath = path.join(DATA_DIR, f);
      const stats = fs.statSync(filepath);
      const size = (stats.size / 1024).toFixed(2);
      console.log(`   • ${f} (${size} KB)`);
    });

  console.log('\n🎓 Próximos pasos:');
  console.log('   1. Revisa los archivos generados en data/');
  console.log('   2. Abre data/activities-report.html en el navegador');
  console.log('   3. Integra los datos en tu aplicación');
  console.log('   4. Personaliza la extracción según necesites');

  console.log('\n✨ Pipeline completado.\n');

  if (!success) {
    process.exit(1);
  }
}

main();
