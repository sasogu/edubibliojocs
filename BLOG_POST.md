# Bibliojocs: un directori de jocs educatius per a Infantil, Primària i Secundària

Bibliojocs és una aplicació web gratuïta que reuneix més de **3.000 activitats educatives** seleccionades per a Infantil, Primària i Secundària. L'objectiu és senzill: que el docent o la família trobi l'activitat perfecta en el menor temps possible, sense registres obligatoris ni distraccions.

---

## Cercar i filtrar sense complicacions

La pantalla principal mostra una graella de jocs amb carregament progressiu. Per trobar el que necessites hi ha cinc filtres combinables:

- **Cerca lliure** per títol, àrea o descripció
- **Etapa educativa**: Infantil, Primària (1r, 2n i 3r cicle) i Secundària
- **Matèria**: 22 àrees curriculars, des de Matemàtiques fins a Educació Emocional
- **Idioma**: Castellà, Català/Valencià, Anglès, Francès i Aranès
- **Valoració mínima**: filtra per estreles per veure els millors valorats

Cada targeta mostra la imatge del joc, el títol, les etiquetes d'etapa i matèria, una breu descripció i l'estat de l'enllaç. Si el recurs és un arxiu Flash antic, un reproductor integrat basat en **Ruffle** permet jugar-hi directament al navegador sense instal·lar res.

---

## Dues interfícies: castellà i català

Tota la interfície, etiquetes, missatges i filtres estan disponibles en **castellà i català**. El canvi d'idioma és instantani i no recarrega la pàgina.

---

## Comptes d'usuari amb Google (opcional)

Bibliojocs funciona perfectament sense registre, però si inicies sessió amb Google desbloqueja funcions addicionals que es sincronitzen entre dispositius:

### Favorits
Marca qualsevol joc amb ❤ per guardar-lo. Activa el filtre **"Sols els meus favorits"** per accedir-hi ràpidament. Els favorits es mantenen al núvol i els trobaràs des de qualsevol dispositiu.

### Valoracions
Puntua els jocs d'1 a 5 ★. La teva valoració s'afegeix a les de la resta d'usuaris i la mitjana apareix visible a cada targeta, ajudant tothom a triar els recursos de major qualitat.

### Proposar activitats
¿Coneixes un joc educatiu que no hi és? El botó **"Proposar activitat"** obre un formulari per enviar el nom, l'URL, la descripció, l'àrea i l'idioma. La proposta queda pendent de revisió i apareix marcada com a "Nova" mentre s'avalua.

### Reportar que no funciona
Cada targeta mostra un botó ⚠ per avisar que un recurs ha deixat de funcionar. Si tres usuaris el reporten, l'activitat desapareix automàticament de la llista fins que sigui revisada. Ningú pot reportar la mateixa activitat dues vegades i, en clicar, es mostra un missatge de confirmació.

---

## Eines d'administrador

L'administrador del lloc té accés a dos filtres addicionals invisibles per a la resta d'usuaris:

- **"No funciona (admin)"**: mostra totes les activitats amagades, ja sigui per acumulació de tres reportes d'usuaris o per haver-les marcat l'administrador directament. Una marca de l'admin amaga l'activitat immediatament per a tothom, sense esperar el llindar.
- **"Reportades (admin)"**: mostra les activitats amb un o dos reportes d'usuaris que de moment no arriben al llindar, però que convé vigilar.

Gràcies a aquests filtres, l'administrador pot revisar, validar i eliminar recursos de baixa qualitat sense interrupcions per als usuaris normals.

---

## Fonts del catàleg

El catàleg de Bibliojocs s'alimenta de diverses fonts:

- **Selecció pròpia**: activitats triades manualment per l'equip editorial per la seva qualitat pedagògica.
- **[Archive.org](https://archive.org)**: jocs educatius Flash clàssics preservats digitalment, reproduïbles directament al navegador gràcies a Ruffle.
- **Vibe Coding Educativo**: aplicacions creades per docents amb IA (vegeu apartat següent).

---

## Aplicacions creades per docents amb IA

Bibliojocs incorpora ara el catàleg de **[Vibe Coding Educativo](https://vibe-coding-educativo.github.io/app_edu/)**, una comunitat de docents que creen aplicacions educatives amb eines d'IA com Gemini, Claude i ChatGPT. S'hi han afegit **94 activitats** distribuïdes per matèries:

- **Matemàtiques** (31): derivades, funcions, probabilitat, estadística, sistemes d'equacions
- **Ciències Naturals** (15): biologia, química, física i simuladors de laboratori
- **General / Eines docents** (20): tutors IA, temporitzadors, generadors de grups
- **Tecnologia** (8): programació, robòtica, IA i eines digitals
- **Llengua** (7): mecanografia, anàlisi textual, núvols de paraules
- **Lògica** (6): escacs, Sudoku, puzzles, memòria visual
- **Ciències Socials** (3): ODS, cooperatives, escape room patrimonial
- **Música** (3): escales, acords, anàlisi musical

---

## Qualitat dels enllaços verificada automàticament

Un script analitza periòdicament tots els URL del catàleg i genera un informe amb l'estat HTTP de cada recurs. La interfície reflecteix aquest estat directament a cada targeta: **OK**, **Avís** o **Incidència**. Quan hi ha errors, una franja informativa a la part superior de la pàgina resumeix l'estat general del catàleg.

---

## Funciona sense connexió (PWA)

Bibliojocs inclou un **Service Worker** que emmagatzema en caché els recursos estàtics. Un cop carregada la primera vegada, la interfície funciona sense connexió a Internet, tot i que els jocs externs, evidentment, necessiten connexió per obrir-se.

---

## Dades del catàleg

| | |
|---|---|
| Total d'activitats | 3.004 |
| Activitats amb imatge | 2.876 |
| Etapes educatives | Infantil, Primària (3 cicles), Secundària |
| Àrees curriculars | 22 |
| Idiomes | 5 (castellà, català/valencià, anglès, francès, aranès) |
| Activitats Flash (Ruffle) | 3 |

---

## Tecnologia

L'aplicació és un lloc **completament estàtic** (HTML, CSS i JavaScript pur, sense frameworks) desplegat per SSH. La sincronització en el núvol utilitza **Firebase Authentication** (Google) i **Firestore** per emmagatzemar favorits, valoracions i reportes. Tota la lògica d'autenticació és opcional i es carrega de manera diferida, de manera que l'aplicació és igualment ràpida per als visitants sense compte.

---

Bibliojocs és una eina pensada per a docents, famílies i qualsevol persona que busqui recursos digitals educatius de qualitat. Accedeix-hi, filtra, juga i, si t'hi registres, contribueix a millorar el catàleg per a tothom.
