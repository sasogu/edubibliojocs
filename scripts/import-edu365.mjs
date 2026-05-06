#!/usr/bin/env node

/**
 * Importador de actividades interactivas de edu365.cat
 * Uso: node scripts/import-edu365.mjs [output-file]
 * Por defecto guarda en data/activities-edu365.json
 */

import fs from 'fs';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { pipeline } from 'stream/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const IMAGE_DIR = path.join(__dirname, '..', 'assets', 'game-images');

const BASE_URL = 'https://www.edu365.cat';
const IMG_BASE = 'https://www.edu365.cat/img/product/';
const SOURCE_COLOR = '#00529B';

const RAW_ACTIVITIES = [
  { title: 'Sant Jordi 2026', path: '/interactius/sant-jordi-2026/intro/index.html', img: 'sant-jordi-2026-interactiu.png', subject: 'cultural', level: 'primaria', language: 'Catalan/Valencià', notes: 'Jocs i sorpreses per celebrar el Sant Jordi' },
  { title: 'Houston, tenim problemes!', path: '/interactius/houston/intro/index.html', img: 'houston-problemes-interactiu.png', subject: 'matematicas', level: 'primaria', language: 'Catalan/Valencià', notes: "Una abella recorre un prat resolent reptes matemàtics" },
  { title: 'Anem a mitges!', path: '/interactius/anem-mitges/intro/index.html', img: 'anem-mitges-interactiu.png', subject: 'matematicas', level: 'primaria', language: 'Catalan/Valencià', notes: 'Descobreix les fraccions dividint fruites en parts iguals' },
  { title: 'Agent Antifaltes 2', path: '/interactius/agent2/intro/index.html', img: 'antifaltes-2.png', subject: 'lengua', level: 'primaria', language: 'Catalan/Valencià', notes: "Aventura de detectiu d'ortografia. Segon episodi" },
  { title: 'Jam Session', path: '/interactius/jam_session/intro/index.html', img: 'jam_session-520.png', subject: 'musica', level: 'primaria', language: 'Catalan/Valencià', notes: 'Juga i identifica instruments musicals' },
  { title: 'Pensem', path: '/interactius/pensem/intro/index.html', img: 'pensem-nou.png', subject: 'logica', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Completa sèries i seqüències de patrons' },
  { title: 'Pensam', path: '/interactius/pensem-aranes/index.html', img: 'pensam.png', subject: 'logica', level: 'infantil-primaria', language: 'Aranes', notes: 'Completa sèries i patrons en aranès' },
  { title: 'Agent Antifaltes', path: '/interactius/agent/index.html', img: 'antifaltes.png', subject: 'lengua', level: 'primaria-secundaria', language: 'Catalan/Valencià', notes: "Converteix-te en detectiu de l'ortografia" },
  { title: 'La Bibliotecapp', path: '/interactius/bibliotecapp/index.html', img: 'bibliotecapp_interactiu.png', subject: 'lengua', level: 'primaria-secundaria', language: 'Catalan/Valencià', notes: 'Descobreix aventures literàries amb vuit opcions diferents' },
  { title: 'Què fem primer?', path: '/interactius/sequenciacio/index.html', img: 'femprimer_interactiu.png', subject: 'logica', level: 'infantil', language: 'Catalan/Valencià', notes: 'Ordena imatges en la seqüència correcta' },
  { title: "Qué hèm prumèr?", path: '/interactius/sequenciacio-aranes/index.html', img: 'que-hem-prumer.png', subject: 'logica', level: 'infantil', language: 'Aranes', notes: 'Ordena imatges en la seqüència correcta en aranès' },
  { title: 'Escape Cub', path: '/interactius/escapecub/index.html', img: 'escapecub-520.png', subject: 'diversas', level: 'primaria-secundaria', language: 'Catalan/Valencià', notes: 'Respon preguntes de colors i navega per la ruta de fugida' },
  { title: 'Electricitat i magnetisme', path: '/interactius/electricitat/index.html', img: 'electricitat_interactiu.png', subject: 'ciencias', level: 'secundaria', language: 'Catalan/Valencià', notes: "Explora els efectes de l'electricitat i el magnetisme" },
  { title: 'Coneixement del cos', path: '/interactius/coneixementcos/index.html', img: 'coneixement-cos-520.png', subject: 'ciencias', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Aprèn sobre higiene, nutrició i benestar' },
  { title: 'Animalarium', path: '/interactius/animalarium/index.html', img: 'animalarium_interactiu.png', subject: 'ciencias', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: "Explora animals domèstics, exòtics i salvatges" },
  { title: 'No et descomptis 3', path: '/interactius/euro3/index.html', img: 'no_descomptis3.png', subject: 'matematicas', level: 'primaria', language: 'Catalan/Valencià', notes: 'Càlcul mental amb monedes i bitllets' },
  { title: 'Viatgers del temps', path: '/interactius/pitagores/intro/index.html', img: 'viatgers-del-temps.png', subject: 'matematicas', level: 'primaria', language: 'Catalan/Valencià', notes: 'Viatgers en el temps exploren el teorema de Pitàgores' },
  { title: 'El cos', path: '/interactius/cos/index.html', img: 'cos-interactiu.png', subject: 'ciencias', level: 'infantil', language: 'Catalan/Valencià', notes: 'Aprèn els noms de les parts del cos en català' },
  { title: 'Eth còs', path: '/interactius/cos-aranes/index.html', img: 'eth-cos.png', subject: 'ciencias', level: 'infantil', language: 'Aranes', notes: "Noms de les parts del cos en aranès" },
  { title: 'Els sentits', path: '/interactius/sentits/index.html', img: 'els-sentits.png', subject: 'ciencias', level: 'infantil', language: 'Catalan/Valencià', notes: 'Descobreix els cinc sentits humans jugant' },
  { title: 'Es sensi', path: '/interactius/sentits-aranes/index.html', img: 'es-sensi.png', subject: 'ciencias', level: 'infantil', language: 'Aranes', notes: 'Els cinc sentits en aranès' },
  { title: "Sumem de l'1 al 10", path: '/interactius/sumar/index.html', img: 'sumem.png', subject: 'matematicas', level: 'infantil', language: 'Catalan/Valencià', notes: "Practica la suma de l'1 al 10" },
  { title: 'No et descomptis 2', path: '/interactius/euro2/index.html', img: 'no_descomptis2.png', subject: 'matematicas', level: 'infantil', language: 'Catalan/Valencià', notes: "Suma i iniciació a la moneda" },
  { title: 'Castaween', path: '/interactius/castaween/intro/index.html', img: 'castaween-25.png', subject: 'cultural', level: 'primaria', language: 'Catalan/Valencià', notes: 'Jocs bilingües per a la Castanyada i Halloween' },
  { title: 'Jocs de tardor', path: '/interactius/jocsdetardor/index.html', img: 'jocstardor_interactiu.png', subject: 'cultural', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Jocs i activitats de la festa de tardor' },
  { title: 'Tardor 2023', path: '/interactius/tardor-2023/intro/index.html', img: 'tardor_interactiu.png', subject: 'cultural', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Celebració de tardor amb jocs tradicionals' },
  { title: 'La Castanyada', path: '/interactius/castanyada/index.html', img: 'castanyada_interactiu.png', subject: 'cultural', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Jocs i activitats de la Castanyada' },
  { title: 'Castanyes i carbasses', path: '/interactius/carbasses/intro/index.html', img: 'castanyes_carbasses_800x520.png', subject: 'cultural', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Tradicions de tardor a través de jocs interactius' },
  { title: 'La màgia de Nadal', path: '/interactius/nadal25/intro/index.html', img: 'magia-nadal-interactiu.png', subject: 'cultural', level: 'primaria', language: 'Catalan/Valencià', notes: 'Celebració de Nadal amb activitats interactives' },
  { title: 'Escudella de jocs', path: '/interactius/escudella/intro/index.html', img: 'escudella-de-jocs-800x520.png', subject: 'cultural', level: 'primaria', language: 'Catalan/Valencià', notes: 'Jocs i tradicions de Nadal' },
  { title: 'Nadal 2023', path: '/interactius/nadal23/intro/index.html', img: 'nadal2023_interactiu.png', subject: 'cultural', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Activitats i jocs interactius de Nadal' },
  { title: "Jocs d'hivern", path: '/interactius/hivern/index.html', img: 'jocshivern_interactiu.png', subject: 'cultural', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Memòria, tradicions, pessebre i decoració de Nadal' },
  { title: 'Nadal', path: '/interactius/nadal/index.html', img: 'nadal_interactiu.png', subject: 'cultural', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Endevinalles, cançons i tradicions nadalenques' },
  { title: 'Els carnavals del món', path: '/interactius/carnavals-mon/intro/index.html', img: 'carnavals-mon-800.png', subject: 'cultural', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Tradicions de carnaval arreu del món' },
  { title: 'Carnaval 2025', path: '/interactius/carnaval-2025/intro/index.html', img: 'carnaval-25_interactiu.png', subject: 'cultural', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Endevina sons i completa sèries de Carnaval' },
  { title: "Disfressa't", path: '/interactius/disfressat/intro/index.html', img: 'disfressat_interactiu.png', subject: 'cultural', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Activitats de Carnaval: observació i atenció' },
  { title: 'Carnaval 2023', path: '/interactius/carnaval2023/intro/index.html', img: 'caranval2023_interactiu.png', subject: 'cultural', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Descobreix tradicions i personatges del Carnaval' },
  { title: 'Carnaval', path: '/interactius/carnaval/intro/index.html', img: 'carnaval_interactiu.png', subject: 'cultural', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Jocs i tradicions festives de Carnaval' },
  { title: 'Castells i cavallers', path: '/interactius/sant-jordi-2025/intro/index.html', img: 'sant-jordi-2025.png', subject: 'cultural', level: 'primaria', language: 'Catalan/Valencià', notes: 'Prepara el Sant Jordi amb reptes interactius' },
  { title: 'Sant Jordi 2024', path: '/interactius/sant-jordi-2024/intro/index.html', img: 'st-jordi-24_800.png', subject: 'cultural', level: 'primaria', language: 'Catalan/Valencià', notes: 'Dragons, llibres, roses i elements literaris' },
  { title: 'Sant Jordi 2023', path: '/interactius/sant-jordi-2023/intro/index.html', img: 'santjordi2023_interactiu.png', subject: 'cultural', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Personatges de la llegenda i reptes interactius' },
  { title: 'Sant Jordi', path: '/interactius/santjordi/index.html', img: 'santjordi_interactiu.png', subject: 'cultural', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Prepara la celebració del 23 abril amb jocs' },
  { title: 'Les fruites', path: '/interactius/fruites/index.html', img: 'fruites_interactiu.png', subject: 'lengua', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Lectura i activitats amb fruites en català' },
  { title: 'Las frutas', path: '/interactius/frutas/index.html', img: 'frutas_interactiu.png', subject: 'lengua', level: 'infantil-primaria', language: 'Castellano', notes: 'Vocabulario de frutas en castellano' },
  { title: 'Mateorit', path: '/interactius/MATeorit/index.html', img: 'mateorit_interactiu.png', subject: 'matematicas', level: 'primaria', language: 'Catalan/Valencià', notes: "Evita l'impacte del meteorit resolent sumes" },
  { title: 'Mateorit 2', path: '/interactius/MATeorit2/index.html', img: 'mateorit2_interactiu.png', subject: 'matematicas', level: 'primaria', language: 'Catalan/Valencià', notes: 'Aventura espacial avançada amb reptes matemàtics' },
  { title: "Enlaira't", path: '/interactius/sistema_solar/index.html', img: 'enlairat_interactiu.png', subject: 'ciencias', level: 'primaria', language: 'Catalan/Valencià', notes: "Capes de l'atmosfera i sistema solar" },
  { title: 'Take off', path: '/interactius/take_off/index.html', img: 'takeoff_interactiu.png', subject: 'ciencias', level: 'primaria', language: 'Ingles', notes: 'Atmosphere and solar system in English' },
  { title: 'No et descomptis!', path: '/interactius/euros/index.html', img: 'descomptis_interactiu.png', subject: 'matematicas', level: 'primaria', language: 'Catalan/Valencià', notes: 'Càlcul mental amb monedes i operacions' },
  { title: 'Take your time', path: '/interactius/time/index.html', img: 'taketime_interactiu.png', subject: 'ingles', level: 'primaria', language: 'Ingles', notes: 'Learn to tell the time correctly in English' },
  { title: 'Pren-te el teu temps', path: '/interactius/temps/index.html', img: 'prentemps_interactiu-800.png', subject: 'lengua', level: 'primaria', language: 'Catalan/Valencià', notes: "Aprèn a llegir l'hora correctament en català" },
  { title: 'Continents i oceans', path: '/interactius/continents/index.html', img: 'continents_interactiu.png', subject: 'sociales', level: 'primaria', language: 'Catalan/Valencià', notes: 'Localitza continents i oceans al mapa del món' },
  { title: 'Continents and oceans', path: '/interactius/continents-english/index.html', img: 'continents_eng_interactiu.png', subject: 'sociales', level: 'primaria', language: 'Ingles', notes: 'Continents and oceans with English vocabulary' },
  { title: 'Es colors', path: '/interactius/color-aranes/index.html', img: 'escolors_interacitu.png', subject: 'lengua', level: 'infantil', language: 'Aranes', notes: 'Noms dels colors en aranès' },
  { title: 'The colors', path: '/interactius/color/index.html', img: 'thecolors_interactiu.png', subject: 'ingles', level: 'infantil', language: 'Ingles', notes: 'Learn English color vocabulary through play' },
  { title: 'Ciber-Odissea', path: '/interactius/ciberodissea/index.html', img: 'ciberodissea_interactiu.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Catalan/Valencià', notes: 'Tecnologia digital, internet i xarxes socials' },
  { title: 'Paraules estranyes', path: '/interactius/paraules-estranyes/index.html', img: 'estranyes_interactiu.png', subject: 'lengua', level: 'primaria', language: 'Catalan/Valencià', notes: 'Explora paraules estranyes i misteris lèxics' },
  { title: 'Atrapa el residu', path: '/interactius/reciclatge/index.html', img: 'atrapa_interactiu.png', subject: 'ciencias', level: 'primaria', language: 'Catalan/Valencià', notes: 'Aprèn a classificar residus correctament' },
  { title: 'Easter', path: '/interactius/easter/index.html', img: 'easter-game.png', subject: 'cultural', level: 'infantil-primaria', language: 'Catalan/Valencià', notes: 'Tradicions de Pasqua en català i anglès' },
  { title: 'Lletres sobre rodes', path: '/interactius/lletres/index.html', img: 'lletresrodes_interactiu.png', subject: 'lengua', level: 'primaria', language: 'Catalan/Valencià', notes: 'Jocs de paraules amb temàtica de skate' },
];

const AREA_MAP = {
  matematicas: 'Matematicas',
  lengua: 'Lengua',
  ciencias: 'Ciencias Naturales',
  musica: 'Musica',
  sociales: 'Ciencias Sociales',
  cultural: 'Dias especiales',
  logica: 'Logica',
  informatica: 'Informatica',
  ingles: 'Ingles',
  diversas: 'Diversas áreas',
};

const LEVEL_MAP = {
  infantil: ['Infantil'],
  primaria: ['Primaria'],
  secundaria: ['Primaria 3er ciclo', 'Secundaria'],
  'infantil-primaria': ['Infantil', 'Primaria'],
  'primaria-secundaria': ['Primaria', 'Primaria 3er ciclo'],
};

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function downloadImage(srcUrl, destPath) {
  if (fs.existsSync(destPath)) return true;
  try {
    const res = await fetch(srcUrl);
    if (!res.ok) return false;
    await pipeline(res.body, createWriteStream(destPath));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });

  const outputFile = process.argv[2] || path.join(DATA_DIR, 'activities-edu365.json');
  const activities = [];
  let downloaded = 0, skipped = 0, failed = 0;

  for (const raw of RAW_ACTIVITIES) {
    const id = `edu365-${slugify(raw.title)}`;
    const imgFilename = `${id}.png`;
    const localImgPath = path.join(IMAGE_DIR, imgFilename);
    const relativeImgPath = `assets/game-images/${imgFilename}`;
    const sourceImgUrl = IMG_BASE + raw.img;

    process.stdout.write(`  Descarregant imatge: ${raw.img} ... `);
    if (fs.existsSync(localImgPath)) {
      console.log('ja existeix');
      skipped++;
    } else {
      const ok = await downloadImage(sourceImgUrl, localImgPath);
      if (ok) { console.log('OK'); downloaded++; }
      else { console.log('ERROR'); failed++; }
    }

    activities.push({
      id,
      title: raw.title,
      area: AREA_MAP[raw.subject] || 'Otros',
      language: raw.language,
      url: BASE_URL + raw.path,
      notes: raw.notes,
      levels: LEVEL_MAP[raw.level] || ['Primaria'],
      image: fs.existsSync(localImgPath) ? relativeImgPath : '',
      imageSource: sourceImgUrl,
      source: 'edu365',
      sourceColor: SOURCE_COLOR,
      sourceUrl: BASE_URL,
      fetchedAt: new Date().toISOString(),
    });
  }

  fs.writeFileSync(outputFile, JSON.stringify(activities, null, 2));
  console.log(`\n✅ ${activities.length} actividades guardades a ${outputFile}`);
  console.log(`   Imatges: ${downloaded} descarregades, ${skipped} ja existien, ${failed} errors`);
}

main().catch(console.error);
