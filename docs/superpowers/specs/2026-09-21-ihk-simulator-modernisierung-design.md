# IHK-Simulator: sichere Modernisierung

## Ziel

Die vorhandene Lernanwendung wird technisch und inhaltlich verlässlicher, ohne bestehende Prüfungen, gespeicherte Fortschritte oder vertraute Arbeitsabläufe zu beschädigen. Die Modernisierung bleibt evolutionär: bestehende Datenformate und globale Einstiegspunkte bleiben kompatibel, während neue, isoliert testbare Hilfsmodule eingeführt werden.

## Erfolgsbedingungen

- Alle zehn Prüfungen behalten 100 BE und bestehen weiterhin tools/check.py.
- Vorhandene Exportdateien der Versionen 1 bis 3 bleiben importierbar.
- Der Modus „alles ersetzen“ entfernt tatsächlich alte, nicht importierte App-Daten.
- Derselbe Export kann nicht versehentlich mehrfach auf dieselben Summenzähler addiert werden.
- AP2-, Vertiefungs- und veraltete Themen sind im Kompendium klar gekennzeichnet.
- Leere Musterantworten werden nicht als fertige Lösungen dargestellt.
- Der Startbildschirm bleibt funktional identisch, wird aber übersichtlicher, responsiver und zugänglicher.
- Die Prüfungsauswahl, Generatoren, Karteikarten, Archiv, Export, Offline-Download und PWA funktionieren weiterhin.
- JavaScript läuft weiterhin ohne Build-Schritt und ohne neue externe Laufzeitabhängigkeiten.

## Gewählter Ansatz

### Evolutionäre Modernisierung

Dieser Ansatz wird umgesetzt. Kritische Logik wird aus dem großen Inline-Skript in kleine, browser- und Node-kompatible Module verschoben. Die bestehende UI wird nicht ersetzt, sondern erhält eine zusätzliche Design-Schicht und eine besser strukturierte Startansicht.

Vorteile:

- geringstes Regressionsrisiko;
- alte lokale Daten bleiben nutzbar;
- jede Änderung kann einzeln getestet und zurückgenommen werden;
- kein Framework- oder Build-Zwang.

### Nicht gewählt: kompletter SPA-Neubau

Ein Neubau mit React, Vue oder Svelte könnte die Modulstruktur verbessern, würde aber gleichzeitig Speicherung, Service Worker, Druckansichten, Generatoren und mehr als 50 Erweiterungen migrieren müssen. Das Risiko steht für eine persönliche Lernanwendung nicht im Verhältnis zum Nutzen.

### Nicht gewählt: rein kosmetische Überarbeitung

Nur CSS zu ändern würde die bestätigten Fehler in Import, Lerninhalten und Statistik nicht lösen.

## Datenintegrität

Ein neues Modul gen/storage-tools.js kapselt reine Operationen:

- Auswahl aller App-Schlüssel mit Präfix ihk2:;
- vollständiges Ersetzen eines Speichers;
- Erzeugen eines stabilen Fingerprints für einen Import;
- Prüfung, ob eine Sicherung bereits zusammengeführt wurde;
- Zusammenführung von Listen ohne Duplikate.

Vor dem Modus „ersetzen“ werden ausschließlich Schlüssel mit App-Präfix entfernt. Fremde localStorage-Daten bleiben unangetastet.

Für Version 4 des Exports wird eine eindeutige backupId gespeichert. Nach einer Zusammenführung wird sie in ihk2:import-history vermerkt. Ein erneuter Import derselben Sicherung bietet keine zweite Addition der Statistik. Alte Sicherungen ohne ID erhalten einen stabilen Fingerprint aus ihrem Inhalt. Damit bleibt die Kompatibilität mit Version 3 erhalten.

## Lerninhalte

gen/kompendium-status.js enthält eine zentrale Statuskarte. Sie unterscheidet:

- ap1: aktueller AP1-Kern;
- ap2: laut aktualisiertem Katalog in Teil 2;
- vertiefung: weiterhin fachlich sinnvoll, aber nicht AP1-Kern;
- historisch: nur für ältere Prüfungen.

SQL, RAID, PAP und Struktogramm werden als AP2/historisch markiert. Erweiterte Virtualisierungsthemen wie Hypervisor-Typen, Container sowie IaaS/PaaS erhalten den Hinweis „Vertiefung/AP2“, während virtuelle Desktops, SaaS und DaaS im AP1-Kontext bleiben.

Leere Musterantworten werden durch einen Validator erkannt. Im UI erscheint statt einer leeren Lösung ein neutraler Hinweis, dass für diese Übung noch keine Musterantwort gepflegt ist. Dadurch wird kein erfundener Inhalt ergänzt.

## Fortschritt und Bewertung

Die Anzeige trennt künftig:

- Trefferquote bewertet: Punkte geteilt durch die maximalen Punkte der bereits bewerteten Aufgaben;
- Prüfungsstand: Punkte geteilt durch 100 beziehungsweise alle BE der Prüfung.

Eine Schulnote wird nur als Zwischenstand bezeichnet, solange Aufgaben offen sind. Mehrfach getaggte Aufgaben teilen ihre Punkte gleichmäßig auf die zugeordneten Themen, damit die Summe der Themenwerte nicht größer als das Prüfungsergebnis werden kann.

Die automatische Freitext- und Folgefehlerbewertung bleibt funktional unverändert. Sichtbare Texte bezeichnen sie ausdrücklich als Trainingsheuristik und bieten weiterhin die manuelle Selbstbewertung.

## Oberfläche und Dashboard

Die visuelle Richtung lautet „ruhiges Lerncockpit“:

- heutige Hauptaktion zuerst;
- vier kompakte Kennzahlen statt vieler gleichgewichteter Blöcke;
- klare Gruppen „Heute“, „Prüfungen“, „Üben“, „Nachschlagen“;
- weniger harte Rahmen, konsistente Radien und Abstände;
- Status wird nicht nur über Farbe vermittelt;
- bestehende IHK-blau/rot-Farbwelt bleibt erhalten;
- Dunkelmodus bleibt voll unterstützt.

Die Prüfungskarten bleiben echte Inhaltscontainer mit höchstens drei primären Aktionen. Auf kleinen Bildschirmen sind wichtige Ziele mindestens 44 × 44 CSS-Pixel groß. Sekundäre Bereiche verwenden natives details/summary, damit Tastaturbedienung und Semantik ohne zusätzliche JavaScript-Abhängigkeit funktionieren.

Die Startseite erhält einen echten, dauerhaft befüllten h1. Alle Formularfelder erhalten programmatisch verknüpfte label. Die PIN-Oberfläche wird als modaler Dialog mit aria-modal, beschreibendem Titel, aria-live-Fehlerbereich, Fokusführung und Rückgabe des Fokus umgesetzt.

## PWA und Offline-Verhalten

Die Installationsbeschreibung verspricht nur, was technisch garantiert wird: App-Oberfläche und bereits geladene Inhalte funktionieren offline; Bildmaterial eines ganzen Examens ist nach explizitem Offline-Download verfügbar.

Der Service Worker erhält eine neue Version, damit geänderte HTML-, CSS- und JavaScript-Dateien zuverlässig ausgerollt werden. Die bestehende Strategie und der begrenzte Bildercache bleiben erhalten.

## Teststrategie

Neue Node-Tests prüfen reine Module ohne Browser:

- Ersetzen entfernt alte App-Schlüssel, aber keine fremden Daten.
- Doppelter Merge derselben Sicherung verändert Summen nicht erneut.
- Listenmerge bleibt dedupliziert.
- Themenpunkte werden auf mehrere Tags verteilt.
- Katalogstatus erkennt AP2-/Vertiefungsthemen.
- Kompendium-Validator meldet leere Musterantworten und unzulässige AP1-Aussagen.

Ein Browser-Smoke-Test prüft:

- keine Console- oder Runtime-Fehler;
- Startseite und erster Prüfungsbogen rendern;
- Speichern eines Antwortfeldes;
- Importdialog;
- keine horizontale Überbreite auf Desktop und Mobil;
- alle sichtbaren Eingaben haben zugängliche Namen.

Nach jeder Arbeitsphase laufen außerdem tools/check.py, gen/test2.js bis gen/test5.js, Syntaxprüfungen für JavaScript, Python und JSON sowie ein Git-Diff-Review.

## Migrations- und Sicherheitsgrenzen

- Es werden keine Benutzerdaten automatisch gelöscht.
- Die bestehende PIN-Funktion wird sichtbar als lokale Gerätesperre bezeichnet. Sie wird nicht als echte Zugriffskontrolle dargestellt.
- Es werden keine externen Frameworks oder Trackingdienste eingeführt.
- Quellen- und Rechtehinweise werden ergänzt, vorhandene Prüfungsabbildungen aber nicht entfernt.
- Tiefgreifende Umstellung aller globalen Erweiterungspunkte erfolgt nicht in diesem Schritt; stattdessen wird für neue Funktionen ein kleines Event-System eingeführt, ohne alte Hooks abzuschalten.
