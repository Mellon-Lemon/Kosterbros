# KosterBro’s — Samen naar het feest · v0.2

Een tabletgame voor Epke (12, survivalrun) en Tieme (10, breakdance). Zes vrijspeelbare levels van 60–90 seconden, samen op één tablet of alleen met twee duimen.

![KosterBro’s](public/keyart.png)

## Starten

Vereist Node.js 22.18 of nieuwer.

```sh
npm ci
npm run dev -- --port 3000
```

Open **http://localhost:3000/**. Op Windows kun je ook dubbelklikken op **START-SPEL.cmd**. De spelonderdelen moeten dan al geïnstalleerd zijn.

Voor een tablet op hetzelfde wifinetwerk: start `npm run tablet` en open `http://<IPv4-adres-van-de-computer>:3000` op de tablet. Houd het servervenster open. Sta indien nodig alleen toegang op je privénetwerk toe.

## Zo speel je

Kies Alleen of Samen, kies een vrijgespeeld level en haal de finish met minstens één van de drie teamlevens. Uitspelen opent het volgende level. Iedere nieuwe run heeft andere, zorgvuldig samengestelde parcoursstukken. Eerdere levels blijven beschikbaar.

- **Groen links — Epke:** spring over stammen. Een verzamelde **↑↑** geeft één extra sprong na een nieuwe tik in de lucht. Maximaal één lading en één extra sprong per vlucht. De hoge touwen grijp je automatisch; ze zijn altijd een optionele bonusroute.
- **Paars rechts — Tieme:** spin door beats en onder lage balken. Een spin vlak vóór contact met een beat geeft vanaf level 3 PERFECT. Pak Beat Boost vóór de drie gekleurde discoboxen: één goed getimede spin breekt ze alle drie, met discomuziek en neonlicht. De bonus is 150 basispunten, evenveel als Epke’s hoge touwslinger; beide routes hebben bovendien vier sterren.
- **BRO POWER in het midden:** goede moves vullen vanaf level 3 de meter. Bij 100% geeft één tik vijf seconden bescherming en dubbele spelpunten. Tijdens die vijf seconden verdien je geen nieuwe energie.
- **Samen:** Epke bedient links, Tieme rechts. Iedereen mag BRO POWER activeren. Jullie delen één parcours, score en levens. Samen spelen heeft eigen vrijgespeelde levels, medailles en records.
- **Alleen:** dezelfde regels, beide knoppen zelf bedienen.

De broer van de laatste uitgevoerde move blijft vooraan. Springen en spinnen combineren kan alleen bij het gecombineerde obstakel met stam en woofer. Daar werken beide aanraakvolgordes. Elders wordt de tweede move tijdens de eerste actie geweigerd: beide knoppen tegelijk indrukken is dus geen oplossing voor ieder obstakel.

Toetsenbord: **spatie / ↑ / W** springt, **X / ↓ / S** spint, **B** activeert BRO POWER, **Esc / P** pauzeert, **M** schakelt geluid, **Enter** start het geselecteerde level. Vasthouden herhaalt geen acties.

Draaien, appwisselen en uitleg openen pauzeren de run. Hervatten geeft twee tellen voorbereiding; effecten en beweging staan ondertussen stil. Volledig scherm is optioneel en afhankelijk van de browser.

## Levels en medailles

| Level                |    Duur | Vaardigheidsmedaille        |
| -------------------- | ------: | --------------------------- |
| 1. Survivalpark      | 60 sec. | Vier lage touwringen        |
| 2. Boven de bomen    | 65 sec. | Drie hoge touwen            |
| 3. Beat Street       | 70 sec. | Vier perfecte spins         |
| 4. Bouwplaats Bounce | 75 sec. | Vier lage doorgangen        |
| 5. Neon Mix          | 80 sec. | Drie spring-spincombinaties |
| 6. Naar het feest!   | 90 sec. | Tweemaal BRO POWER          |

Elk level heeft daarnaast een finishmedaille en een medaille voor finishen zonder levensverlies. Het pauzemenu toont alle drie sterdoelen, je huidige voortgang en eerder behaalde sterren in de gekozen modus. Een herstelhart maakt eerder levensverlies niet ongedaan voor die medaille. Behaalde medailles blijven bewaard, ook als een volgende run minder goed gaat.

## Zes power-ups

| Pickup            | Effect                                               |
| ----------------- | ---------------------------------------------------- |
| ↑↑ Dubbeljump     | Eén extra luchtsprong; blijft klaarstaan tot gebruik |
| ◇ Schild          | Vangt één botsing op, maximaal 8 seconden            |
| U Sterrenmagneet  | Verzamelt nabije sterren, 8 seconden                 |
| ×2 Dubbele punten | Dubbele spelpunten, 8 seconden                       |
| ♫ Beat Boost      | Langere spins met kortere cooldown, 6 seconden       |
| ♥ Herstelhart     | Eén leven terug, maximaal drie                       |

Verschillende effecten kunnen tegelijk werken. Dezelfde pickup vernieuwt zijn duur zonder deze op te tellen. De magneet verzamelt uitsluitend sterren. BRO POWER en dubbele punten verdubbelen samen maar één keer; de combomultiplier werkt daar wel bovenop. Eindbonussen worden niet verdubbeld. Een volle dubbeljumpvoorraad geeft 50 basispunten bij een extra pickup; een hart bij volle levens geeft 100 basispunten.

## Voortgang en privacy

Alles werkt zonder accounts, externe spelservices of online ranglijst. Records, ontgrendeling en medailles zijn apart voor Alleen en Samen. De browser bewaart dit lokaal onder `kosterbros.progress.v3`; het oude record blijft apart zichtbaar als klassiek record. Bestaande gedeelde v2-voortgang wordt eenmalig in beide modi overgenomen, zodat eerder behaalde resultaten behouden blijven. Daarna groeien de modi onafhankelijk. De bestaande geluidsvoorkeur blijft bewaard.

Bij beschadigde of geblokkeerde opslag blijft de game speelbaar. Voortgang geldt voor deze browser op dit apparaat en dit websiteadres; hij verhuist niet automatisch naar een andere tablet of website.

## Belangrijkste instellingen

| Bestand                              | Aanpassen                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------- |
| `game/settings.ts`                   | Sprongkracht, spintiming, power-upduur, energie, levens en punten         |
| `game/levels.ts`                     | Zes levels, duur, snelheid, thema, uitdagingen en beschikbare pickups     |
| `game/course.ts`                     | Zes segmentvarianten per level, volgorde, touwen en veilige tussenruimtes |
| `game/core.ts`                       | Simulatie, botsingen, touwslingeren, effecten, combo’s en medailles       |
| `game/progress.ts`                   | Lokale opslag, migratie, records en ontgrendeling                         |
| `game/engine.ts`                     | Spelloop, toetsenbord, pauze, voortgang en browsertools                   |
| `game/renderer.ts` / `game/audio.ts` | Canvaswereld, broers, animaties en gesynthetiseerd geluid                 |
| `app/page.tsx` / `app/globals.css`   | Nederlandse schermen, aanraakbediening en tabletindeling                  |

## Controleren

```sh
npm test
npm run check
npm run lint
npm run build
npm start
```

De tests controleren alle zes levels bij 30, 60 en 120 FPS, honderd seeds per level, haalbare uitdagingen, veilige segmentovergangen en runs zonder power-ups. Ook dubbeljump, touwen, actievolgorde, verkeerde moves, effectinteracties, pauze en opslag worden gecontroleerd.

Voor browser-QA: open in de ontwikkelversie **/?test=perfect**. De knop bovenaan schakelt automatische normale moves in/uit. **QA: zes levels** doorloopt achtereenvolgens alle levels. **QA: twee vingers** controleert de echte aanraakhandlers met twee afzonderlijke pointer-ID’s. Je kunt ook starten via de gewone spelknoppen. De fixture gebruikt echte speltijd en verandert geen fysica, score of ontgrendelregels. Testrecords blijven alleen in het geheugen; de fixture ontbreekt in de productieversie. Gebruik voor zelf spelen de gewone URL zonder testparameter.

Zie `TESTING.md` voor de daadwerkelijk uitgevoerde controles en beperkingen.

## Publiceren op Netlify

De bestaande `netlify.toml` gebruikt **npm run build**, **Node.js 22.18** en **dist/client**. `next.config.ts` exporteert de game als statische website. Er zijn geen omgevingsvariabelen, accounts, databases of serverfuncties nodig. Koppel de bestaande GitHub-repository aan je Netlify-site; er wordt geen nieuwe hostingdienst aangemaakt.

Controleer de productie-uitvoer lokaal met `npm start` op **http://localhost:4173/**. Deze preview serveert uitsluitend de gebouwde bestanden, met dezelfde fallback naar index.html. Ook verversen moet blijven werken.

## Beelden

`public/keyart.png` is de bestaande originele illustratie voor Epke en Tieme. Het bewegende spel, levelkaartillustraties en muziek worden lokaal getekend en gesynthetiseerd. Zie `ART.md` voor de oorspronkelijke illustratiebrief.
