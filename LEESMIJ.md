# KosterBro's — The Birthday Quest

Een persoonlijk verjaardagsspel voor Epke (12, survivalrun) en Tieme (10, breakdance).

**Tablet eerst:** speel met de grote groene knop links en paarse knop rechts. Het spel vult tijdens een run het scherm; draaien pauzeert automatisch. Voor spelen op een tablet via je eigen wifi: zie de stappen onder "Op een tablet" in **README.md** (`npm run tablet`).

## Spelen

Dubbelklik op **START-SPEL.cmd**. De browser opent zodra het spel klaarstaat. Houd het startvenster open tijdens het spelen. Staat het spel al aan, dan opent de bestaande versie.

Op deze computer zijn alle onderdelen al geïnstalleerd. Je kunt ook rechtstreeks naar **http://localhost:3000/** zolang het spel draait.

Op een andere computer: installeer Node.js 22.18 of nieuwer, voer in deze map één keer `npm install` uit en start daarna met `npm run dev -- --port 3000`. Om de meegeleverde tests te draaien is Node.js 22.18 of nieuwer nodig. Het spel gebruikt na installatie geen externe beelden, lettertypen, muziek, accounts of internetverbinding.

## Besturing

| Actie | Toetsen / bediening |
|---|---|
| Start | Enter of LET'S GO! |
| Epke springt | Spatie / ↑ / W / groene knop |
| Tieme spint | X / ↓ / S / paarse knop |
| Pauze / verder | Escape / P / pauzeknop |
| Geluid | M / luidspreker |
| Volledig scherm | Knop rechtsonder in het spel |

De broers rennen vanzelf. Een actie wisselt automatisch naar de juiste broer. Druk voor elke hindernis opnieuw; vasthouden herhaalt de actie niet.

Spring over boomstammen en pak de gouden touwringen. Spin door de paarse beatblokken. Pak sterren, bouw een combo op en haal in 90 seconden het verjaardagsfeest. Jullie delen drie levens. Vanaf drie geslaagde hindernissen stijgt de puntenvermenigvuldiger; bij elke zesde krijg je vijf seconden een schild. De finish levert 1.000 punten plus 250 per overgebleven leven op. Je record en geluidsvoorkeur worden alleen in deze browser bewaard.

## Aanpassen

- **game/settings.ts** — belangrijkste spelinstellingen: rondeduur, levens, snelheid, sprongkracht, zwaartekracht, spin, schild, punten en namen van de drie gebieden.
- **game/core.ts** — parcoursopbouw, botsingen, combo’s, score en winst/verlies. De eerste twee hindernissen leren springen en spinnen aan; het verdere parcours heeft een vaste seed zodat je het kunt leren.
- **game/renderer.ts** — bewegende spelwereld, personages, hindernissen, effecten en kleuren.
- **game/audio.ts** — originele gesynthetiseerde beat en geluidseffecten.
- **app/page.tsx** en **app/globals.css** — schermen, knoppen, teksten en vormgeving.
- **public/keyart.png** — originele startschermillustratie.

## Ontwikkelen en controleren

`npm run dev -- --port 3000` start de lokale ontwikkelversie. `npm run check` controleert de types, `npm test` test de volledige spelregels, `npm run build` maakt de productieversie. `npm run lint` controleert de broncode.

Voor een reproduceerbare browsertest kun je in de ontwikkelversie `http://localhost:3000/?test=perfect` openen en op start drukken. De testfixture geeft op vaste tijden de normale spring- en spinacties; physics, score en tijd blijven gelijk. Deze testfixture is uitgesloten van de productieversie. De normale URL heeft geen automatische besturing.

Alles blijft lokaal. De game is niet online gepubliceerd.

