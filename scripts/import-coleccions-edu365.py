#!/usr/bin/env python3
"""Import activities from edu365.cat/coleccions.html sub-pages."""
import json
import re
import sys
from datetime import datetime

BASE_URL = "https://www.edu365.cat"
FETCH_DATE = "2026-05-07T00:00:00.000Z"
SOURCE_COLOR = "#00529B"
LANG = "Català/Valencià"

def slug(text):
    s = text.lower()
    for f, t in [('à','a'),('á','a'),('â','a'),('ä','a'),('å','a'),('æ','ae'),
                 ('è','e'),('é','e'),('ê','e'),('ë','e'),('ì','i'),('í','i'),
                 ('î','i'),('ï','i'),('ò','o'),('ó','o'),('ô','o'),('ö','o'),
                 ('ù','u'),('ú','u'),('û','u'),('ü','u'),('ñ','n'),('ç','c'),
                 ('·',''),("'",''),('!',''),('?',''),('.',''),(',','')]:
        s = s.replace(f, t)
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'\s+', '-', s.strip())
    s = re.sub(r'-+', '-', s)
    return f"edu365-{s[:55]}"

def act(title, url, notes, area, levels, source_page):
    if not url.startswith('http'):
        url = f"{BASE_URL}/{url}"
    return {
        "id": slug(title),
        "title": title,
        "area": area,
        "language": LANG,
        "url": url,
        "notes": notes,
        "levels": levels,
        "source": "edu365",
        "sourceColor": SOURCE_COLOR,
        "sourceUrl": f"{BASE_URL}/{source_page}",
        "fetchedAt": FETCH_DATE,
    }

new_activities = []

# ── open-source.html ───────────────────────────────────────────────────────
PAGE = "open-source.html"
new_activities += [
    act("Linux Mint","https://linuxmint.com/","Sistema operatiu lliure i de codi obert basat en Ubuntu","Tecnología",["Secundaria"],PAGE),
    act("LibreOffice","https://www.libreoffice.org/","Suite ofimàtica gratuïta compatible amb Microsoft Office","Tecnología",["Primaria","Secundaria"],PAGE),
    act("MicroStudio","https://microstudio.dev/","Motor de videojocs en línia per crear i compartir","Informatica",["Secundaria"],PAGE),
    act("Godot","https://godotengine.org/","Motor gràfic de desenvolupament de videojocs, multiplataforma i gratuït","Informatica",["Secundaria"],PAGE),
    act("LibreCAD","https://librecad.org/","Aplicació CAD de codi obert per disseny 2D","Tecnología",["Secundaria"],PAGE),
    act("Krita","https://krita.org/es/","Programari de pintura digital professional, lliure","Artes",["Secundaria"],PAGE),
    act("Avidemux","https://avidemux.sourceforge.net/","Editor de vídeo per tall, filtrat i codificació","Artes",["Secundaria"],PAGE),
    act("Linkat GNU Linux","http://linkat.xtec.cat/portal/index.php","Distribució educativa del Departament d'Educació","Tecnología",["Secundaria"],PAGE),
    act("Retrobat","https://www.retrobat.org/accueil-es/","Emulador de consoles antigues","Tecnología",["Secundaria"],PAGE),
    act("OpenToonz","https://opentoonz.github.io/es/index.html","Programari de codi obert per a la producció de dibuixos animats en 2D","Artes",["Secundaria"],PAGE),
    act("Audacity","https://www.audacityteam.org","Programari per editar i enregistrar àudio","Musica",["Secundaria"],PAGE),
    act("OpenShot","https://www.openshot.org/","Editor de vídeo amb funcionalitats avançades","Artes",["Secundaria"],PAGE),
    act("OpenSCAD","http://www.openscad.org/","Programari per crear objectes CAD 3D sòlids","Tecnología",["Secundaria"],PAGE),
    act("Ardour","https://ardour.org/","Programari d'àudio digital de codi obert per gravar, editar i mesclar","Musica",["Secundaria"],PAGE),
    act("Natron","https://natrongithub.github.io/","Edició de vídeo avançada i postproducció digital","Artes",["Secundaria"],PAGE),
    act("GIMP","https://www.gimp.org/","Editor d'imatges multiplataforma de codi obert","Artes",["Secundaria"],PAGE),
    act("Batocera","https://batocera.org/","Distribució de Linux per emular consoles de videojoc antigues","Tecnología",["Secundaria"],PAGE),
    act("Inkscape","https://inkscape.org/","Editor professional de gràfics vectorials de codi obert","Artes",["Secundaria"],PAGE),
    act("Shotcut","https://shotcut.org/","Editor de vídeo gratuït, de codi obert i multiplataforma","Artes",["Secundaria"],PAGE),
    act("Audiomass","https://audiomass.co/","Editor d'àudio en línia sense instal·lació","Musica",["Primaria","Secundaria"],PAGE),
    act("OBS Studio","https://obsproject.com/","Programari de codi obert per emetre en streaming","Tecnología",["Secundaria"],PAGE),
    act("Blender","https://www.blender.org/","Programari de creació 3D gratuït i de codi obert","Artes",["Secundaria"],PAGE),
    act("Sweet Home 3D","https://www.sweethome3d.com/es/","Disseny de plànols en 2D i visualització en 3D","Tecnología",["Secundaria"],PAGE),
    act("FreeCAD","https://www.freecad.org/","Programari de modelatge 3D paramètric","Tecnología",["Secundaria"],PAGE),
    act("Guitarix","https://guitarix.org/","Amplificador virtual de guitarra per a Linux","Musica",["Secundaria"],PAGE),
    act("LeoCAD","https://www.leocad.org/","Disseny de figures amb peces de construcció","Tecnología",["Primaria","Secundaria"],PAGE),
    act("Helm","https://tytel.org/helm/","Sintetitzador virtual de codi obert","Musica",["Secundaria"],PAGE),
    act("MuseScore Studio","https://musescore.org/ca","Programari professional de notació musical, totalment gratuït","Musica",["Secundaria"],PAGE),
    act("LenMus Phonascus","http://www.lenmus.org/en/noticias","Programa per estudiar teoria musical","Musica",["Secundaria"],PAGE),
    act("Sonic Pi","https://sonic-pi.net/","Eina de creació i interpretació de música basada en codi","Musica",["Secundaria"],PAGE),
    act("Raspberry Pi OS","https://www.raspberrypi.com/software/","Sistema operatiu per al vostre ordinador Raspberry Pi","Tecnología",["Secundaria"],PAGE),
    act("Piano Booster","https://www.pianobooster.org/index.html","Programari de codi obert que reprodueix fitxers MIDI per aprendre piano","Musica",["Primaria","Secundaria"],PAGE),
    act("Ubuntu","https://ubuntu.com/","Sistema operatiu gratuït i de codi obert basat en Linux","Tecnología",["Secundaria"],PAGE),
    act("UltiMaker Cura","https://ultimaker.com/software/ultimaker-cura/","Programari per gestionar impressions 3D","Tecnología",["Secundaria"],PAGE),
    act("Elementary OS","https://elementary.io/ca/","Sistema operatiu alternatiu per a Windows i macOS","Tecnología",["Secundaria"],PAGE),
    act("Fedora","https://fedoraproject.org/ca/","Sistema operatiu basat en GNU/Linux 100% lliure","Tecnología",["Secundaria"],PAGE),
    act("Retro Virtual Machine","https://www.retrovirtualmachine.org/","Emulador de màquines de 8 bits","Tecnología",["Secundaria"],PAGE),
    act("Mixxx","https://mixxx.org/","Programari de codi obert per fer de DJ","Musica",["Secundaria"],PAGE),
    act("Recalbox","https://www.recalbox.com/","Consola de jocs retro de codi obert amb més de 100 sistemes emulats","Tecnología",["Secundaria"],PAGE),
    act("Retropie","https://retropie.org.uk/","Converteix el teu ordinador en una consola clàssica amb aquest emulador","Tecnología",["Secundaria"],PAGE),
    act("Kodu Game Lab","https://www.kodugamelab.com/","Entorn de desenvolupament de jocs 3D per aprendre principis de programació","Informatica",["Primaria","Secundaria"],PAGE),
    act("Alice","http://www.alice.org/","Entorn de programació per crear animacions, històries interactives i jocs 3D","Informatica",["Secundaria"],PAGE),
    act("Scratch","https://scratch.mit.edu/","Crea històries, jocs i animacions amb aquest entorn de programació","Informatica",["Primaria","Secundaria"],PAGE),
    act("MakeCode Arcade","https://arcade.makecode.com/","Programació de jocs arcade amb blocs, JavaScript i Python","Informatica",["Primaria","Secundaria"],PAGE),
    act("MonoGame","https://monogame.net/","Framework per desenvolupar videojocs en 2D i 3D en C#","Informatica",["Secundaria"],PAGE),
    act("8bitworkshop","https://8bitworkshop.com/","Aprendre a programar jocs en entorn de 8 bits","Informatica",["Secundaria"],PAGE),
    act("MIT App Inventor","https://appinventor.mit.edu/","Programació d'aplicacions per dispositius mòbils","Informatica",["Secundaria"],PAGE),
    act("Micro:bit MakeCode","https://makecode.microbit.org/","Simulador per programar la placa micro:bit","Informatica",["Primaria","Secundaria"],PAGE),
]

# ── edicio-produccio-audiovisual-batxillerat.html ──────────────────────────
PAGE = "edicio-produccio-audiovisual-batxillerat.html"
new_activities += [
    act("CuePrompter","https://cueprompter.com/","Converteix el teu navegador en un teleprompter per llegir textos","Artes",["Secundaria"],PAGE),
    act("Unreal Engine","https://www.unrealengine.com/es-ES","Motor de creació 3D per videojocs, animacions i entorns virtuals","Informatica",["Secundaria"],PAGE),
    act("Reaper","https://www.reaper.fm/","DAW professional per gravar, editar i masteritzar àudio","Musica",["Secundaria"],PAGE),
    act("National Film Board of Canada","https://www.nfb.ca/","Plataforma amb documentals sobre temes socials i educatius","Artes",["Secundaria"],PAGE),
    act("Learning Light (Google)","https://artsandculture.google.com/experiment/learning-light/ywEbheTXDCXJCQ?cp","Experiment interactiu sobre il·luminació en fotografia i cinema","Artes",["Secundaria"],PAGE),
    act("Clipchamp","https://clipchamp.com/es/","Editor de vídeo gratuït de Microsoft per fer vídeos fàcilment","Artes",["Secundaria"],PAGE),
    act("CameraSim","https://www.camerasim.com","Aprèn fotografia: diafragma, velocitat d'obturació i ISO","Artes",["Secundaria"],PAGE),
    act("Clideo","https://clideo.com/es","Plataforma en línia amb eines gratuïtes per editar vídeos al navegador","Artes",["Secundaria"],PAGE),
    act("Brickfilms","https://brickfilms.com/","Plataforma de recursos per a animacions stop-motion amb peces Lego","Artes",["Primaria","Secundaria"],PAGE),
    act("Zu3D","https://www.zu3d.com/","Programari stop-motion per a PC, Mac i iPad","Artes",["Primaria","Secundaria"],PAGE),
    act("Riverside","https://riverside.fm/","Eina per gravar vídeos i àudios d'alta qualitat (podcasts, entrevistes)","Artes",["Secundaria"],PAGE),
    act("Wikiflix","https://wikiflix.toolforge.org/#/","Explora pel·lícules en domini públic i llicències obertes","Artes",["Secundaria"],PAGE),
    act("Stop Motion Magazine","https://stopmotionmagazine.com/","Revista digital amb notícies i recursos sobre stop motion","Artes",["Secundaria"],PAGE),
    act("Animashooter","http://www.animashooter.ru/","Programari d'animació per Windows i Linux","Artes",["Secundaria"],PAGE),
    act("DaVinci Resolve 18","https://www.blackmagicdesign.com/ar/products/davinciresolve/whatsnew","Edició de vídeo professional amb funcionalitats per a animacions gràfiques","Artes",["Secundaria"],PAGE),
    act("Dragonframe","https://www.dragonframe.com/","Programari stop-motion professional amb prova gratuïta de 30 dies","Artes",["Secundaria"],PAGE),
    act("Animatron Studio","https://www.animatron.com/studio","Aplicació per crear animacions atractives en HTML5","Artes",["Secundaria"],PAGE),
    act("Adobe Color","https://color.adobe.com/es/create/color-wheel","Roda cromàtica interactiva per triar paletes de colors","Artes",["Secundaria"],PAGE),
    act("GB Studio","https://www.gbstudio.dev/","Dissenya el teu primer videojoc amb estil Game Boy","Informatica",["Secundaria"],PAGE),
    act("Photopea","https://www.photopea.com/","Editor d'imatges avançat, gratuït i en línia","Artes",["Secundaria"],PAGE),
    act("Jahshaka","https://www.jahshaka.com/","Construeix mons virtuals en tres dimensions","Artes",["Secundaria"],PAGE),
    act("Artweaver 7","https://www.artweaver.de/en","Programari de pintura digital amb pinzells realistes","Artes",["Secundaria"],PAGE),
    act("Fire Alpaca","https://firealpaca.com/es/","Programari gratuït de pintura digital per a Windows i Mac","Artes",["Secundaria"],PAGE),
    act("Shot Designer","https://www.hollywoodcamerawork.com/shot-designer.html","Programari per planificar escenes del muntatge (versió gratuïta disponible)","Artes",["Secundaria"],PAGE),
    act("Storyboarder","https://wonderunit.com/storyboarder/","Programari per dissenyar storyboards","Artes",["Secundaria"],PAGE),
    act("SculptGL","https://stephaneginier.com/sculptgl/","Aplicació web de modelat 3D esculptura","Artes",["Secundaria"],PAGE),
    act("Kinoscope (Google Arts)","https://artsandculture.google.com/asset/kinoscope-a-vr-journey-into-the-world-of-cinema/mgHwbzF-ExSqCQ","Viatge immersiu per la història del cinema (Google Arts & Culture)","Artes",["Secundaria"],PAGE),
    act("Pexels","https://www.pexels.com/ca-es/","Fotos i vídeos d'estoc gratuïts sense necessitat d'atribució","Artes",["Secundaria"],PAGE),
    act("Make Human","https://static.makehumancommunity.org/makehuman.html","Dissenya personatges humans en 3D (compatible Blender i MeshLab)","Artes",["Secundaria"],PAGE),
    act("Meshmixer","http://www.meshmixer.com/","Programari de modelatge en 3D per crear, reconstruir i esculpir dissenys","Artes",["Secundaria"],PAGE),
    act("Google Web Designer","https://webdesigner.withgoogle.com/","Introducció al disseny web i vídeos interactius HTML5","Informatica",["Secundaria"],PAGE),
]

# ── videojoc.html ──────────────────────────────────────────────────────────
PAGE = "videojoc.html"
new_activities += [
    act("Construct 3","https://www.construct.net/en","Plataforma visual per crear videojocs 2D sense programar, al navegador","Informatica",["Secundaria"],PAGE),
    act("Unity","https://unity.com/es","Motor de desenvolupament de jocs per construir videojocs, simulacions i VR/AR","Informatica",["Secundaria"],PAGE),
    act("GameMaker Studio","https://gamemaker.io/es","Plataforma intuïtiva per crear videojocs 2D amb eines visuals","Informatica",["Secundaria"],PAGE),
    act("Easy Game Maker","https://www.easygamemaker.com/","Eina gratuïta en línia per crear videojocs 2D sense programar","Informatica",["Primaria","Secundaria"],PAGE),
    act("RPG Playground","https://rpgplayground.com/","Editor potent per programar videojocs RPG","Informatica",["Secundaria"],PAGE),
    act("Phaser","https://phaser.io/","Entorn de programació basat en JavaScript per crear jocs HTML5 ràpidament","Informatica",["Secundaria"],PAGE),
    act("Gamefroot","https://make.gamefroot.com/","Plataforma per dissenyar i programar videojocs","Informatica",["Secundaria"],PAGE),
    act("GDevelop 5","https://gdevelop.io/","Programari de codi obert i multiplataforma per dissenyar videojocs","Informatica",["Secundaria"],PAGE),
]

# ── protagonistes.html ──────────────────────────────────────────────────────
PAGE = "protagonistes.html"
new_activities += [
    act("Shakespeare Timeline (PBS)","https://www.pbs.org/wnet/shakespeare-uncovered/timeline/","Línia del temps interactiva sobre la vida i obra de William Shakespeare","Lengua",["Secundaria"],PAGE),
    act("L'obra de Gaudí","https://consellantonigaudi.cat/obra/","Plataforma sobre el llegat arquitectònic i artístic de Gaudí","Artes",["Primaria","Secundaria"],PAGE),
    act("Cervantes en la escuela","http://www.cervantesenlaescuela.es/","Recurs interactiu sobre la vida i obra de Miguel de Cervantes","Lengua",["Secundaria"],PAGE),
    act("L'obra d'Antoni Gaudí (La Pedrera)","https://www.lapedrera.com/ca/obra-antoni-gaudi/","Coneix l'obra de Gaudí i el seu llenguatge arquitectònic","Artes",["Primaria","Secundaria"],PAGE),
    act("Oceánicas","https://oceanicas.ieo.es/","Divulgació científica sobre dones en investigació marina","Ciencias Naturales",["Secundaria"],PAGE),
    act("Sagrada Família - Antoni Gaudí","https://educa.sagradafamilia.org/recursos-i-materials?p_r_p_categoryId=1487053","Jocs, vídeos i activitats sobre la Sagrada Família","Artes",["Primaria","Secundaria"],PAGE),
    act("Federico García Lorca (Cervantes Virtual)","https://www.cervantesvirtual.com/portales/federico_garcia_lorca/","Portal amb obra, biografia, manuscrits i estudis crítics de Lorca","Lengua",["Secundaria"],PAGE),
    act("Viatgers del temps: Pitàgores","interactius/pitagores/intro/index.html","Aventura interactiva sobre Pitàgores i el seu teorema","Matematicas",["Secundaria"],PAGE),
    act("Historia de la Ciencia (FisicaQuimica)","https://fisiquimicamente.com/recursos-fisica-quimica/historia-ciencia/","Biografies de científics i científiques destacats","Ciencias Naturales",["Secundaria"],PAGE),
    act("Mortadelo y Filemón","https://mortadelo-filemon.es/","Web dedicada als emblemàtics personatges de còmic creats per Francisco Ibáñez","Artes",["Primaria","Secundaria"],PAGE),
    act("Famous Composers","https://www.pianolessons4children.com/composers/","Llegat de compositors com Bach, Mozart, Beethoven, Chopin","Musica",["Primaria","Secundaria"],PAGE),
    act("Galeria de metges catalans","https://www.galeriametges.cat/home.php","Professionals mèdics catalans destacats","Ciencias Sociales",["Secundaria"],PAGE),
    act("Personatges històrics (Google Arts)","https://artsandculture.google.com/category/historical-figure?hl=es&tab=pop","Explora figures clau de la història mundial","Ciencias Sociales",["Secundaria"],PAGE),
    act("The Kapralova Society","http://www.kapralova.org/index.htm","La compositora txeca Kaprálová: vida, música i rol femení","Musica",["Secundaria"],PAGE),
    act("FreddieMeter","https://experiments.withgoogle.com/freddiemeter","Grava la teva veu i compara-la amb Freddie Mercury de Queen","Musica",["Primaria","Secundaria"],PAGE),
    act("Poemes de la Joana Raspall","https://clic.xtec.cat/projects/jraspall/jclic.js/index.html","Vida i obra de la poeta catalana Joana Raspall","Lengua",["Primaria","Secundaria"],PAGE),
    act("L'ocell de foc de Stravinski","flash/stravinski/index.html","Descobreix el geni rus de la música Igor Stravinski","Musica",["Secundaria"],PAGE),
    act("Pau Casals (StoryMapJS)","https://uploads.knightlab.com/storymapjs/7849dbb5d930c289c2b97ca7121a45c2/pau-casals-1/index.html","Mapa interactiu de moments clau en la vida de Pau Casals","Musica",["Secundaria"],PAGE),
    act("Catàlegs Raonats de l'Obra de Dalí","https://www.salvador-dali.org/ca/obra/cataleg-raonat/","La producció artística de Salvador Dalí al teu abast","Artes",["Secundaria"],PAGE),
    act("Jordi Sabater i Pi","https://recercaiuniversitats.gencat.cat/ca/03_ambits_dactuacio/commemoracions/jordi-sabater-pi/index.html","Primatòleg i estudi de primats","Ciencias Naturales",["Primaria","Secundaria"],PAGE),
    act("Cervantes en la BNE","https://cervantes.bne.es/","Accés digital a llibres, il·lustracions i vídeos sobre Cervantes","Lengua",["Secundaria"],PAGE),
    act("Hola, Beethoven","https://hallo.beethoven.de/html5/start.html","Endinsa't en el món del compositor Ludwig van Beethoven","Musica",["Primaria","Secundaria"],PAGE),
    act("Sur le pas de Darwin (Galápagos)","https://www.cite-sciences.fr/juniors/darwin-galapagos/index.html","Les illes Galápagos amb Darwin: evolució i biodiversitat","Ciencias Naturales",["Secundaria"],PAGE),
    act("Kids CSIC","https://www.kids.csic.es/index.html","Desperta la teva curiositat científica amb vídeos i experiments","Ciencias Naturales",["Primaria","Secundaria"],PAGE),
    act("Manuel de Pedrolo (Biblioteca Digital)","https://bibliotecavirtual.diba.cat/manuel-de-pedrolo","L'univers literari de l'escriptor Manuel de Pedrolo","Lengua",["Secundaria"],PAGE),
    act("Hergé - Tintín","https://www.tintin.com/es/herge","Dibuixant i guionista creador de Tintín","Artes",["Primaria","Secundaria"],PAGE),
    act("Elles! Biografies de dones","https://dones.gencat.cat/web/.content/03_ambits/docs/cdoc_publicacions_Elles.pdf","Recull de biografies de 65 dones oblidades en la història","Ciencias Sociales",["Secundaria"],PAGE),
    act("Museu Schulz (Snoopy)","https://schulzmuseum.org/about-schulz/","Biografia de Charles Schulz, creador de Snoopy","Artes",["Primaria","Secundaria"],PAGE),
    act("Miró en joc","https://www.fmirobcn.org/ca/activitats/families/miro-en-joc/","Recursos educatius sobre Joan Miró","Artes",["Primaria","Secundaria"],PAGE),
    act("Museu Van Gogh","https://museovangogh.org/","Museu virtual de Vincent Van Gogh","Artes",["Secundaria"],PAGE),
    act("Visita virtual Museu Dalí","https://www.salvador-dali.org/es/museos/teatro-museo-dali-de-figueres/visita-virtual/","Recorregut virtual per les sales del museu Dalí de Figueres","Artes",["Secundaria"],PAGE),
    act("The Beatles Story","https://www.beatlesstory.com/education/games-and-quizzes/","Jocs i qüestionaris sobre The Beatles","Musica",["Secundaria"],PAGE),
    act("Biografies de líders polítics (CIDOB)","https://www.cidob.org/lideres-politicos/biografias-lideres-politicos","Biografies de líders polítics mundials","Ciencias Sociales",["Secundaria"],PAGE),
]

# ── fem-estiu.html (PDFs / tallers) ────────────────────────────────────────
PAGE = "fem-estiu.html"
new_activities += [
    act("L'illa del mussol","https://www.edu365.cat/taller/estiu2023/illa-mussol-joc.pdf","Construeix el teu joc de taula i prepara't per viure una aventura pirata","Manualitats",["Primaria"],PAGE),
    act("Ull viu!","https://edu365.cat/taller/guingueta/ull-viu.pdf","Joc per posar a prova la vista i descobrir qui té l'ull més viu","Manualitats",["Primaria"],PAGE),
    act("Cavallet (joc d'escuma)","https://edu365.cat/taller/olimpiades-estiu/cavallet-A4.pdf","Transforma un tub d'escuma en cavallet per jugar","Manualitats",["Primaria"],PAGE),
    act("Pai-pai de paper","https://edu365.cat/taller/olimpiades-estiu/instruccions_paipai-A4.pdf","Fes un ventall de paper per refrescar-te","Manualitats",["Primaria"],PAGE),
    act("Futbolí de paper","https://edu365.cat/taller/olimpiades-estiu/futboli-A4.pdf","Crea el teu propi futbolí de paper i diverteix-te jugant partits","Manualitats",["Primaria"],PAGE),
    act("Jocs medievals","https://edu365.cat/taller/santjordi2024/jocs_medievals_A4.pdf","Jocs de punteria amb materials reciclats","Manualitats",["Primaria"],PAGE),
    act("Joc de pesca (reciclat)","https://edu365.cat/taller/carnaval2024/joc_pesca_A4.pdf","Construeix un joc de pesca amb materials reciclats","Manualitats",["Primaria"],PAGE),
    act("Motxilla astronauta","https://edu365.cat/taller/carnaval_venusia/motxilla-astronauta.pdf","Construeix una motxilla espacial amb materials reciclats","Manualitats",["Primaria"],PAGE),
    act("Mussol volador","https://edu365.cat/taller/tardor2023/mussol_volador.pdf","Crea un mussol amb ales que es mouen de veritat","Manualitats",["Primaria"],PAGE),
    act("Ventilador sense motor","https://edu365.cat/taller/guingueta/ventilador.pdf","Construeix un ventilador amb materials reciclats","Manualitats",["Primaria"],PAGE),
    act("Pinyata castell","https://edu365.cat/taller/santjordi2025/pinyata.pdf","Construeix una pinyata en forma de castell","Manualitats",["Primaria"],PAGE),
    act("Bàsquet-tap","https://edu365.cat/taller/guingueta/basquet-tap.pdf","Construeix el teu propi joc de bàsquet amb taps i cartró","Manualitats",["Primaria"],PAGE),
    act("Passa-la!","https://edu365.cat/taller/guingueta/passa-la.pdf","Joc d'habilitat amb caixa, gomes i taps","Manualitats",["Primaria"],PAGE),
    act("La llegenda sense fi","https://edu365.cat/taller/santjordi2025/llegenda-sense-fi.pdf","Inventa històries noves cada vegada","Lengua",["Primaria"],PAGE),
    act("La disfressa esbojarrada","https://edu365.cat/taller/carnaval2024/disfressa_esbojarradda_bn_A4.pdf","Crea disfresses barrejant vestits de manera divertida","Manualitats",["Primaria"],PAGE),
    act("El laberint del drac i la rosa","https://edu365.cat/taller/sant_jordi2023/laberint_drac_princesa_A4.pdf","Ressegueix el camí i pinta el dibuix del drac i la princesa","Artes",["Primaria"],PAGE),
    act("Pinta la sardina","https://edu365.cat/taller/carnaval2023/pinta_A4.pdf","Resol sumes i pinta la sardina","Matematicas",["Primaria"],PAGE),
    act("Joc de memòria (estiu)","https://www.edu365.cat/taller/estiu2023/memory_estiu.pdf","Retalla les cartes i juga a fer parelles","Manualitats",["Primaria"],PAGE),
    act("Eduween (joc de cartes)","https://edu365.cat/taller/monstres_ombres/cartes_eduween_A4.pdf","Joc de cartes amb personatges terrorífics de Halloween","Manualitats",["Primaria"],PAGE),
]

# ── comic.html ──────────────────────────────────────────────────────────────
PAGE = "comic.html"
new_activities += [
    act("Còmics - Biblioteca Virtual DIBA","https://bibliotecavirtual.diba.cat/ca/comics","Selecció de còmics amb recomanacions, novetats i llistes temàtiques","Artes",["Primaria","Secundaria"],PAGE),
    act("Historia y Cómic","https://historiaycomic.wordpress.com/","Blog que combina la divulgació històrica amb el còmic","Ciencias Sociales",["Primaria","Secundaria"],PAGE),
    act("Gomic","https://gomic.eu/","Plataforma per descobrir històries d'acció, aventura, amor i ciència-ficció","Artes",["Primaria","Secundaria"],PAGE),
    act("Tintin.com","https://www.tintin.com/es","Portal oficial dedicat a les aventures de Tintín","Artes",["Primaria"],PAGE),
    act("Continguts EPVA: Còmic","https://educacionplasticayvisual.com/lenguajes-visuales/comic/","Recursos sobre què és un còmic i quins són els seus elements bàsics","Artes",["Primaria","Secundaria"],PAGE),
    act("Google Arts & Culture - Còmic","https://artsandculture.google.com/entity/comics/m012h24?hl=en","Explora la història, l'art i la influència del còmic","Artes",["Secundaria"],PAGE),
    act("Storyboard That","https://www.storyboardthat.com/","Eina en línia per crear storyboards, còmics i organitzadors gràfics","Artes",["Primaria","Secundaria"],PAGE),
    act("Comicat","https://www.comicat.cat/","Blog dedicat al còmic en català amb ressenyes i novetats","Artes",["Primaria","Secundaria"],PAGE),
    act("Super Action Comic Maker","https://www.culturestreet.org.uk/activities/superactioncomicmaker/","Eina en línia per crear còmics interactius de manera senzilla","Artes",["Primaria"],PAGE),
    act("Astèrix","https://asterix.com/es/","Informació sobre els àlbums, personatges i autors d'Astèrix","Artes",["Primaria"],PAGE),
    act("Comiclopedia (Lambiek)","https://www.lambiek.net/comiclopedia.html","Enciclopèdia en línia dedicada als artistes de còmic","Artes",["Secundaria"],PAGE),
    act("Tebeosfera","https://www.tebeosfera.com/","Enciclopèdia digital dedicada al còmic i a la historieta","Artes",["Secundaria"],PAGE),
    act("Canva - Comic Strips","https://www.canva.com/create/comic-strips/","Crea tires còmiques de manera fàcil amb plantilles personalitzables","Artes",["Primaria","Secundaria"],PAGE),
    act("AI Comic Factory","https://aicomicfactory.com/playground","Plataforma que permet crear còmics generats per intel·ligència artificial","Informatica",["Secundaria"],PAGE),
    act("Digital Comic Museum","https://digitalcomicmuseum.com/","Biblioteca en línia amb còmics antics de domini públic","Artes",["Secundaria"],PAGE),
    act("Edit.org","https://edit.org/","Plataforma per dissenyar i personalitzar materials gràfics, inclosos còmics","Artes",["Primaria","Secundaria"],PAGE),
    act("Fonts de la il·lustració i el còmic (BNC)","https://www.bnc.cat/Il-lustracio-i-comic","Visió general sobre la història de la il·lustració i el còmic a Catalunya","Artes",["Secundaria"],PAGE),
]

# ── sabies-que.html (YouTube clips educatius) ───────────────────────────────
PAGE = "sabies-que.html"
def yt(vid):
    return f"https://www.youtube.com/watch?v={vid}"

new_activities += [
    act("Sabies que...? Les habilitats personals",yt("cmtyKyFoIJs"),"Les habilitats motores ens permeten desplaçar-nos, mantenir l'equilibri i fer acrobàcies","Diversas áreas",["Primaria"],PAGE),
    act("Sabies que...? La notícia",yt("z5NrDcdhdmQ"),"Les notícies i els periodistes ens mantenen informats del que passa al món","Lengua",["Primaria"],PAGE),
    act("Sabies que...? El còmic",yt("fagSCWev6UM"),"Les històries del còmic poden ser còmiques, intrigants o d'aventures","Artes",["Primaria"],PAGE),
    act("Sabies que...? Les composicions musicals",yt("EzcW-LIuSMM"),"La música és un llenguatge universal present a totes les cultures","Musica",["Primaria"],PAGE),
    act("Sabies que...? Street Art",yt("tb3MwFIORpY"),"Obres d'art trobades a les parets d'edificis i tanques al passejar","Artes",["Primaria"],PAGE),
    act("Sabies que...? Art i emocions",yt("Bovii1DEcbk"),"Exploració de les respostes emocionals a l'art, el cinema i la poesia","Artes",["Primaria"],PAGE),
    act("Sabies que...? Els llibres de cavalleria",yt("Lc8sA_MCW4o"),"Guerrers, reines poderoses i bruixots famosos en la tradició oral i literatura","Lengua",["Secundaria"],PAGE),
    act("Sabies que...? Textos instructius i descriptius",yt("DW_UPZXAOow"),"Tipus de textos: receptes, instruccions de muntatge i retrats","Lengua",["Primaria"],PAGE),
    act("Sabies que...? Ens expressem movent-nos",yt("JT3dW5pSFhc"),"Sentiments i estats d'ànim reflectits en expressions facials i corporals","Diversas áreas",["Primaria"],PAGE),
    act("Sabies que...? Funció de relació",yt("qXlZ2ivxKLA"),"Capacitat dels éssers vius de rebre informació de l'entorn i actuar en conseqüència","Ciencias Naturales",["Secundaria"],PAGE),
    act("Sabies que...? Fraccions",yt("x8zlX7OTpXc"),"Les fraccions representen parts d'una unitat dividida en parts iguals","Matematicas",["Primaria"],PAGE),
    act("Sabies que...? Impressionisme",yt("RxmQ9xCqCjU"),"Moviment artístic que sorgeix a França a finals del segle XIX","Artes",["Secundaria"],PAGE),
    act("Sabies que...? Avantguardes",yt("pKzdNBr5BcM"),"Període social complex del segle XX amb repercussions en l'art i la societat","Artes",["Secundaria"],PAGE),
    act("Sabies que...? Revolució Industrial",yt("812yz0QJIcs"),"La major transformació econòmica, social i tecnològica de la història humana","Ciencias Sociales",["Secundaria"],PAGE),
    act("Sabies que...? La publicitat",yt("nYd7WdpYWQ4"),"Presentació atractiva de productes mitjançant tècniques publicitàries","Lengua",["Primaria"],PAGE),
    act("Sabies que...? Literatura",yt("Ljoq7txdZDQ"),"Permet viatjar a llocs, conèixer gent i viure aventures de tota mena","Lengua",["Primaria"],PAGE),
    act("Sabies que...? La diversitat de llengües",yt("grhB5iz1yQc"),"Més de 7000 llengües vives al món que interactuen i es barregen","Lengua",["Primaria"],PAGE),
    act("Sabies que...? L'impressionisme musical",yt("PzKHJKpUY1c"),"Moviment artístic amb melodies fluïdes sense forma musical marcada","Musica",["Secundaria"],PAGE),
    act("Sabies que...? Expressions fetes",yt("0ZuMAH6rsP4"),"Expressions idiomàtiques i el seu significat cultural en la llengua","Lengua",["Primaria"],PAGE),
    act("Sabies que...? Les qualitats físiques",yt("DDFToAwHdC0"),"Treballar resistència, força, velocitat i flexibilitat per estar en forma","Diversas áreas",["Primaria"],PAGE),
    act("Sabies que...? Videojocs",yt("6321Y57kxLs"),"Objectes tridimensionals, dimensions i materials que ens envolten","Informatica",["Primaria"],PAGE),
    act("Sabies que...? Els nombres naturals",yt("rcy3JvOLu-Y"),"Sistema decimal per comptar, però sempre comptem igual?","Matematicas",["Primaria"],PAGE),
    act("Sabies que...? Mates i esport",yt("2M0o9xPr29U"),"Aplicació d'àrees, volums, massa i longitud en contextos esportius","Matematicas",["Primaria"],PAGE),
    act("Sabies que...? El nostre planeta",yt("RmsS39qEEvU"),"Subsistemes terrestres interdependents amb terratrèmols i volcans","Ciencias Naturales",["Primaria"],PAGE),
    act("Sabies que...? Les característiques d'una cançó",yt("Qf87W7SBfOk"),"Anàlisi de les característiques emocionals i missatges de les cançons","Musica",["Primaria"],PAGE),
    act("Sabies que...? Ciència i pseudociència",yt("vDge4g8nBTM"),"Ciència basada en hipòtesis verificables vs. pseudociències no demostrables","Ciencias Naturales",["Secundaria"],PAGE),
    act("Sabies que...? Energia de km 0",yt("MQjr7nqQfqo"),"Fonts renovables i eficiència energètica per reduir l'impacte ambiental","Ciencias Naturales",["Secundaria"],PAGE),
    act("Sabies que...? Plàstic i metalls",yt("G3Nhw8m3YSM"),"Productes formats per múltiples materials","Ciencias Naturales",["Primaria"],PAGE),
    act("Sabies que...? Els estils musicals",yt("ljuERUgYtxg"),"Evolució musical històrica amb estils associats a cada època","Musica",["Primaria"],PAGE),
    act("Sabies que...? El text narratiu",yt("-tQby7lkrzY"),"Novel·les i narracions amb elements inesperats i imaginatius","Lengua",["Primaria"],PAGE),
    act("Sabies que...? Temps de castells",yt("NN5Q7v9S1pI"),"Organització social feudal, paper de l'església i condicions dels serfs","Ciencias Sociales",["Secundaria"],PAGE),
    act("Sabies que...? L'Art, idioma universal",yt("0FZ7FtTv60U"),"L'art com a mitjà universal de comunicació i expressió","Artes",["Primaria"],PAGE),
    act("Sabies que...? Energia",yt("CHu7v6ypz2k"),"Definició d'energia: cinètica, tèrmica, elèctrica i altres tipus","Ciencias Naturales",["Secundaria"],PAGE),
    act("Sabies que...? Fake news",yt("RXp0jOw-p_U"),"Notícies falses per desinformar o manipular l'opinió pública","Lengua",["Primaria"],PAGE),
    act("Sabies que...? La narración",yt("9sVy3yWHOgM"),"Explicar fets reals o ficticis, el rol del narrador en les històries","Lengua",["Primaria"],PAGE),
    act("Sabies que...? Representació cossos en 3D",yt("jUd6slMUp6w"),"Conversió de figures planes bidimensionals a representació tridimensional","Matematicas",["Primaria"],PAGE),
    act("Sabies que...? Les màquines",yt("3xi9hrtJ3qs"),"De les màquines simples a les complexes","Ciencias Naturales",["Primaria"],PAGE),
    act("Sabies que...? Energia i màquines",yt("O4mT9uPdqsw"),"Transformació d'energia de combustible en cinètica per al moviment","Ciencias Naturales",["Secundaria"],PAGE),
    act("Sabies que...? Àtoms, elements i taula periòdica",yt("6BJvJSKAGtA"),"Matèria formada per elements químics amb característiques concretes","Ciencias Naturales",["Secundaria"],PAGE),
    act("Sabies que...? Reaccions químiques",yt("eqe0WivH0wk"),"Múltiples tipus: respiració i obtenció d'energia dels aliments","Ciencias Naturales",["Secundaria"],PAGE),
    act("Sabies que...? Consumidors i medi ambient",yt("Jn2usmExfD0"),"Quantitat ingent de productes comprats, usats i llençats diàriament","Ciencias Naturales",["Primaria"],PAGE),
    act("Sabies que...? El bàdminton",yt("GiEcDRmh3bE"),"L'esport de raqueta més ràpid, el volant supera un F1","Diversas áreas",["Primaria"],PAGE),
    act("Sabies que...? Parkour",yt("FX52t75ZsxU"),"L'art del desplaçament mitjançant moviment lliure","Diversas áreas",["Primaria"],PAGE),
    act("Sabies que...? Fraccions, decimals i percentatges",yt("3nIOuxY2qRI"),"Representen situacions quotidianes de manera més efectiva","Matematicas",["Primaria"],PAGE),
    act("Sabies que...? Equacions",yt("yaeIxvLZ0ZY"),"Trobar valors desconeguts a partir de dades concretes","Matematicas",["Secundaria"],PAGE),
    act("Sabies que...? Som una màquina perfecta",yt("t4Gu3PJ-Pmw"),"Sentits i sistema nerviós coordinen respostes per mantenir l'equilibri","Ciencias Naturales",["Primaria"],PAGE),
    act("Sabies que...? Expressions discriminatòries",yt("N-fYF8VS4yE"),"Expressions fetes que poden resultar discriminatòries o ofensives","Lengua",["Primaria"],PAGE),
    act("Sabies que...? Parlar i escriure",yt("Jd9fClFWp68"),"La manera de parlar i escriure reflecteix la nostra personalitat","Lengua",["Primaria"],PAGE),
    act("Sabies que...? Tipus d'habitatges",yt("e-QkORFRKf4"),"Habitatges adaptats a l'entorn segons la regió geogràfica","Ciencias Sociales",["Primaria"],PAGE),
    act("Sabies que...? Electrònica digital",yt("5BcIrGOU8uA"),"Llenguatge dels ordinadors i aparells electrònics","Informatica",["Secundaria"],PAGE),
    act("Sabies que...? El Romanticismo literario",yt("Af-kNqkPde8"),"Moviment literari espanyol de la primera meitat del segle XIX","Lengua",["Secundaria"],PAGE),
    act("Sabies que...? La música del segle XX",yt("FLI7p0JCZsQ"),"Es basa fonamentalment en música africana: blues i jazz","Musica",["Secundaria"],PAGE),
    act("Sabies que...? Les forces i les seves lleis",yt("PMrWqHeYBaM"),"Lleis que regeixen les forces físiques","Ciencias Naturales",["Secundaria"],PAGE),
    act("Sabies que...? Característiques de la matèria",yt("49vbcu27WqY"),"Propietats de substàncies i conducció d'electricitat","Ciencias Naturales",["Secundaria"],PAGE),
    act("Sabies que...? Som com som",yt("AO7XjyXOprg"),"Trets hereditaris com el color dels ulls i el grup sanguini","Ciencias Naturales",["Primaria"],PAGE),
    act("Sabies que...? Finances",yt("YToZO8aX-ic"),"Ingressos, despeses, capacitat d'estalvi i interessos en l'anàlisi financer","Ciencias Sociales",["Secundaria"],PAGE),
    act("Sabies que...? Feliços anys 20",yt("FPhVS90t6fU"),"El segle XX marcat per les Guerres Mundials I i II","Ciencias Sociales",["Secundaria"],PAGE),
    act("Sabies que...? Què és el disseny?",yt("YuRrgLb_vkU"),"Disseny de roba, interiors, gràfic i aplicacions diverses","Artes",["Primaria"],PAGE),
    act("Sabies que...? La hipotenusa",yt("Jge9yxXJfNE"),"Fórmula per calcular la longitud de rampes a diferents alçades","Matematicas",["Secundaria"],PAGE),
]

# ── animacio.html ───────────────────────────────────────────────────────────
PAGE = "animacio.html"
new_activities += [
    act("Voki","https://www.voki.com/","Creació d'avatars animats per a contingut educatiu","Artes",["Primaria","Secundaria"],PAGE),
]
# (altres ja inclosos de open-source o audiovisual)

# ── digital-taller.html ─────────────────────────────────────────────────────
PAGE = "digital-taller.html"
new_activities += [
    act("Distrosea","https://distrosea.com/","Prova diferents distribucions Linux directament des del navegador","Tecnología",["Secundaria"],PAGE),
    act("Web Rewind","https://web-rewind.com/","Explora moments destacats de la història d'Internet de forma visual","Tecnología",["Secundaria"],PAGE),
    act("Macintosh Repository","https://www.macintoshrepository.org/","Arxiu digital col·laboratiu on es conserven programes antics de Mac","Tecnología",["Secundaria"],PAGE),
    act("ZX Spectrum Games","https://torinak.com/qaop/games","Videojocs clàssics de ZX Spectrum disponibles al navegador","Tecnología",["Secundaria"],PAGE),
    act("Blankpage","https://blankpage.im","Editor de text minimalista sense distraccions per a l'escriptura","Lengua",["Secundaria"],PAGE),
    act("OpenGameArt.org","https://opengameart.org/","Plataforma gratuïta amb recursos gràfics i sonors per a videojocs","Informatica",["Secundaria"],PAGE),
    act("CP/M Box","https://www.habisoft.com/pcw/es.htm","Emulador per executar programari Amstrad PCW","Tecnología",["Secundaria"],PAGE),
    act("Flowlab","https://flowlab.io/","Programari en línia per dissenyar i desenvolupar jocs sense programar","Informatica",["Secundaria"],PAGE),
    act("Figuro","https://www.figuro.io/Home/Welcome","Eina gratuïta per dissenyar i modelar en 3D des del navegador","Artes",["Secundaria"],PAGE),
    act("TV Garden","https://tv.garden/","Plataforma gratuïta per veure canals de televisió en directe de tot el món","Diversas áreas",["Primaria","Secundaria"],PAGE),
    act("Bricklink Studio","https://www.bricklink.com/v3/studio/main.page","Dissenya i construeix amb peces virtuals LEGO","Artes",["Primaria","Secundaria"],PAGE),
    act("BBC Computer Literacy Project","https://clp.bbcrewind.co.uk/beeb","Arxiu digital per explorar programes informàtics dels anys 80","Tecnología",["Secundaria"],PAGE),
    act("Timeline JS","https://timeline.knightlab.com/","Crea i publica la teva línia de temps interactiva amb Google Sheets","Ciencias Sociales",["Secundaria"],PAGE),
    act("Inklewriter","https://www.inklestudios.com/inklewriter/","Crea aventures interactives i sorprèn els teus lectors","Lengua",["Secundaria"],PAGE),
    act("Elementari","https://elementari.com/","Plataforma per llegir, escriure, codificar, col·laborar i compartir històries","Lengua",["Primaria","Secundaria"],PAGE),
    act("Panzoid","https://panzoid.com/","Dissenya títols espectaculars per als teus vídeos","Artes",["Secundaria"],PAGE),
    act("Kassel Labs","https://kassellabs.io/","Dissenya entrades i crèdits cinematogràfics per a les teves creacions","Artes",["Secundaria"],PAGE),
    act("BBC Micro Games Archive","https://www.bbcmicro.co.uk/index.php","Emuladors, jocs i recursos per a l'ordinador BBC Micro","Tecnología",["Secundaria"],PAGE),
    act("PCE Macplus Emulator","https://jamesfriend.com.au/pce-js/pce-js-apps/","Emulació de Mac Plus amb programari descatalogat","Tecnología",["Secundaria"],PAGE),
    act("Chrome OS Flex","https://chromeenterprise.google/os/chromeosflex/","Sistema operatiu al núvol per modernitzar el teu dispositiu","Tecnología",["Secundaria"],PAGE),
    act("Pokecardmaker","https://pokecardmaker.com/configurator/","Aplicació per dissenyar cartes Pokemon personalitzades","Artes",["Primaria","Secundaria"],PAGE),
    act("Internet Arcade (Archive.org)","https://archive.org/details/internetarcade","Centenars de videojocs clàssics de qualsevol gènere i estil","Tecnología",["Primaria","Secundaria"],PAGE),
    act("Teachflix","https://teachflix.org/","Col·lecció de vídeos educatius ordenats per categories i àrees","Diversas áreas",["Primaria","Secundaria"],PAGE),
    act("Typewrite Something","https://typewritesomething.com/","Viatja al passat i descobreix com era utilitzar una màquina d'escriure","Tecnología",["Primaria","Secundaria"],PAGE),
    act("Radio Garden","https://radio.garden/visit/annaba/30mjio1R","Navega per milers d'emissores de ràdio de tot el món","Musica",["Primaria","Secundaria"],PAGE),
    act("VDJOC - Videojocs en català","https://llengua.gencat.cat/ca/serveis/videojocs/","Consulta l'oferta disponible de videojocs en català","Informatica",["Primaria","Secundaria"],PAGE),
    act("Portrait Illustration Maker","https://illustmaker.abi-station.com/index_en.shtml","Crea el teu avatar amb un estil de videojoc japonès","Artes",["Primaria","Secundaria"],PAGE),
    act("DoppelMe","https://www.doppelme.com/","Genera els teus avatars per a les teves xarxes socials","Artes",["Primaria","Secundaria"],PAGE),
    act("PCjs Machines","https://www.pcjs.org/","Projecte de codi obert que permet emular ordinadors i programari antic","Tecnología",["Secundaria"],PAGE),
    act("Thingiverse","https://www.thingiverse.com/","Troba i descarrega objectes per imprimir-los en 3D","Tecnología",["Secundaria"],PAGE),
    act("CoSpaces Edu","https://www.cospaces.io/","Dissenya escenaris de realitat virtual i immersiva","Informatica",["Secundaria"],PAGE),
    act("Geocaching","https://www.geocaching.com/play","Uneix-te al joc de la cerca del tresor més gran del món","Diversas áreas",["Primaria","Secundaria"],PAGE),
    act("Wikiloc","https://ca.wikiloc.com/","Descobreix i comparteix rutes a l'aire lliure a peu o en bicicleta","Diversas áreas",["Primaria","Secundaria"],PAGE),
    act("Transitions DJ","https://dj.app/","Aplicació web gratuïta per fer de DJ des del navegador","Musica",["Secundaria"],PAGE),
    act("Linkat Ràdio","http://linkat.xtec.cat/portal_linkat/wikilinkat/index.php/Perfil_Ràdio","Escriptori personalitzat per fomentar la ràdio escolar","Musica",["Primaria","Secundaria"],PAGE),
]

# ── volcans.html ────────────────────────────────────────────────────────────
PAGE = "volcans.html"
new_activities += [
    act("El vulcanisme a Catalunya","http://www.gencat.cat/mediamb/publicacions/monografies/vulcanisme.pdf","Coneix les zones volcàniques de casa nostra","Ciencias Naturales",["Primaria","Secundaria"],PAGE),
    act("Volcanes de Canarias","https://www.volcanesdecanarias.org/","Plataforma dedicada a la divulgació científica sobre l'activitat volcànica","Ciencias Naturales",["Primaria","Secundaria"],PAGE),
    act("Top 10 Largest Volcanoes (ArcGIS)","https://www.arcgis.com/apps/MapTour/index.html?appid=d9eabc7a3c64462bb964d1d4bbd765de","Descobreix els volcans més alts del planeta en un mapa interactiu","Ciencias Naturales",["Primaria","Secundaria"],PAGE),
    act("Volcano Models (BGS)","https://www.bgs.ac.uk/discovering-geology/maps-and-resources/earth-hazards/volcano-models/","Informació i models educatius sobre el funcionament volcànic","Ciencias Naturales",["Primaria","Secundaria"],PAGE),
    act("Vigilància volcànica (IGN)","https://www.ign.es/web/ign/portal/vlc-area-volcanologia","Seguiment de l'activitat volcànica de l'Instituto Geográfico Nacional","Ciencias Naturales",["Secundaria"],PAGE),
    act("Com es forma una illa volcànica? (NASA)","https://www.nationalgeographic.es/video/tv/video-la-nasa-explica-como-nacen-las-islas-volcanicas-con-una-animacion","Animació de la NASA per explicar com neixen les illes volcàniques","Ciencias Naturales",["Primaria","Secundaria"],PAGE),
    act("Volcano World","https://volcano.oregonstate.edu/volcano_table","Llistat exhaustiu de volcans de tots els continents","Ciencias Naturales",["Primaria","Secundaria"],PAGE),
    act("Global Volcanism Program (Smithsonian)","https://volcano.si.edu/","Portal del Smithsonian Institution dedicat a la vigilància volcànica","Ciencias Naturales",["Secundaria"],PAGE),
    act("What Are Volcanoes? (Time for Kids)","https://www.timeforkids.com/g34/volcanoes-2/","Explicació de què són els volcans i com funcionen","Ciencias Naturales",["Primaria"],PAGE),
    act("Volcans - Mapa interactiu","https://world-geography-games.com/es/world_volcanoes.html","Juga amb aquest mapa del món interactiu i situa-hi els principals volcans","Ciencias Naturales",["Primaria","Secundaria"],PAGE),
    act("La vida secreta dels volcans","https://www.scienceinschool.org/es/article/2013/muons-es/","Article divulgatiu de Science in School sobre els volcans","Ciencias Naturales",["Secundaria"],PAGE),
]

# ── internet-segura.html ────────────────────────────────────────────────────
PAGE = "internet-segura.html"
new_activities += [
    act("Aixafa l'estafa","https://www.3cat.cat/3cat/aixafa-estafa/","Protegeix-te del frau digital! Descobreix com navegar amb seguretat","Seguridad Digital",["Primaria","Secundaria"],PAGE),
    act("Relats de ciberseguretat","https://ciberseguretat.gencat.cat/ca/ciutadania/recursos-educatius/relats-ciberseguretat/","Contes sobre protecció a internet de forma entretinguda","Seguridad Digital",["Infantil","Primaria"],PAGE),
    act("Kiddle","https://es.kiddle.co/","Cercador segur per a menors: informació, imatges i vídeos","Seguridad Digital",["Infantil","Primaria"],PAGE),
    act("Agència de Ciberseguretat de Catalunya","https://internetsegura.cat/","Descobreix novetats i recursos per navegar amb seguretat","Seguridad Digital",["Primaria","Secundaria"],PAGE),
    act("Scratchy - Contrasenya segura","https://projectes.xtec.cat/programacioirobotica/mri4-scratchy-vol-una-contrasenya-segura/","Aprèn a crear contrasenyes segures mitjançant Scratch","Seguridad Digital",["Primaria"],PAGE),
    act("#CanalPrioritario (AEPD)","https://www.aepd.es/canalprioritario","Sol·licita la retirada de contingut inadequat a internet","Seguridad Digital",["Primaria","Secundaria"],PAGE),
    act("Ciber-Odissea","interactius/ciberodissea/index.html","Posa a prova els teus coneixements sobre tecnologies digitals i xarxes socials","Seguridad Digital",["Primaria","Secundaria"],PAGE),
    act("Càpsules sobre protecció de dades","https://apdcat.gencat.cat/ca/sala_de_premsa/Galeria-multimedia/videos/campanyes/pindoles-per-a-una-privacitat-saludable/","Què cal saber per gestionar i protegir les nostres dades a la xarxa","Seguridad Digital",["Primaria","Secundaria"],PAGE),
    act("Vídeos Internet per als adolescents (CAC)","https://www.cac.cat/videos-internet-als-adolescents","Recomanacions per a l'ús responsable d'internet","Seguridad Digital",["Secundaria"],PAGE),
    act("Pantallas Amigas","https://www.pantallasamigas.net/","Col·lecció de recursos, consells i guies per a una vida digital sana","Seguridad Digital",["Primaria","Secundaria"],PAGE),
    act("¡Cuidado con la webcam!","https://cuidadoconlawebcam.com/","Consells de prevenció de riscos associats a les càmeres web","Seguridad Digital",["Primaria","Secundaria"],PAGE),
    act("Netsmartz Kids","https://www.netsmartzkids.org/games/","Vídeos i jocs per aprendre a navegar de manera segura","Seguridad Digital",["Infantil","Primaria"],PAGE),
    act("Cyberscouts (INCIBE)","https://www.incibe.es/menores/juegos/cyberscouts/","Minijocs per ampliar coneixements de ciberseguretat","Seguridad Digital",["Primaria"],PAGE),
    act("Learn to Check","https://learntocheck.org/ca/","Claus per contrastar la desinformació i avaluar la fiabilitat","Seguridad Digital",["Secundaria"],PAGE),
    act("Interland: Reality River (Google)","https://beinternetawesome.withgoogle.com/en_us/interland/es-419/","Joc de Google per aprendre a navegar de manera segura a la xarxa","Seguridad Digital",["Primaria"],PAGE),
    act("Internet Segura.cat (YouTube)","https://www.youtube.com/user/Internetposahiseny","Col·lecció de vídeos per aprendre a navegar de forma segura","Seguridad Digital",["Primaria","Secundaria"],PAGE),
]

# ── canvi-climatic.html ─────────────────────────────────────────────────────
PAGE = "canvi-climatic.html"
new_activities += [
    act("Superherois per l'acció climàtica","https://lykio-dev-data.s3.eu-central-1.amazonaws.com/FTP/games/EU/values/index.html","Converteix-te en superheroi del medi ambient amb missions i jocs","Ciencias Naturales",["Primaria"],PAGE),
    act("Global Climate Change (NASA)","https://climate.nasa.gov/","Recurs de la NASA que explora el canvi climàtic, les seves causes i efectes","Ciencias Naturales",["Primaria","Secundaria"],PAGE),
    act("Així ens afecta el canvi climàtic (Greenpeace)","https://es.greenpeace.org/ca/trabajamos-en/cambio-climatico/asi-afecta-el-cambio-climatico/","Ones de calor, fenòmens meteorològics extrems i espècies invasores","Ciencias Naturales",["Primaria","Secundaria"],PAGE),
    act("Real-world costs of climate change (ImpactLab)","https://impactlab.org/","Mapes interactius per explorar com el canvi climàtic ens afectarà","Ciencias Naturales",["Secundaria"],PAGE),
    act("¿Qué es el cambio climático? (ONU)","https://www.un.org/es/climatechange/what-is-climate-change","Consulta les últimes investigacions de les Nacions Unides","Ciencias Naturales",["Secundaria"],PAGE),
    act("IPCC WGI Interactive Atlas","https://interactive-atlas.ipcc.ch/","Eina interactiva d'anàlisi sobre els efectes climàtics","Ciencias Naturales",["Secundaria"],PAGE),
    act("Earth Observatory (NASA)","https://earthobservatory.nasa.gov/global-maps","Col·lecció de mapes globals per estudiar el canvi climàtic","Ciencias Naturales",["Secundaria"],PAGE),
    act("Climate Time Machine (NASA)","https://climate.nasa.gov/interactives/climate-time-machine","Vídeos que mostren els efectes del canvi climàtic en els últims anys","Ciencias Naturales",["Primaria","Secundaria"],PAGE),
]

# ── taula-periodica.html ────────────────────────────────────────────────────
PAGE = "taula-periodica.html"
new_activities += [
    act("Configuració electrònica","https://felipsarroca.github.io/edu-apps/ConfiguracioElectronica2/","Mostra com s'omplen els orbitals d'un àtom i la seva posició a la taula periòdica","Ciencias Naturales",["Secundaria"],PAGE),
    act("Elemental Còmics","https://eboixader.github.io/Comic-Elements-v.2/","Descobreix la química a través del còmic i completa reptes sobre elements","Ciencias Naturales",["Secundaria"],PAGE),
    act("3D Visualization of Periodic Table","https://graphoverflow.com/graphs/3d-periodic-table.html","Visualització interactiva en 3D de la taula periòdica","Ciencias Naturales",["Secundaria"],PAGE),
    act("Discover Periodic Tables (IYPT)","https://iypt2019.org/discover-periodic-tables/","Recursos per explorar la taula periòdica dels elements","Ciencias Naturales",["Secundaria"],PAGE),
    act("Taula periòdica interactiva (Ptable)","https://ptable.com/?lang=ca#","Aprèn les propietats dels elements de manera interactiva en català","Ciencias Naturales",["Secundaria"],PAGE),
    act("Juga amb la taula periòdica","https://52gamespt.wordpress.com/category/catala/","Col·lecció de jocs sobre la taula periòdica dels elements","Ciencias Naturales",["Secundaria"],PAGE),
    act("La història de la taula periòdica (RSC)","https://www.rsc.org/periodic-table/history","Descobreix l'evolució i creixement de la taula periòdica","Ciencias Naturales",["Secundaria"],PAGE),
    act("Periodic Table Infographics","https://www.compoundchem.com/category/periodic-tables/","Col·lecció d'infografies basades en la taula periòdica","Ciencias Naturales",["Secundaria"],PAGE),
    act("Periodic Videos (TED-Ed)","https://ed.ted.com/periodic-videos","Un vídeo per a cada element de la taula periòdica","Ciencias Naturales",["Secundaria"],PAGE),
    act("The Periodic Table of the Elements","https://elements.wlonk.com/ElementsTable.htm","Coneix els elements químics amb dibuixos il·lustratius","Ciencias Naturales",["Secundaria"],PAGE),
]

# ── diccionaris.html ────────────────────────────────────────────────────────
PAGE = "diccionaris.html"
new_activities += [
    act("Termcat","https://www.termcat.cat/ca/diccionaris-en-linia/","Diccionaris terminològics agrupats en grans sectors temàtics","Lengua",["Secundaria"],PAGE),
    act("Enciclopèdia.cat","https://www.enciclopedia.cat/","Portal amb gran varietat de continguts de coneixement en llengua catalana","Lengua",["Primaria","Secundaria"],PAGE),
    act("Mira què dic! (Llengua de signes)","https://projectes.edigital.cat/signes/","Diccionari multimèdia de la llengua de signes catalana","Lengua",["Primaria","Secundaria"],PAGE),
    act("Diccionari de sinònims (IEC)","https://sinonims.iec.cat/","Útil per enriquir el vocabulari i expressar-se amb més precisió en català","Lengua",["Primaria","Secundaria"],PAGE),
    act("Diccionari.cat","https://www.diccionari.cat/","Eina essencial per consultar significats, conjugacions i usos correctes","Lengua",["Primaria","Secundaria"],PAGE),
    act("Didac - Diccionari escolar","https://www.diccionari.cat/didac","Diccionari escolar dissenyat específicament per a estudiants","Lengua",["Primaria"],PAGE),
    act("Diccionari català - valencià - balear","https://dcvb.iec.cat/","Recull el lèxic de les variants dialectals del català","Lengua",["Secundaria"],PAGE),
    act("El meu primer diccionari d'anglès","https://www.diccionari.cat/index-de-lamines","Eina pedagògica per introduir vocabulari bàsic d'anglès","Ingles",["Primaria"],PAGE),
    act("Diccionario de la lengua española (RAE)","https://dle.rae.es/?w=diccionario","Repertori ampli de termes i definicions actualitzades del castellà","Lengua",["Secundaria"],PAGE),
    act("DECAT (Etimologia catalana)","https://decat.iec.cat/veuredoc.asp?id=188068","Informació detallada sobre termes, la seva evolució històrica i variants","Lengua",["Secundaria"],PAGE),
    act("OnCat (Onomàstica)","https://oncat.iec.cat/entrada.asp","Portal per consultar definicions precises i classificacions semàntiques","Lengua",["Secundaria"],PAGE),
    act("Diccionari il·lustrat català - amazic","diccionaris/agora/dic/agora.html","Vocabulari bàsic amb il·lustració i pronunciació de paraules en amazic","Lengua",["Primaria","Secundaria"],PAGE),
    act("Diccionari il·lustrat català - àrab","diccionaris/catala_arab/index.htm","Vocabulari bàsic amb il·lustració i pronunciació de paraules en àrab","Lengua",["Primaria","Secundaria"],PAGE),
    act("Diccionari il·lustrat català - urdú","diccionaris/catala_urdu/index.htm","Vocabulari bàsic amb il·lustració i pronunciació de paraules en urdú","Lengua",["Primaria","Secundaria"],PAGE),
    act("Diccionari il·lustrat català - xinès","diccionaris/catala_xines/index.htm","Vocabulari bàsic amb il·lustració i pronunciació de paraules en xinès","Lengua",["Primaria","Secundaria"],PAGE),
]

# ── Merge i deduplicar ──────────────────────────────────────────────────────
with open("data/activities-edu365.json") as f:
    existing = json.load(f)

existing_urls = {a["url"].rstrip("/") for a in existing}
existing_ids  = {a["id"] for a in existing}

added = []
skipped = 0
for a in new_activities:
    url_norm = a["url"].rstrip("/")
    if url_norm in existing_urls:
        skipped += 1
        continue
    # Ensure unique ID
    base_id = a["id"]
    candidate = base_id
    counter = 2
    while candidate in existing_ids:
        candidate = f"{base_id}-{counter}"
        counter += 1
    a["id"] = candidate
    existing_ids.add(candidate)
    existing_urls.add(url_norm)
    added.append(a)

merged = existing + added

with open("data/activities-edu365.json", "w") as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)

print(f"Activitats existents: {len(existing)}")
print(f"Activitats noves afegides: {len(added)}")
print(f"Omeses (duplicades): {skipped}")
print(f"Total: {len(merged)}")
