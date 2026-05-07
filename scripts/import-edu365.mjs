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
  { title: 'Easter', path: '/interactius/easter/index.html', img: 'easter-game.png', subject: 'cultural', level: 'infantil-primaria', language: ['Catalan/Valencià', 'Ingles'], notes: 'Tradicions de Pasqua en català i anglès' },
  { title: 'Lletres sobre rodes', path: '/interactius/lletres/index.html', img: 'lletresrodes_interactiu.png', subject: 'lengua', level: 'primaria', language: 'Catalan/Valencià', notes: 'Jocs de paraules amb temàtica de skate' },
];

const RAW_PROGRAMACIO = [
  { title: 'Explore Mars', url: 'https://spaceplace.nasa.gov/explore-mars/sp/', img: 'explore-mars-joc.png', subject: 'informatica', level: 'primaria', language: 'Castellano', notes: 'Navega la superfície de Mart amb un rover per recollir informació sobre roques marcians' },
  { title: 'MicroStudio', url: 'https://microstudio.dev/', img: 'microstudio.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Ingles', notes: 'Motor de videojocs en línia gratuït per crear, exportar i compartir jocs' },
  { title: 'MonoGame', url: 'https://monogame.net/', img: 'monogame.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Ingles', notes: 'Framework de codi obert per al desenvolupament de jocs 2D i 3D en C#' },
  { title: 'Unity', url: 'https://unity.com/es', img: 'unity.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Castellano', notes: 'Motor de desenvolupament de jocs per a experiències VR/AR i simulacions' },
  { title: 'GameMaker Studio', url: 'https://gamemaker.io/es', img: 'game-maker-studio.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Castellano', notes: 'Plataforma visual de creació de jocs 2D amb el llenguatge GML' },
  { title: 'Wokwi', url: 'https://wokwi.com/', img: 'wokwi.png', subject: 'informatica', level: 'primaria', language: 'Ingles', notes: 'Simulador d\'electrònica al navegador per a Arduino, ESP32 i Raspberry Pi' },
  { title: 'Rodo Codo', url: 'https://www.rodocodo.com/free-coding-game-for-kids/', img: 'rodocodo.png', subject: 'informatica', level: 'infantil-primaria', language: 'Ingles', notes: 'Joc de puzles interactiu que ensenya conceptes de programació a través del moviment' },
  { title: 'Grinch Game', url: 'https://www.grinchhourofcode.com/game.html', img: 'grinch-game.png', subject: 'informatica', level: 'infantil-primaria', language: 'Ingles', notes: 'Lliçó interactiva de programació amb temàtica nadalenca' },
  { title: 'Elevator Saga', url: 'https://play.elevatorsaga.com/', img: 'play-elevatorsaga.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Ingles', notes: 'Joc de programació on has d\'escriure codi en JavaScript per controlar ascensors' },
  { title: 'Super Coding Ball', url: 'https://www.supercodingball.com/home', img: 'super-coding-ball.png', subject: 'informatica', level: 'infantil-primaria', language: 'Ingles', notes: 'Joc interactiu per resoldre reptes de programació amb una pilota virtual' },
  { title: 'CSS Diner', url: 'https://flukeout.github.io/', img: 'css-diner.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Ingles', notes: 'Joc interactiu per aprendre i practicar CSS de manera divertida' },
  { title: 'Blockly Games', url: 'https://blockly.games/?lang=ca', img: 'blocklygames.png', subject: 'informatica', level: 'primaria', language: 'Catalan/Valencià', notes: 'Jocs de programació per blocs per a iniciació a la programació' },
  { title: 'Easy Game Maker', url: 'https://www.easygamemaker.com/', img: 'easy-game-maker.png', subject: 'informatica', level: 'primaria', language: 'Ingles', notes: 'Creació gratuïta de jocs 2D visuals sense necessitat de codi' },
  { title: 'Flexbox Froggy', url: 'https://flexboxfroggy.com/', img: 'flexboxfroggy.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Ingles', notes: 'Joc interactiu per aprendre les propietats CSS Flexbox' },
  { title: 'CodinGame', url: 'https://www.codingame.com/start/', img: 'codingame.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Ingles', notes: 'Plataforma competitiva per aprendre programació a través de reptes i jocs' },
  { title: '8bitworkshop', url: 'https://8bitworkshop.com/', img: '8bit-workshop.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Ingles', notes: 'Aprèn a programar jocs retro de 8 bits dels anys 80 i 90' },
  { title: 'Codédex', url: 'https://www.codedex.io/', img: 'codedex.png', subject: 'informatica', level: 'primaria', language: 'Ingles', notes: 'Aprenentatge gamificat amb cursos interactius de Python, HTML, CSS i JS' },
  { title: 'Godot', url: 'https://godotengine.org/', img: 'godot.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Ingles', notes: 'Motor gràfic de codi obert per al desenvolupament de videojocs multiplataforma' },
  { title: 'RPG Playground', url: 'https://rpgplayground.com/', img: 'rpg-playground.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Ingles', notes: 'Editor de jocs RPG amb capacitats de programació' },
  { title: 'GB Studio', url: 'https://www.gbstudio.dev/', img: 'gb-studio.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Ingles', notes: 'Editor per crear jocs a l\'estil de Game Boy' },
  { title: "NASA's Return to the Moon", url: 'https://www.tynker.com/hour-of-code/nasa-return-to-moon', img: 'nasa_return_moon.png', subject: 'informatica', level: 'infantil-primaria', language: 'Ingles', notes: 'Aventures de programació amb temàtica espacial de la NASA' },
  { title: 'Open Roberta', url: 'https://lab.open-roberta.org/', img: 'open_roberta.png', subject: 'informatica', level: 'primaria', language: 'Ingles', notes: 'Programa diferents robots i simula el seu comportament al navegador' },
  { title: 'Alice', url: 'http://www.alice.org/', img: 'alice_programacio.png', subject: 'informatica', level: 'primaria', language: 'Ingles', notes: 'Entorn de programació per crear animacions 3D i històries interactives' },
  { title: 'Sonic Pi', url: 'https://sonic-pi.net/', img: 'sonic-pi.png', subject: 'musica', level: 'primaria', language: 'Ingles', notes: 'Eina de creació i interpretació de música basada en codi' },
  { title: 'Micro:bit', url: 'https://makecode.microbit.org/', img: 'microbit.png', subject: 'informatica', level: 'primaria', language: 'Catalan/Valencià', notes: 'Simulador de programació per als dispositius BBC Micro:bit' },
  { title: 'Free Code Camp', url: 'https://www.freecodecamp.org/', img: 'free_code_camp.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Ingles', notes: 'Aprèn programació web amb projectes des de casa' },
  { title: 'MIT App Inventor', url: 'https://appinventor.mit.edu/', img: 'app_inventor.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Ingles', notes: 'Programa les teves aplicacions per a dispositius mòbils' },
  { title: 'Code Combat', url: 'https://codecombat.com/', img: 'code-combat.png', subject: 'informatica', level: 'primaria', language: 'Ingles', notes: 'Introducció a la programació i al disseny de jocs a través de reptes' },
  { title: 'Studio Code', url: 'https://studio.code.org/', img: 'code_studio_platform.png', subject: 'informatica', level: 'primaria', language: 'Catalan/Valencià', notes: 'Reptes de jocs per blocs que ensenyen els fonaments de la programació' },
  { title: 'Crunchzilla', url: 'https://www.crunchzilla.com/', img: 'crunchzilla2.png', subject: 'informatica', level: 'primaria', language: 'Ingles', notes: 'Tutorial interactiu per aprendre programació JavaScript' },
  { title: 'Phaser', url: 'https://phaser.io/', img: 'phaser_io.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Ingles', notes: 'Framework JavaScript per al desenvolupament ràpid de jocs HTML5' },
  { title: 'Swift Playgrounds', url: 'https://developer.apple.com/swift-playgrounds/', img: 'swift_playgrounds.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Ingles', notes: 'App d\'Apple per a iPad i Mac per aprendre Swift' },
  { title: 'Thunkable', url: 'https://thunkable.com/', img: 'thunkable.png', subject: 'informatica', level: 'primaria', language: 'Ingles', notes: 'Plataforma de disseny d\'aplicacions mòbils sense codi' },
  { title: 'ScratchJr', url: 'http://www.scratchjr.org/', img: 'scratch_junior.png', subject: 'informatica', level: 'infantil', language: 'Ingles', notes: 'App de programació per blocs per a nens petits per crear històries' },
  { title: 'Robocode', url: 'https://robocode.sourceforge.io/', img: 'robocode_java.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Ingles', notes: 'Joc de programació per aprendre Java desenvolupant robots de combat' },
  { title: 'Cody & Roby', url: 'https://code.intef.es/prop_didacticas/cody-roby/', img: 'cody_roby.png', subject: 'informatica', level: 'primaria', language: 'Castellano', notes: 'Jocs de programació desconnectada amb robots per a totes les edats' },
  { title: 'Botlogic', url: 'https://botlogic.us/', img: 'botlogic.png', subject: 'informatica', level: 'primaria', language: 'Ingles', notes: 'Resol problemes de lògica mentre aprens conceptes de programació' },
  { title: 'Gamefroot', url: 'https://make.gamefroot.com/', img: 'gamefroot.png', subject: 'informatica', level: 'primaria', language: 'Ingles', notes: 'Dissenya i programa el teu primer videojoc' },
  { title: 'Scratch', url: 'https://scratch.mit.edu/', img: 'scratch.png', subject: 'informatica', level: 'primaria', language: 'Catalan/Valencià', notes: 'Crea històries, jocs i animacions amb programació per blocs' },
  { title: 'Code Monkey', url: 'https://app.codemonkey.com/challenges/0', img: 'code_monkey_infantil.png', subject: 'informatica', level: 'infantil-primaria', language: 'Ingles', notes: 'Fonaments de programació a través de reptes amb personatges' },
  { title: 'GDevelop', url: 'https://gdevelop.io/', img: 'gdevelop_programacio2.png', subject: 'informatica', level: 'primaria-secundaria', language: 'Ingles', notes: 'Programari de codi obert i multiplataforma per dissenyar videojocs' },
  { title: 'Mimo', url: 'https://mimo.org/', img: 'mimo_programacio.png', subject: 'informatica', level: 'primaria', language: 'Ingles', notes: 'Aprenentatge interactiu d\'HTML5, CSS i JavaScript' },
  { title: 'Kodu Game Lab', url: 'https://www.kodugamelab.com/', img: 'kodu.png', subject: 'informatica', level: 'primaria', language: 'Ingles', notes: 'Entorn de desenvolupament de jocs 3D que ensenya fonaments de programació' },
  { title: 'Run Marco!', url: 'https://runmarco.allcancode.com/', img: 'runmarco.png', subject: 'informatica', level: 'infantil-primaria', language: 'Ingles', notes: 'Reptes de programació amb personatges per a joves aprenents' },
  { title: 'Makecode Arcade', url: 'https://arcade.makecode.com/', img: 'makecode_arcade.png', subject: 'informatica', level: 'primaria', language: 'Catalan/Valencià', notes: 'Creació de jocs d\'arcade per blocs amb introducció a JavaScript i Python' },
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

async function processEntries(entries, activities, stats) {
  for (const raw of entries) {
    const id = `edu365-${slugify(raw.title)}`;
    const imgFilename = `${id}.png`;
    const localImgPath = path.join(IMAGE_DIR, imgFilename);
    const relativeImgPath = `assets/game-images/${imgFilename}`;
    const sourceImgUrl = IMG_BASE + raw.img;
    const activityUrl = raw.url || (BASE_URL + raw.path);

    process.stdout.write(`  Descarregant imatge: ${raw.img} ... `);
    if (fs.existsSync(localImgPath)) {
      console.log('ja existeix');
      stats.skipped++;
    } else {
      const ok = await downloadImage(sourceImgUrl, localImgPath);
      if (ok) { console.log('OK'); stats.downloaded++; }
      else { console.log('ERROR'); stats.failed++; }
    }

    activities.push({
      id,
      title: raw.title,
      area: AREA_MAP[raw.subject] || 'Otros',
      language: raw.language,
      url: activityUrl,
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
}

async function main() {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });

  const outputFile = process.argv[2] || path.join(DATA_DIR, 'activities-edu365.json');
  const activities = [];
  const stats = { downloaded: 0, skipped: 0, failed: 0 };

  console.log('\n── Interactius ──');
  await processEntries(RAW_ACTIVITIES, activities, stats);
  console.log('\n── Programació ──');
  await processEntries(RAW_PROGRAMACIO, activities, stats);

  fs.writeFileSync(outputFile, JSON.stringify(activities, null, 2));
  console.log(`\n✅ ${activities.length} actividades guardades a ${outputFile}`);
  console.log(`   Imatges: ${stats.downloaded} descarregades, ${stats.skipped} ja existien, ${stats.failed} errors`);
}

main().catch(console.error);
