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
- **Service Worker v8** (`sw.js`): обновление версии кэша приложения до
  `ihk-ap1-v8-app`

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
