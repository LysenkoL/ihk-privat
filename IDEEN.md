# Что дальше: идеи и готовые ТЗ для Claude Code

Состояние на 02.09.2026 (вечер). Отсортировано по пользе для сдачи, а не по красоте.
Блоки **«Промпт»** копируются в Claude Code как есть, запускать из папки `ihk-sim`.

---

## Что сделано

- 10 экзаменов 2021–2026, 279 Teilaufgaben, баллы и эталоны у всех
- пометка тем, вычеркнутых из каталога ab 2025 (21 задание, 87 BE), с фильтром
- раздел «Lücken im Katalog»: 10 новых тем каталога вообще не покрыты сборкой
- Netzplan-Trainer: случайные планы с настоящими буферами + свой план строкой
- генератор UML-Aktivitätsdiagramm и UML-Klassendiagramm: случайная
  Ausgangssituation, проверка нотации и содержания, эталон рисуется в SVG
- 173 флешкарты из решений, экспорт в Anki
- офлайн-сверка ответа по числам и терминам, с предложением балла
- задания-таблицы разбиты на отдельные поля (24 штуки)
- экспорт/импорт прогресса, печать бланка
- тренировка по темам, статистика слабых мест, поиск, тёмная тема
- **генератор заданий** (`gen/`, 02.09): 55 типов заданий в 11 темах,
  каждое с новыми числами при каждом клике и автопроверкой — счёт, термины,
  таблицы, зуорднунг, richtig/falsch и узлы Aktivitätsdiagramm.
  Отдельная проверка на «одно слово вместо предложения» у Erläutern/Begründen.
  Мастер выбора тем, «Neu würfeln» у каждого задания, статистика по типам
- **Prüfungsbogen im Drucklayout** (`gen/druck.js`): титульный лист, колонка BE,
  линии по числу баллов, пустые таблицы, клетчатые поля для диаграмм,
  отдельный Lösungsbogen. Печать через браузер в PDF
- **Papiermodus**: секундомер + ввод баллов после решения на бумаге, расчёт
  «минут на BE» и пересчёт на 100 BE / 90 минут
- **ER-Modell, Use-Case и Klassendiagramm как задания на построение**
  (`gen/vorlagen-modelle.js`): таблица модели с проверкой по строкам,
  относительная схема с Fremdschlüssel, Datentypen, Multiplizitäten
- **Проблемные типы из практики** (`gen/vorlagen-problemfaelle.js`):
  laufende Kosten pro Monat, Gesamtkosten mit Ersatzbeschaffung,
  Energie-Amortisation, ipconfig-Diagnose, Pseudocode über Datensätzen
- **Общая статистика** (`gen/gesamt.js`): вес темы из экзаменов × квота из
  экзаменов и генератора вместе, прогноз баллов из 100, кнопка «üben» по теме
- **Диаграммы в экзаменационных заданиях** (`gen/exam-diagramme.js`):
  тип распознаётся по тексту, вместо textarea таблица, плюс переход
  на тот же тип в генераторе с автопроверкой
- **Satzbau-Training** (`gen/satzbau.js` + `satzbausteine.js`): 51 карточка,
  проверка на Fachbegriff / Begründung / Länge / ganzer Satz, B2-Musterantworten
- **Formelblatt A4** (`gen/formeln.js`): 78 формул и ловушек, печать в PDF
- **Новая структура тем + мастер без ограничений** (04.09): 10 главных тем как в
  коммерческих тренажёрах, все галочки стоят по умолчанию, ограничения «максимум
  3 темы» больше нет. Выбор идёт от количества заданий; есть режим «Zufall —
  всё из всех тем» и кнопка «nur meine Schwächen». Подтемы раскрываются
  и отключаются поштучно
- **Четыре недостающих типа таблиц** (`gen/vorlagen-tabellen.js`):
  IP-Konfigurationstabelle, Backup-Wochenplan (differenziell/inkrementell
  с расчётом лент для восстановления), Fehleranalyse Symptom → Ursache →
  Maßnahme, Berechtigungsmatrix (Rolle × Ressource)
- **38 новых типов заданий** по списку тем из тренажёра
  (`vorlagen-sicherheit.js`, `vorlagen-hardware.js`, `vorlagen-fachthemen.js`):
  Malware, Härtung, PKI, Kryptographie, Protokollierung, Zutrittskontrolle,
  Schutzbedarfsanalyse, VPN, ARP, DHCP, EUI-64; CPU, RAM, USB, Video, Netzteil,
  RFID/NFC, Speichermedien, Betriebssysteme; Normalisierung, Relationenmodell,
  SQL, Programmiersprachen, Webtechnologien; Marktformen, Darlehen,
  Kostenrechnung; JBOD, Dateiformate; SMART, Stakeholder, Anforderungen,
  Make-or-Buy; Arbeitsrecht, Vertragsarten. **Итого 101 тип**
- **Поле для хода расчёта + Folgefehler** (`kern.js`, `blatt.js`, 04.09):
  у 35 расчётных типов поле «Rechenweg», промежуточные значения тянутся из
  эталонного решения, цепочка показывает первое расхождение, при верном ходе
  и неверном итоге — половина баллов, как у настоящего корректора. Поле есть
  и в печатном бланке
- **Операторы IHK** (`gen/operatoren.js`): под каждым текстовым полем
  раскрывашка «что требует Erläutern / Begründen / Beurteilen», ловушка и
  кликабельные каркасы фраз; отдельный лист A4 на печать
- **Fehlerjournal** (`gen/fehlerjournal.js`, 05.09): eine Zeile je Aufgabe,
  sechs Gründe per Klick, Grund wird oft automatisch geraten, Auswertung über
  21 Tage mit dem Satz „X % deiner Fehler sind kein Wissensproblem“
- **Rechenweg in den echten Prüfungen** (`gen/exam-rechenweg.js`): 37 von 43
  Rechenaufgaben (158 BE) bekommen ein Rechenweg-Feld, Zwischenwerte aus der
  Musterlösung, Bruchstelle wird markiert
- **Simulation kalibriert**: Klickanteil je Vorlage gemessen, Auswahl
  gewichtet (21 % → 12 %), nach der Abgabe ehrliche Hochrechnung auf den
  Prüfungsmix (2 % Ankreuzen)
- **Export nimmt den Generator mit** (`gen/fortschritt.js`): Blätter, Quoten,
  Satzbau und Fehlerjournal wandern in die Datei — damit ist der Stand auch
  auf dem Handy verfügbar
- **KI und Kommunikation** (`gen/vorlagen-ki.js`): die letzten beiden
  Prüfungsthemen ohne Aufgaben, 6 neue Vorlagen. **Jetzt 107 Typen**
- **Prüfungssimulation 90 минут** (`gen/simulation.js`): лист по измеренному
  распределению десяти экзаменов (Kalkulation 24 BE, Netzwerke 16, Hardware 11 …),
  100 BE ± 5, обратный отсчёт, решения заблокированы до сдачи, автосдача по
  истечении времени, разбор по времени после
- **Версия для телефона** (`gen/mobil.css` + `gen/mobil.js`): шапка в одну
  строку, кнопки по две в ряд, поля ввода 16 px (иначе iOS зумит), широкие
  таблицы прокручиваются внутри себя с подсказкой «seitwärts wischen»,
  колонка баллов уходит вниз. Проверено на 390 × 844 — страница вбок не уезжает
- **Spickzettel — der ganze Stoff** (`gen/spick.js`, `gen/spick-daten.js`, `gen/spick.css`, 12.09):
  весь материал AP1 структурирован в 20 глав (формат экзамена, операторы,
  диаграммы, формулы и расчёты, сети, IT-безопасность, базы данных и др.).
  Полнотекстовый поиск по всем главам с подсветкой совпадений, адаптивная
  навигация с поддержкой мобильных устройств и тёмной темы, запоминание
  позиции чтения, интеграция в стартовый экран и ярлыки PWA
- **AP1-Kompendium — 52 FIAE-Themen** (`gen/kompendium.js`, `gen/kompendium-daten.js`,
  `gen/kompendium.css`, `gen/komp/*.js`, `assets/kompendium/`, 13.09):
  52 подробные страницы подготовки из коллекции Notion, распределённые по 7 областям
  AP1 (плюс общие темы). Динамическая подгрузка страниц без утяжеления стартовой
  страницы, полнотекстовый поиск с подсветкой совпадений, иллюстрации и схемы,
  адаптивный интерфейс для телефона и ПК
- **Service Worker v6 / v7** (`sw.js`): обновление версии кэша приложения до
  `ihk-ap1-v7-app`, поддержка фонового обновления модулей Kompendium и кэширования
  изображений
- **Lernstand, Bildlupe & Touch-Ziele (44 px)** (`gen/kompendium.js`, `gen/fortschritt.js`,
  `gen/mobil.css`, 13.09):
  отслеживание личного прогресса по темам компендиума (neu / verstanden / wiederholen)
  с фильтром повторения «↻ nochmal», просмотр картинок и схем в полном размере
  (лайтбокс), увеличение кнопок до 44 px на мобильных экранах под палец, экспорт/импорт
  прогресса изучения тем компендиума
- **Zugangsschutz (PIN 2026 / Magic-Link)** (`gen/auth.js`, `gen/auth.css`, 13.09):
  защита от посторонних: экран ввода 4-значного PIN-кода (2026) с проверкой хэша SHA-256,
  тихая однократная авторизация через секретную ссылку `?key=2026` с постоянным
  сохранением в `localStorage` (владелец пользуется как раньше без лишних окон)
- **Lesemodus & Tabellen-Großansicht (⤢)** (`gen/kompendium.js`, `gen/kompendium.css`, 13.09):
  динамический режим чтения с автоскрытием шапки при скролле вниз (+60 px рабочей
  высоты на смартфонах), кнопка «⤢ Tabelle groß» у всех таблиц Компендиума и
  Шпаргалки с полноэкранным просмотром
- **Interaktive Tabellen aus Aufgaben-Texten** (`gen/tabellen.js`, `gen/tabellen.css`, 14.09):
  текстовые таблицы с разделителями (|) из заданий экзаменов автоматически преобразуются
  в реальные <table> с полями ввода для пустых ячеек и вопросительных знаков (?),
  карточный режим на узких экранах смартфонов
- **Service Worker v10 – v17** (`sw.js`): обновление версии кэша приложения до
  `ihk-ap1-v17-app`
- **Einheiten & Umrechnungen** (`gen/vorlagen-einheiten.js`, 15.09):
  7 новых генераторов задач с вариативными числами: Brutto/Netto, Umsatzsteuer 19 % / 7 %,
  Vorsätze (mA, kW, MB/s, µs), P = U · I, W = P · t, USV-Auslegung, Bezugspreis/Skonto/Rabatt.
  **Итого 114 типов заданий в генераторе**
- **Auftrags-Analyse («Was will die Aufgabe eigentlich?»)** (`gen/auftrag.js`, `gen/auftrag.css`, 16.09):
  автоматический анализ формулировки задачи на число требуемых пунктов и операторы
  («Nennen Sie drei …», «Erläutern Sie …»), цветовая индикация полноты ответа в реальном
  времени, напоминание о заключительном предложении с числом и единицей измерения для расчётов
- **Chen-Notation & ER-Modell-Editor** (`gen/er.js`, `gen/er-daten.js`, `gen/er.css`, 16.09):
  интерактивное построение ER-моделей в двух таблицах (Entitäten и Beziehungen с поддержкой
  n:m и собственных атрибутов связи) с живой генерацией SVG-схемы в нотации Чена и сверкой решений
- **Gantt-Diagramm-Trainer** (`gen/gantt.js`, `gen/gantt-daten.js`, `gen/gantt.css`, 17.09):
  ввод таблицы Vorgangsliste с автоматическим расчётом сроков (Tag 1..N, Dauer, Abhängigkeiten),
  критического пути, свободных/общих буферов (GP, FP) и синхронной отрисовкой полос диаграммы Ганта
- **Rechenaufgaben als eigener Bereich** (`gen/rechnen.js`, `gen/rechnen.css`, 17.09):
  единый каталог всех расчётных задач экзаменов (~40 задач, 158 BE) с фильтрацией по темам,
  нерешённым и случайным подборкам
- **Handgriffe & Lesezeichen** (`gen/handgriffe.js`, `gen/handgriffe.css`, 17.09):
  запоминание позиции скролла для каждого экзамена, плашка «Weiter, wo ich war» на стартовом
  экране, интерактивная Sprungleiste по заданиям с индикацией статуса ответа, индикатор офлайн-режима
- **Druckbogen-Optimierung** (`gen/druckbogen.js`, `gen/druckbogen.css`, 18.09):
  интеллектуальный постраничный перенос без разрыва условий и пустых хвостов, раскрытие
  ответов из textarea в полный текст или разлинованные поля по количеству BE, подгрузка lazy-изображений
- **Intelligente Wiederholung im Lernplan** (`gen/plan.js`, `gen/blatt.css`, 18.09):
  учёт даты последнего повторения тем (Dämpfung свежепройденного материала), раскрывающийся
  список «Was ist eigentlich noch offen?» с весами тем и возможностью мгновенного запуска,
  фиксация истории выполненных тем
- **Versionsanzeige & Update-Knopf** (`gen/version.js`, 18.09):
  отображение номера версии (Fassung ihk-ap1-v19) и даты/времени загрузки внизу стартовой страницы,
  кнопка «nach Update suchen» для принудительного обновления Service Worker и моментального перезапуска
- **Endspurt-Lernplan (die letzten 14 Tage)** (`gen/endspurt.js`, `gen/endspurt.css`, 19.09):
  фиксированный расписанный план на финальные две недели перед экзаменом: чередование
  пробного экзамена (90 мин на бумаге + сразу разбор) и точечного закрытия выявленных пробелов,
  отдельные дни для сквозных расчётов, персонального памятного листа, Satzbau и чек-листа
- **Eigenes Merkblatt A4** (`gen/merkblatt.js`, 19.09):
  персонализированный печатный лист A4 (2 колонки) на основе личной истории ошибок: статистика
  журнала ошибок, проседающие темы, проблемные карточки Satzbau и ключевые правила оформления
- **Sollwert-Anzeige bei Falschantworten** (`gen/blatt.js`, `index.html`, `gen/er.js`, 19.09):
  вывод эталонного значения («richtig: ...») рядом с неверным введённым значением (в генераторе,
  ER-моделях, тренажёрах Gantt и Netzplan), позволяющий сравнить свой ответ с правильным
- **Druck-Dialog & Smartphone-Zoom** (`gen/druckbogen.js`, `gen/druckbogen.css`, 19.09):
  диалог выбора перед печатью (пустой бланк с линиями для письма vs. бланк со своими ответами,
  компактные vs. крупные иллюстрации), корректное масштабирование A4-листа при предпросмотре на смартфонах
- **Service Worker v19** (`sw.js`): обновление версии кэша приложения до `ihk-ap1-v19-app`
- **Intelligente Freitext-Prüfung & Selbstbewertung (v20)** (`gen/kern.js`, `gen/blatt.js`, `gen/blatt.css`, `gen/gesamt.js`, `sw.js`, 20.09):
  - распознавание синонимических смысловых групп («kein/fehlt/ohne», «falsch/defekt», «zuweisen/erhalten», «erreichbar/verbinden») и немецких сложных слов (Komposita с Fugen-s/n, например Gateway / Standardgateway);
  - интерактивная быстрая самопроверка открытого текста в итогах листа («ganz» / «halb» / «null» / «↗ ansehen») с разделением баллов на подтверждённые и ожидающие оценки;
  - взвешенный расчёт общего прогресса с полураспадом веса результатов за 14 дней и индикацией надёжности данных («dünne Basis» при < 15 BE);
  - обновление кэша Service Worker до `ihk-ap1-v20-app`.
- **ER-Übungsaufgaben & Service Worker v21** (`gen/er-uebung.js`, `gen/er.css`, `gen/er.js`, `sw.js`, `index.html`, 20.09):
  - три изолированные тренировочные задачи для закрепления ключевых архитектурных решений (две 1:n связи на одну сущность, n:m связь с атрибутами в ромбе, цепочка 1:n);
  - улучшена проверка атрибутов в `gen/er.js`: атрибуты с одинаковыми именами в разных сущностях (например, `Name`, `Datum`) больше не вызывают ложных предупреждений;
  - блок быстрого запуска на стартовой странице с сохранением результатов и индикацией статуса;
- **ER-Canvas & Aufgaben-Generator (v23)** (`gen/er-canvas.js`, `gen/er-canvas.css`, `gen/er-gen.js`, `gen/er-gen-daten.js`, `gen/er-uebung.js`, `gen/er.js`, `gen/er.css`, `sw.js`, `index.html`, 21.09):
  - интерактивный графический холст для визуального построения ER-диаграмм (переключение «Tabellen» / «Zeichnen» с сохранением состояния);
  - генератор случайных/процедурных тренировочных задач ER-моделирования (настраиваемое число сущностей 3–4, только 1:n или с n:m, готовая стартовая сущность, генерация по сиду/Saat);
- **ER-Modelle im Diagramm-Trainer & Service Worker v24** (`gen/er-gen.js`, `gen/er-uebung.js`, `index.html`, `sw.js`, 21.09):
  - прямой запуск генератора ER-модели с холстом по кнопке «ER-Modell zeichnen» прямо в блоке тренажера диаграмм (Diagramm-Trainer);
  - перенос блока тренировочных задач ER («ER-Modelle — drei Übungsaufgaben») вплотную к блоку диаграмм для логичного расположения;
- **Korrektur ER-Grafiken, Canvas-Drag & Service Worker v25** (`gen/er.js`, `gen/er-canvas.js`, `gen/er-canvas.css`, `gen/zurueck.js`, `sw.js`, 21.09):
  - отрисовка связей ER-диаграмм, перекрывающих соседние сущности: обход снизу вместо наложения на средний блок, точный подсчет высоты холста без обрезания;
  - исправление перетаскивания узлов на Canvas: компенсация масштаба экрана, сглаживание через `requestAnimationFrame`, полноэкранный режим (⤢ / клавиша F), изоляция клавиши Escape;
  - обновление кэша Service Worker до `ihk-ap1-v25-app`.


## Чего не хватает

1. **Нет тайминга по отдельным заданиям** — общий секундомер и разбор после
   симуляции есть, но не видно, какой ТИП задания съедает минуты.
2. **Псевдокод только читаешь**, писать самой негде.
3. **Проверка смысла.** Сверка по словам ловит «назвала термин / не назвала»,
   но не отличает верное объяснение от бессмысленного. Настоящая проверка
   требует модели — либо через чат вручную, либо через API-ключ.
7. ~~**Десять тем каталога не на чем тренировать.**~~ Закрыто генератором:
   Konsolenbefehle (+ chmod), Wasserfall и Scrum, файловые системы,
   Anonymisierung/Pseudonymisierung, Projektstrukturplan, Domäne, Testprotokoll,
   Risikomatrix, Tuckman, Betroffenenrechte DSGVO, Barrierefreiheit — по каждой
   есть генерируемое задание. В экзаменационной сборке их по-прежнему нет.
8. **Диаграммы внутри заданий** по-прежнему решаются текстом: ER-Modell,
   UML Use-Case, Gantt. Отдельные тренажёры для Aktivitäts- и Klassendiagramm
   уже есть, но с самими экзаменационными заданиями они не связаны.

---

---

## Ранг 0. Визуальный редактор Aktivitätsdiagramm (следующее)

Генератор уже даёт бесконечные задания на Aktivitätsdiagramm, но рисовать
приходится в таблице узлов. Следующий шаг — холст как на настоящих платформах:
узлы перетаскиваются мышью, стрелки тянутся от узла к узлу, есть Swimlanes,
привязка к сетке, Undo/Redo и полноэкранный режим.

> **Промпт для Claude Code**
>
> В ihk-sim/gen сделай `diagramm-editor.js`: холст на SVG внутри поля типа
> `knoten`. Палитра снизу (Aktion, Entscheidung, Merge, Fork, Join, Startknoten,
> Aktivitätsende, Flussende), клик по палитре и клик по холсту ставит узел,
> перетаскивание мышью двигает, тянешь от края узла — рисуется стрелка,
> двойной клик по стрелке даёт подпись `[ja]`. Кнопки: Einrasten (сетка 20 px),
> Zurücksetzen, Swimlane +, Undo/Redo, Vollbild.
>
> Модель холста должна конвертироваться в тот же формат, который уже проверяет
> `pruefeKnoten` в `gen/kern.js` ({name, typ, nach, bed}) — тогда проверка
> и подсчёт баллов работают без изменений. Таблицу оставить как
> переключаемый режим («als Tabelle eingeben») для телефона.
>
> Отдельной кнопкой «Lösung zeichnen» рисовать эталон настоящей нотацией —
> код для SVG уже есть в index.html (`umlSvgAkt`), его можно переиспользовать.

## Ранг 1. Закрыть пробелы каталога

Самое ценное: десять тем, по которым тренироваться не на чем, а спросить могут.

> **Промпт для Claude Code**
>
> В ihk-sim есть `exams/luecken.json` — темы нового Prüfungskatalog AP1
> и сколько заданий в сборке их покрывает. Десять тем имеют `"n": 0`.
>
> Составь для каждой такой темы по 6–10 упражнений в формате обычного
> экзамена (схема v2, см. README) и положи их как `exams/uebung-<key>.json`
> с `meta.part: "Übung"` и `meta.quelle: "Prüfungskatalog ab 2025"`.
> Формулировки — по образцу настоящих IHK-заданий: Ausgangssituation,
> «Nennen Sie drei …», «Erläutern Sie …», баллы 2–6, Musterlösung по-немецки.
>
> Для Konsolenbefehle сделай задания на конкретные команды из каталога
> (ls, chmod, ping, nslookup, cp, mkdir, arp, ipconfig) и на права ugo+rwx.
> Для Zahlensysteme — перевод Dual/Hex/Oktal с расчётом.
>
> Дальше: в index.html такие «экзамены» должны попадать в Übungsmodus и
> Karteikarten наравне с настоящими, но НЕ появляться карточками экзаменов
> на стартовом экране — там только настоящие IHK-Prüfungen. Прогони после
> этого весь конвейер из README и `tools/check.py`.

## Ранг 2. Интервальное повторение

> **Промпт для Claude Code**
>
> В index.html добавь интервальное повторение поверх существующих
> `ihk2:scores` и `ihk2:attempts`.
>
> Без SM-2: после оценки Teilaufgabe получает `naechsteWiederholung`.
> Меньше 60 % от maxPoints — через 1 день, 60–85 % — через 4 дня, больше
> 85 % — через 14 дней. Каждый успешный повтор удваивает интервал.
> То же самое для карточек по `ihk2:cards`.
>
> На стартовом экране карточка «Heute fällig: N» с кнопкой, запускающей
> Übungsmodus ровно с этими задачами. Нечего повторять — карточку не
> показывать. Данные в `ihk2:wiederholung`, ключ `examId:subId`.
> Существующие хранилища не ломать, экспорт прогресса дополнить.

## Ранг 3. Диаграммы кроме Netzplan

Сделано: отдельные тренажёры Aktivitäts- и Klassendiagramm со своим генератором
и проверкой (кнопки на стартовом экране). Осталось — привязать структурированный
ввод к самим экзаменационным заданиям:

`answerType: "diagram"` без `netzplan` — это ER-Modell, UML и Gantt.

> **Промпт для Claude Code**
>
> Сделай в index.html структурированный ввод для задач с
> `answerType: "diagram"`, у которых нет поля `netzplan`.
>
> Вместо одного textarea — таблица со строками, которые можно добавлять
> и удалять. Набор колонок зависит от нового поля `diagrammTyp`:
> - `er`     → Entität | Attribute | Primärschlüssel | Beziehung zu | Kardinalität
> - `klasse` → Klasse | Attribute | Methoden | erbt von
> - `usecase`→ Akteur | Anwendungsfall | Beziehung (include/extend)
> - `gantt`  → Vorgang | Start (Tag) | Ende (Tag) | Vorgänger
>
> Ответ сохраняется как JSON и разворачивается в читаемый текст для
> Markdown-экспорта и для сверки в «Antwort prüfen».
>
> Проставь `diagrammTyp` всем подходящим Teilaufgaben — определи по тексту
> задания (`Entity-Relationship`, `Klassendiagramm`, `Use Case`, `Gantt`).
> Где тип не определяется, оставь обычное текстовое поле.
>
> Для `gantt` добавь проверку как у Netzplan: по списку Vorgänge с
> длительностями и предшественниками посчитай правильные Start/Ende и
> подсвети расхождения.

## Ранг 4. Автопроверка, когда появится ключ

Пока ключа нет — не делать. Функция `markdown()` уже собирает бланк, не
хватает второго потребителя: слать по одной Teilaufgabe в API. Из `file://`
браузер в api.anthropic.com не пустит (CORS), нужен локальный прокси.

> **Промпт для Claude Code** *(только если появится ANTHROPIC_API_KEY)*
>
> 1. `tools/serve.py` — сервер на стандартной библиотеке (http.server, без
>    Flask). Отдаёт статику на localhost:8000 и держит POST `/api/bewerten`,
>    проксирующий в Anthropic Messages API с ключом из переменной окружения.
>    Ключ в браузер не попадает.
> 2. `start.bat` — запуск сервера и открытие браузера.
> 3. В index.html кнопка «Automatisch bewerten» на экране Auswertung: шлёт
>    Teilaufgaben пачками по 5 (prompt, ответ, Musterlösung, maxPoints),
>    получает `[{id, punkte, begruendung, merksatz}]`, проставляет баллы и
>    показывает begruendung. Прогресс-бар, обработка ошибок, «Abbrechen».
> 4. Сервер недоступен — кнопка скрыта, всё остальное работает как сейчас.
>
> Промпт модели на немецком, температура 0, строгий JSON, оценивать по
> Musterlösung как Korrektor: частичные баллы можно, за отсутствующие
> пункты — нельзя.

## Ранг 5. Мелочи

- **PWA** — `manifest.json` + service worker, чтобы карточки работали
  на телефоне офлайн. Экзамен на телефоне решать неудобно, карточки — да.
- **Zufällige Klausur** — кнопка «случайный экзамен под таймером»: берёт
  тот, что давно не сдавала, блокирует «Lösungen einblenden» до сдачи,
  предупреждает за 10 и за 5 минут.
- **Тесты конвейера** — `tests/` с фикстурами. Сейчас единственная
  страховка `check.py`, и он проверяет результат, а не скрипты.
- **Проверка каталога на новый год** — раз в полгода сверять
  `exams/katalog.json` с актуальным Prüfungskatalog.

---

## Порядок, если делать по одной вещи

1. ~~**Ранг 1** — десять непокрытых тем каталога~~ (сделано генератором)
2. **Ранг 0** — визуальный редактор Aktivitätsdiagramm
3. **Ранг 2** — повторение по интервалам (можно распространить и на генератор)
4. **Ранг 3** — ER/UML/Gantt как таблицы внутри экзаменационных заданий
5. остальное по настроению

Перед правкой данных: `python tools/check.py`. После — весь конвейер из
README, последним `build_index.py`.

---

## Про расход

Распознавание сканов внутри чата — самая дорогая операция: страница-картинка
это тысячи токенов из лимита подписки. Все десять экзаменов уже разобраны,
повторять не нужно. Понадобится одиннадцатый — только через
`tools/parse_exam.py` с API-ключом ($0.35–0.50 за экзамен, с кэшем).
Любой промпт, где Claude Code предлагает «прочитать страницы», должен идти
через него.
