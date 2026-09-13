# Verificatie van KosterBro’s v0.2

## Automatische speltests

`npm test` controleert de simulatie met normale acties, zonder onkwetsbaarheids- of scorehacks:

- Zes complete levels bij 30, 60 en 120 FPS, met alle drie medailles.
- Honderd seeds per level: alle uitdagingen haalbaar; geen herhaalde aangrenzende segmentvariant; segmenten van 8–12 seconden; voldoende tijd tussen obstakels; touwpickup vóór de bonusroute en vrije landing.
- Drie volledige runs per level zonder pickups, dubbeljump of BRO POWER.
- Dubbeljumpvoorraad, maximaal één extra sprong per vlucht, vastgrijpen en automatisch loslaten.
- Elke obstakelfamilie met juiste en verkeerde moves; springen/spinnen in beide invoervolgordes.
- Perfecte timing, power-upduur, vernieuwen, gecombineerd gebruik, energie, schade, schild en eindbonus.
- Pauze en hervataftelling bevriezen fysica en effecten.
- Gescheiden records, ontgrendeling en medailles per modus; migratie van v2 en klassiek record; beschadigde en geblokkeerde opslag.
- Onafhankelijke aanrakingen, loslaten/cancel en geen herhaalde actie bij vasthouden.
- Alleen combineren bij een combinatieobstakel, en de laatste gebruikte broer blijft vooraan.
- Drie discoboxen vereisen Beat Boost, leveren dezelfde 150 basispunten als de touwslinger op en kunnen veilig worden gemist.

Uitgevoerd op 12 september 2026: **55 tests geslaagd**, typecontrole en lint geslaagd. Productiebouw met Node.js 24.18 geslaagd. De build gebruikt de bestaande Vinext-export via de framework-API, zodat native opruiming op Windows niet door een geforceerde procesafsluiting wordt onderbroken.

## Browsercontroles

De browserfixture op `/?test=perfect` gebruikt normale spelacties bij echte speltijd. Hij verandert geen fysica, levens, punten of ontgrendeling. De runs gebruiken de normale start-, level- en resultaatknoppen. Testvoortgang blijft in het geheugen.

Gecontroleerd in de Codex-browser op Windows:

- Liggend 1024×768 en staand 768×1024: geen pagina-overflow; hoofdknoppen minimaal 112 pixels hoog.
- Rotatie pauzeert; speltijd en effecten blijven bevroren. Hervatten gebeurt met een nieuwe aftelling.
- Pauze toont alle drie doelen, huidige aantallen, reeds behaalde doelen en de mogelijkheid van een foutloze finish.
- De ontwikkelfixture doorloopt de echte React-aanraakhandlers met twee verschillende pointer-ID’s: alleen de eerste move werkt buiten een combinatieobstakel; loslaten en annuleren worden apart verwerkt.

Alle zes levels zijn achtereenvolgens in de browser uitgespeeld, met normale moves en echte speltijd. Iedere run eindigde met drie medailles en nul levensverlies. De console bevatte geen waarschuwingen of fouten.

| Level | Score | Hoge touwen | Voltooide discobonussen |
| --- | ---: | ---: | ---: |
| Survivalpark | 12.250 | 0 | 0 |
| Boven de bomen | 10.000 | 5 | 0 |
| Beat Street | 15.725 | 1 | 1 |
| Bouwplaats Bounce | 15.400 | 1 | 3 |
| Neon Mix | 21.375 | 1 | 2 |
| Naar het feest! | 37.575 | 1 | 2 |

Tieme’s blijvende positie vooraan, de drie gekleurde boxen, windmill-spin, neonlampen en bonusreactie zijn ook visueel gecontroleerd.

## Statische productie-uitvoer

`npm run build` maakt `dist/client`, de publicatiemap uit de ongewijzigde Netlify-configuratie. `npm start` serveert uitsluitend die bestanden. HTML, alle acht gekoppelde assets, verversen via de index-fallback en foutafhandeling voor ontbrekende assets zijn gecontroleerd. De ontwikkeltestfixture komt niet in de productiecode terecht.

De productiepagina is ook werkelijk geopend en ververst in de browser. Samenmodus, levelselectie, starten, verliezen, opnieuw proberen, hulp openen/sluiten, geluidsknop en het pauzedoel na levensverlies werken; de console bleef schoon. Een record van 350 in Samen verscheen niet in Alleen en bleef na verversen bewaard in Samen. De fullscreenknop is getest: de ingebouwde browser schakelde niet naar fullscreen, maar de game bleef normaal werken.

## Beperkingen

Browserformaten simuleren de afmetingen van tablets; fysieke iPad- en Android-apparaten zijn niet beschikbaar in deze werkplek. Echte hardwareprestaties en browserafhankelijke fullscreenondersteuning kunnen daardoor niet voor ieder apparaat worden bevestigd.
