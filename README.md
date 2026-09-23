# IHK AP1 — Prüfungssimulator

Локальный тренажёр для Teil 1 der gestreckten Abschlussprüfung («Einrichten eines
IT-gestützten Arbeitsplatzes»). Без сервера, без интернета, без API-ключей:
открываешь `index.html` двойным кликом и решаешь.

**10 экзаменов 2021–2026 · 279 Teilaufgaben · 176 карточек · тренажёры Netzplan,
Gantt, UML-Aktivitäts- и Klassendiagramm · генератор: 114 типов заданий
с бесконечным числом вариантов и автопроверкой · Spickzettel (20 глав) · Kompendium (52 темы) · офлайн PWA.**

Из 279 заданий 14 (52 балла) помечены как **вне действующего каталога** —
они видны и решаются как обычно, но с пометкой «kannst du überspringen».
Подробности ниже.

| Экзамен | Teilaufgaben | Экзамен | Teilaufgaben |
|---|---|---|---|
| Herbst 2021   | 23 | Frühjahr 2024 | 30 |
| Frühjahr 2022 | 30 | Herbst 2024   | 26 |
| Herbst 2022   | 27 | Frühjahr 2025 | 30 |
| Frühjahr 2023 | 24 | Herbst 2025   | 31 |
| Herbst 2023   | 31 | Frühjahr 2026 | 27 |

Это **неофициальное учебное приложение**, а не продукт IHK/ZPA. Автопроверка,
веса тем и Musterantworten помогают тренироваться, но не заменяют официальный
Prüfungskatalog, Prüfungsordnung и оценивание экзаменатором. Перед публикацией
или передачей третьим лицам отдельно проверь права на исходные экзаменационные
PDF и изображения; репозиторий рассчитан прежде всего на личную подготовку.

---

## Prüfungskatalog ab 2025

Каталог AP1 обновили: часть тем ушла целиком, часть сузили. Симулятор знает
об этом и помечает такие задания.

**Вычеркнуто из AP1** (SQL и RAID — прямо в предисловии каталога: они теперь
только во второй части экзамена):

SQL и нереляционные БД · RAID · SAN/JBOD · Struktogramm и PAP (остался
псевдокод) · наследование и полиморфизм · LTE/5G · SWOT · ISO 2700x ·
ISO 9126 и критерии качества ПО · модели разработки кроме Wasserfall и Scrum
(Kanban, XP, V-Modell) · виды документации · Eisbergmodell · Benchmarking ·
Cross-Selling

**Сузили:** порты и протоколы (длинный список заменён на «сетевые протоколы,
напр. Ethernet, IP, DNS» + OSI — номера портов зубрить не надо, OSI надо) ·
виртуализация и облако (только виртуальные десктопы, SaaS и DaaS — Docker и
типы гипервизоров не нужны).

Такие задания **не выкидываются из экзамена** — они на месте, читаются и
решаются, но помечены красным: «Kannst du überspringen» плюс объяснение, почему
тема больше не спрашивается. Экзамен остаётся целым, просто видно, что можно
пропустить. Если хочется совсем убрать их с глаз — галочка **«veraltete
ausblenden»** в шапке (по умолчанию выключена).

Из статистики и приоритетов вычеркнутые темы исключены всегда: учить их
незачем, и портить ими расчёт не надо.

Раздел **«Lücken im Katalog»** на главной показывает обратное: темы, которые
каталог добавил, и сколько заданий в этой сборке их покрывает. Десять из них
не встречаются ни в одном из десяти экзаменов — их надо учить отдельно.

Правила лежат в `exams/katalog.json`. Каталог изменится — правишь этот файл и
запускаешь `python tools/tag_katalog.py && python tools/build_index.py`.
Источники: официальное
[IHK-Prüfungs-News 09/24](https://www.ihk-zpa.de/export/sites/default/LinkRepository/IHK-Pruefungs-News/IHK-Pruefungs-News_09-24.pdf)
и поясняющий [IT-Berufe-Podcast #190](https://it-berufe-podcast.de/neuer-pruefungskatalog-fuer-die-ap1-der-it-berufe-ab-2025-it-berufe-podcast-190/).

---

## Генератор заданий («Arbeitsblätter»)

Раздел **«Arbeitsblätter — unendlich neue Aufgaben»** на главной. Кнопка
**«+ Neues Arbeitsblatt»** открывает один экран:

1. **Сколько заданий** — поле с числом и быстрые кнопки 5 / 10 / 15 / 20 / 25 / 40,
   плюс сложность и режим часов.
2. **Режим** — «Zufall — alles gemischt» (всё из всех тем, как на настоящем
   экзамене) или «Gezielt auswählen».
3. При «Gezielt» ниже стоят **все 10 главных тем, уже отмеченные галочками**.
   Ограничения «максимум 3 темы» больше нет: снимаешь галочки с того, что
   сегодня не нужно. У каждой темы кнопка «▼ Unterthemen» — там подтемы можно
   отключать поштучно.
4. Три кнопки над списком: «alle anhaken», «alle abwählen», «nur meine
   Schwächen» (собирает лист только из типов, где квота ниже 70 %).

Счётчик внизу всё время показывает, сколько типов заданий подходит под текущий
выбор и сколько примерно баллов получится.

Каждое задание собирается из **шаблона** (`Vorlage`): текст, таблицы, цифры и
сценарий генерируются заново при каждом клике, а эталонное решение считается
вместе с ними. Одна и та же тема — сколько угодно разных вариантов.

**114 типов заданий в 11 главных темах** (структура тем — как в коммерческих
тренажёрах, чтобы выбор был привычным):

| Тема | Кол-во | Что генерируется |
|---|---|---|
| Netzwerke & Kommunikation | 15 | Netz-/Broadcastadresse, Subnetting, «в одной ли подсети», IPv6, MAC → Link-Local (EUI-64), ARP, DHCP/DORA, VPN, Bandbreite, PoE-Budget, OSI, Netzwerkdiagnose (ipconfig), IP-Konfigurationstabelle, Konsolenbefehle, Domäne |
| IT-Sicherheit | 14 | TOM, Phishing, Schutzziele, Passwortrichtlinie + MFA, Ransomware-Notfall, Malware-Arten, Betriebssystemhärtung, Zertifikate & PKI, Kryptographie + Schlüsselanzahl, Hashfunktionen, Protokollierung, Zutrittskontrolle, Schutzbedarfsanalyse, **Berechtigungsmatrix** |
| Hardware | 17 | выбор устройства с обоснованием, CPU-Kenndaten + Stromkosten, RAM & Dual Channel, USB-Standards + Übertragungszeit, Video-Schnittstellen + Datenrate, Netzteil & Leistungsaufnahme, Identifikationstechnologien (Barcode/QR/RFID/NFC), Speichermedien, Betriebssysteme & Lizenzen, Ergonomie, Barrierefreiheit, Ticketsystem, Virtualisierung, **Fehleranalyse Symptom → Ursache → Maßnahme**, **Einheitenvorsätze**, **P = U · I**, **USV-Auslegung** |
| Projektmanagement | 15 | Wasserfall/Scrum, Lastenheft/Pflichtenheft, Projektstrukturplan, Risikomatrix, Tuckman, Testprotokoll, Netzplan, Gantt, SMART-Ziele, Stakeholderanalyse, funktionale/nicht-funktionale Anforderungen, Übergabe |
| Wirtschaftlichkeit | 15 | TCO, AfA, Amortisation, Break-even, Angebotspreis, Stromkosten, Lizenzstaffeln, Laufende Kosten je Monat, Gesamtkosten über die Laufzeit, Marktformen, Darlehen/Tilgungsplan, Kostenrechnung & Deckungsbeitrag, **Netto → Brutto / Umsatzsteuer**, **Brutto → Netto Rückrechnung**, **Energie W = P · t & Stromkosten** |
| Datenformate & Speicherung | 10 | Speicherbedarf (архив, видео), RAID, JBOD & Speichersysteme, Dateiformate & Datenkonvertierung, Zahlensysteme, Dateisysteme, SLA-Verfügbarkeit, Backups, **Backup-Wochenplan** |
| Softwareentwicklung | 9 | UML-Aktivitätsdiagramm, Use-Case, Klassendiagramm, Schreibtischtest, Pseudocode über Datensätzen, Programmiersprachen (Compiler/Interpreter), Webtechnologien |
| Recht & Compliance | 6 | Betroffenenrechte DSGVO, Anonymisierung/Pseudonymisierung, Auftragsverarbeitung, Mängelrechte, Arbeitsrecht, Vertragsarten |
| Beschaffung | 6 | сравнение трёх предложений, Bezugspreis, Nutzwertanalyse, Leasing vs. Kauf, Make-or-Buy, **Rabatt, Skonto & Bezugspreis** |
| Datenbanken | 4 | ER-Modell & Kardinalitäten, Relationenmodell, Normalisierung bis 3. NF, SQL lesen und ergänzen |
| KI & Digitalisierung | 3 | KI-Grundbegriffe & Fehlerquote, verzerrte Trainingsdaten (Bias), KI und Datenschutz |

Жирным отмечены четыре типа таблиц, которых раньше не было — а Tabellen это
самая тяжёлая категория экзамена (≈23,5 балла за экзамен).

Отдельный блок «проблемных» типов, добавленный по списку из практики:
Laufende Kosten pro Monat (цена ÷ Nutzungsdauer + скидка + подписка + Wartung),
Gesamtkosten über mehrere Jahre mit Ersatzbeschaffung (netto/brutto),
Amortisation eines Mehrpreises über die Stromersparnis (в месяцах, с округлением вверх),
Netzwerkdiagnose aus zwei ipconfig-Ausgaben (найти неверную строку и исправить),
Pseudocode über einem Datensatz-Auszug (какие записи считает функция и что она вернёт).

Из десяти тем каталога, которых не было ни в одном экзамене (раздел «Lücken im
Katalog»), генератор закрывает девять.

### Prüfungsbogen drucken und Papiermodus

В открытом Arbeitsblatt две кнопки:

**Prüfungsbogen (PDF)** — верстает лист в формате настоящего экзамена и открывает
предпросмотр: титульный лист с Bearbeitungszeit (0,9 мин на BE), Punkteverteilung
и Hinweise zur Bearbeitung; дальше задания с колонкой BE справа, линиями для ответа
по числу баллов, пустыми таблицами вместо заполненных, клетчатым полем для диаграмм
и листом для Nebenrechnungen. Печать — через браузер, «Als PDF speichern».
Галочка **«Lösungsbogen anhängen»** добавляет отдельный лист с эталонами
и таблицей для самопроверки по баллам.

**Papiermodus** — тот же лист, но с секундомером: печатаешь, решаешь на бумаге,
потом вбиваешь набранные баллы по заданиям. Программа считает процент, оценку IHK,
затраченное время и **минуты на один BE**, и пересчитывает это на полный экзамен
в 100 BE: успеваешь ли ты в 90 минут и сколько баллов осталось бы лежать.
На главной появляется блок «Auf Papier — dein Tempo» со средним по всем прогонам.

### Как проверяются ответы

- **числа** — с допуском на промежуточные округления; если порядок величины не
  тот, так и написано («Zahl stimmt, Einheit/Größenordnung nicht»);
- **термины и перечисления** — по списку синонимов; показывает, что засчитано
  («✓ Redundanz»), чего не хватает и какие ещё варианты были бы верными;
- **Erläutern/Begründen** — отдельная проверка на связность: одно слово вместо
  предложения режет балл вдвое с пометкой «das ist eine Nennung, keine
  Erläuterung»; предложение без «weil / damit / dadurch» теряет четверть;
- **Zuordnung, richtig/falsch, Mehrfachwahl, таблицы** — по клеткам,
  с подсветкой каждой;
- **Aktivitätsdiagramm** — сверяет узлы, их тип и стрелки, плюс отдельно
  проверяет нотацию: ровно один Startknoten, у Entscheidung минимум два выхода
  с условиями, из Aktion одна стрелка, Fork и Join парные.

### Кнопки

- **Prüfen** у каждого задания и **Alles prüfen** сверху; итог — процент и
  оценка IHK
- **↻ Neu würfeln** — тот же тип задания с новыми числами, не выходя со страницы
- **Neues Blatt, gleiche Themen** — весь лист заново
- **Musterlösung mit Rechenweg** — полный ход решения, а не только ответ
- **Merksatz** появляется сам, если задание решено не полностью
- **Drucken** — лист без решений, **Markdown** — выгрузка с ответами и эталонами
- **«Woran es im Generator hakt»** на главной: типы заданий, отсортированные по
  твоей доле баллов, кнопка «gezielt üben» запускает лист только из этого типа

Прогресс лежит в `localStorage` (`ihk2:gen:blaetter`, `ihk2:gen:stat`) — отдельно
от экзаменов, ничего из старого не трогается.

### Как добавить свой тип задания

Файл `gen/vorlagen-*.js`, одна функция:

```js
G.vorlage({
  id: "kalk-meins", thema: "kalkulation", sub: "Meine Unterthema",
  titel: "Kurzer Titel", stufe: 2,
  merksatz: "Eine Zeile, die man sich merken soll.",
  bau(R, c) {                      // R = генератор случайных, c = контекст (фирма, отдел…)
    const preis = R.preis(500, 2000);
    return {
      situation: `Die ${c.firma} kauft … ${preis} €`,
      prompt: "Berechnen Sie …",
      felder: [{ typ: "zahl", label: "Ergebnis", einheit: "€", be: 2, loesung: preis * 1.19 }],
      loesung: "Rechenweg …"
    };
  }
});
```

Типы полей: `zahl` · `text` · `liste` · `auswahl` · `mehrfachwahl` ·
`aussagen` (richtig/falsch) · `zuordnung` · `raster` (таблица с ячейками ввода) ·
`knoten` (узлы Aktivitätsdiagramm) · `modell` (ER, Klassen-, Use-Case-Diagramm:
свободные колонки, проверка по строкам).
Поле `code` в возвращаемом объекте печатается моноширинным блоком — для
псевдокода и вывода консоли. Для текстовых «Nennen Sie drei …» есть
короткая форма `G.nennVorlage({ … pool: [[синонимы], …] })`.

Файл подключается в `index.html` строкой `<script src="gen/…"></script>` —
сборка не нужна, экзамены и старые данные не затрагиваются.

---

## Wo стою: общая картина

Раздел **«Wo stehe ich? — Prüfungen und Generator zusammen»** сразу под карточками
экзаменов. Он сводит две статистики в одну:

- **вес темы** берётся из десяти настоящих экзаменов (`exams/gewichte.json` + подсчёт
  по сборке) — сколько баллов тема стоит в одном экзамене;
- **квота** считается по всему, что ты оценила: и по Teilaufgaben экзаменов,
  и по заданиям генератора;
- **Verlust** = вес × (1 − квота), сортировка по нему.

Это учебная эвристика, а не официальная вероятность темы на следующем
экзамене: выборка состоит всего из десяти исторических вариантов и не является
случайной. Используй рейтинг для расстановки приоритетов, но не как основание
полностью исключать остальные темы.

Наверху: прогноз баллов из 100, оценка IHK и «Datenbasis» — какую долю
экзаменационного материала ты вообще уже проверяла. Пока эта доля мала, число
скачет, и так и написано. Кнопка **«üben»** в строке собирает лист только из
заданий этой темы; темы генератора вроде Diagramme раскладываются по
экзаменационным темам (Netzplan → Projekt, ER → Daten, UML → Software).

## Диаграммы в настоящих экзаменах

34 Teilaufgaben имеют `answerType: "diagram"` и раньше решались одним текстовым
полем. Теперь тип распознаётся по тексту задания (Netzplan, Gantt, ER,
Klassendiagramm, Use-Case, Aktivitätsdiagramm, Nutzwertanalyse) и над полем
появляется таблица с нужными колонками. Она переводится в текст и подклеивается
к ответу — Markdown-экспорт, «Antwort prüfen» и Auswertung её видят.

Рядом кнопка **«↗ diesen Typ mit Prüfung üben»**: открывает лист генератора
с тем же типом диаграммы, где баллы ставятся автоматически.

## Satzbau-Training

Отдельный раздел на главной. 51 карточка: настоящий вопрос из экзамена, рядом
стичворт, который обычно пишется вместо ответа, и задание — развернуть его в
полноценный ответ. Проверяются четыре вещи: есть ли Fachbegriff, есть ли
объяснение (weil / dadurch / damit или второй поясняющий предложение), хватает
ли длины, и написано ли предложением. Максимум 2 балла за карточку.

Musterantworten написаны простым немецким (B2): короткие предложения, обычные
слова. За карточками закреплён прогресс (`ihk2:gen:satz`), кнопка
«nur die wackeligen üben» собирает то, что не сидит.

Карточки Prüfungstechnik (Antwortsatz с числом и единицей, Empfehlung,
подсчёт подвопросов) проверяются без требования Begründung.

## Formelblatt (A4)

Кнопка **«Formelblatt (A4) ansehen und drucken»** под Satzbau-Training.
78 формул и Merksätze в 15 блоках, две колонки, печать через браузер в PDF.
Основа — твоя собственная сборка `ap1-formeln-fakten.html`, дополненная тем,
что используют 63 типа заданий генератора. Мелким шрифтом под каждой формулой
стоит ловушка: «Immer auf das Soll beziehen», «Watt erst durch 1.000»,
«60 ÷ 36 aufrunden», «UML kennt kein n».

---
## Prüfungssimulation — 90 минут

Кнопка **«Prüfung starten»** в блоке генератора. Собирает лист не случайно,
а по **измеренному распределению десяти настоящих экзаменов**:

| Тема | BE |
|---|---|
| Kalkulation & Wirtschaft | 24 |
| Netzwerke | 16 |
| Hardware | 11 |
| IT-Sicherheit | 10 |
| Projektmanagement | 9 |
| Daten & Speicher | 9 |
| Software & UML | 8 |
| Algorithmen | 7 |
| Datenschutz & Recht | 4 |
| Arbeitsplatz & Support | 3 |

Итого 100 BE ± 5, 11–15 заданий, 90 минут обратного отсчёта. До сдачи
заблокированы кнопки «Prüfen», «Lösung zeigen» и «Neu würfeln» — иначе это
не экзамен, а обычная тренировка. Когда время выходит, лист сдаётся сам.

После сдачи — обычный разбор плюс строка по времени: сколько минут ушло,
пересчёт на 100 BE и сколько баллов осталось бы лежать при таком темпе.

KI (≈2 BE) и Kommunikation (≈2 BE) в генераторе пока не покрыты — их доля
честно перераспределена на остальные темы, и об этом написано прямо в блоке.

---

## Rechenweg и Folgefehler

У каждого расчётного задания под полями результата появилось поле
**«Rechenweg / Nebenrechnung»** — линованное, моноширинным шрифтом, как графа
на настоящем бланке. Оно попадает и в печатный Prüfungsbogen (клетчатое поле
рядом с заданием, а не только на листе Nebenrechnungen в конце).

Проверка работает как настоящий корректор:

* промежуточные значения берутся из эталонного решения задания;
* после «Prüfen» показывается цепочка этих значений — зелёным те, что есть
  в твоём расчёте, красным первое расхождение («ab 57,68 weicht es ab»);
* если ход расчёта убедителен (≥3 значения и половина первых шести), а итог
  неверный — **половина баллов** за числовые поля, ровно как на экзамене;
* если хода расчёта нет, за неверный итог не даётся ничего, и об этом пишется
  прямо: «Ohne nachvollziehbaren Rechenweg gibt es keine Teilpunkte».

Поле стоит у 35 из 101 типа заданий — у тех, где действительно считают.

---

## Операторы IHK

Под каждым текстовым полем — раскрывашка **«Hilfe zum Operator …»**. Оператор
определяется по формулировке поля (а не всего задания), для полей, требующих
целых предложений, показывается «Erläutern» даже если написано «Nennen».

Внутри: что оператор требует, какой объём ожидается, типичная ловушка — и
кликабельные каркасы фраз, которые вставляются в поле с курсором на первом
пропуске:

* Erläutern → «… . Dadurch wird … .»
* Begründen → «… ist sinnvoll, weil … . Dadurch … .»
* Beurteilen → «Dafür spricht, dass … . Dagegen spricht, dass … . Insgesamt … .»
* Vergleichen → «Bei … ist … , bei … dagegen … .»

Кнопка **«Operatoren-Blatt ansehen und drucken»** — та же таблица на A4 рядом
с Formelblatt.

---

## Fehlerjournal

Каждое проверенное задание, где не набраны все баллы, автоматически попадает
в журнал — из генератора и из настоящих экзаменов (там по твоей самооценке,
когда ставишь меньше максимума). **Одна запись на задание**, не на поле.

В записи: дата, тип задания, какие поля не сошлись, твой ответ и правильный,
подсказка проверки. Ниже шесть кнопок-причин:

`Einheit / Rundung` · `falsch gelesen` · `Rechenweg fehlte` · `zu knapp` ·
`nicht gewusst` · `Zeit`

Причину часто ставит сама программа: если проверка написала «Zahl stimmt,
Einheit nicht» → *Einheit / Rundung*; «zu knapp — das ist eine Nennung» →
*zu knapp*; если сработал Folgefehler или хода расчёта не было → *Rechenweg
fehlte*. Остальное — один клик.

Сверху сводка за 21 день: сколько ошибок, сколько баллов на них потеряно,
столбики по причинам и вывод вида «78 % твоих ошибок — не пробел в знаниях».
У каждой записи кнопки «этот тип поупражнять» и «отметить сделанным».

---

## Rechenweg в настоящих экзаменах

Из 279 подзаданий 43 — расчётные. У 37 из них (158 баллов, ~16 за экзамен)
под текстовым полем теперь стоит **Rechenweg / Nebenrechnung**: линованное
поле моноширинным шрифтом.

Промежуточные значения тянутся из Musterlösung самого экзамена. Пока решение
скрыто, поле просто пишется. Как только нажмёшь «Lösungen einblenden» —
появляется цепочка значений: зелёным те, что есть у тебя, красным первое
расхождение, и вывод «Der Rechenweg trägt — в экзамене за это была бы половина
баллов, не забудь при самооценке».

Текст хода расчёта попадает в антвортtext, значит и в экспорт, и в печать.

---

## Калибровка симуляции

В генераторе 21 % баллов приходилось на задания «выбери из списка»
(Zuordnung, Ankreuzen, richtig/falsch), в настоящих экзаменах — 2 %. Симуляция
из-за этого показывала процент выше реального.

Сделано два шага:

1. **Подбор**: шаблоны с высокой долей «клика» тянутся реже (вес
   `1 / (1 + 4 × доля)`). Средняя доля упала с 21 % до 12 % при тех же 100 BE.
2. **Честный пересчёт после сдачи**: считается отдельно квота по «кликовым»
   и по свободным заданиям, потом смешивается в пропорции настоящего экзамена
   (2 % / 98 %). Если разница есть, показывается блок «Realistischer Wert: X %
   statt Y %» с объяснением.

---

## Телефон и планшет

`index.html` открывается и с телефона — вёрстка перестраивается сама, ничего
включать не надо.

Что меняется на экране уже 700 px и уже:

* шапка сжимается в одну строку, чтобы не съедать пол-экрана;
* кнопки идут по две в ряд, минимальная высота 44 px под палец;
* все поля ввода не меньше 16 px — иначе iOS при касании зумит страницу;
* широкие таблицы (Netzplan, Klassendiagramm, Raster, Zuordnung) прокручиваются
  внутри себя, страница вбок не уезжает; над такой таблицей появляется подсказка
  «← seitwärts wischen →»;
* колонка с баллами уходит из-под задания вниз, отдельной полоской;
* мастер генератора, Satzbau-Trainer и статистика становятся одноколоночными.

Как открыть на телефоне, если проект лежит на компьютере: положить папку
`ihk-sim` целиком в облако (OneDrive, Google Drive, Dropbox), открыть оттуда
`index.html` в браузере телефона. Прогресс хранится в localStorage браузера —
на телефоне он будет свой, отдельный от компьютера.

---

## Spickzettel — der ganze Stoff

Раздел **«Spickzettel»** на главной странице (или через быстрый запуск PWA):

* **20 структурированных глав:** формат и тайминг экзамена, операторы решений, все типы диаграмм (Use-Case, Aktivitätsdiagramm, Klassendiagramm, ERM, Netzplan, Gantt), формулы и расчёты, IP/подсети/IPv6, IT-безопасность, шифрование, операционные системы, аппаратная часть, базы данных, проектный менеджмент, экономика и право;
* **Полнотекстовый поиск:** поиск по всем главам с мгновенным выводом контекстных цитат и прямым переходом к подсвеченным совпадениям;
* **Адаптивное чтение:** оптимизировано под телефон и десктоп, таблицы прокручиваются внутри блоков, запоминается последнее открытое место (`localStorage`);
* **Офлайн PWA:** оболочка, генераторы и уже загруженные материалы кэшируются
  Service Worker v30; изображения целого экзамена надо заранее загрузить
  кнопкой «offline laden» на его карточке.

---

## AP1-Kompendium — 52 FIAE-Themen

Раздел **«Kompendium»** на главной странице:

* **52 развернутые темы:** глубокая теоретическая база из коллекции Notion для подготовки к AP1, сгруппированная по 7 официальным областям IHK (планирование проектов, консультирование, рыночные IT-системы, разработка IT-решений, контроль качества, IT-безопасность, завершение заказов + практические темы);
* **Иллюстрации, таблицы и схемы:** наглядные примеры, формулы, типовые задачи и контрольные вопросы;
* **Быстрая динамическая загрузка:** страницы загружаются по требованию (`gen/komp/<id>.js`), не замедляя старт приложения;
* **Полнотекстовый поиск:** поиск по содержимому всех 52 тем с подсветкой совпадений;
* **Офлайн PWA:** интерфейс и уже открытые темы кэшируются Service Worker v30;
  ещё не открытая тяжёлая тема может потребовать сеть.

---

## Как пользоваться

Открой `index.html`. Всё остальное — из интерфейса.

### Стартовый экран

- **карточки экзаменов** — прогресс, лучшая оценка, сколько баллов вне каталога
- **Übungsmodus** — выбираешь темы, количество и порядок. Фильтры «только что
  я завалила» и «только ungeübte». Без таймера
- **Netzplan-Trainer** — программа генерирует случайный сетевой график, ты
  заполняешь FAZ/FEZ/SAZ/SEZ/GP/FP, кнопка «Prüfen» подсвечивает красным то,
  что не сошлось, не показывая правильный ответ. «Lösung zeigen» заполняет всё
  и печатает критический путь. Планы всегда с настоящими буферами.
  Кнопка «Eigenen Netzplan eingeben» принимает список вида `A,2,B C` — по
  строке на Vorgang: имя, длительность, последователи. Так можно тренировать
  график из настоящего экзамена, открыв его скан кнопкой «Vollständige Seite»
- **UML-Trainer** — кнопки «Aktivitätsdiagramm üben» и «Klassendiagramm üben».
  Программа сочиняет случайную Ausgangssituation по-немецки (шесть сюжетов,
  у Aktivität ещё четыре формы: ветвление со слиянием, цикл с возвратом,
  Parallelisierung и смешанная), ты заполняешь таблицу: у Aktivität — узлы
  с типом (Start / Aktion / Entscheidung / Parallelisierung / Synchronisation /
  Ende), нацеленными на них Nachfolger и условиями; у Klassendiagramm —
  классы с атрибутами, методами и «erbt von» плюс отдельная таблица
  ассоциаций с кратностями.
  «Prüfen» проверяет две вещи. Нотацию: ровно один Startknoten, у Entscheidung
  минимум два выхода с разными условиями, из Aktion выходит одна стрелка,
  Synchronisation сводит минимум два потока, методы со скобками, кратность
  в формате `1:n` (`1..*`, `n:m`, `0..1` тоже принимаются). И содержание —
  сверяет с тем заданием, которое было сгенерировано: чего не хватает, что
  выдумано, где не тот тип узла или не та стрелка. Расхождения подсвечиваются
  красным, правильный ответ при этом не показывается — как «Prüfen» в Netzplan.
  «Lösung zeigen» рисует эталон настоящей нотацией (SVG: раута, балки Fork/Join,
  кружок с кольцом, кастрюли классов с тремя секциями, полая стрелка наследования)
  и печатает его же списком
- **Karteikarten** — 173 карточки, вытащенные из эталонных решений: термины и
  короткие вопросы. Что не знала — вернётся в той же пачке. Пробел
  переворачивает, стрелки вправо/влево — «знала / не знала»
- **Suche** — полнотекстовый поиск по заданиям и решениям
- **Themen: Stärken, Schwächen, Prioritäten** — главная таблица, см. ниже
- **Lücken im Katalog** — новые темы каталога и покрытие. Строку можно нажать,
  откроются подходящие задания
- **Fortschritt sichern** — экспорт и импорт всего прогресса одним JSON


### Приоритеты: что учить первым

Раздел «Themen: Stärken, Schwächen, Prioritäten» отвечает на вопрос
«с чего начать», а не просто «что я знаю плохо».

Три числа на каждую тему:

| Столбец | Что это |
|---|---|
| **BE / Prüfung** | сколько баллов тема стоит в среднем в **одном** экзамене. Считается по всем десяти экзаменам; если задание относится к двум темам, его баллы делятся пополам, поэтому сумма по столбцу сходится к 92 (100 минус вычеркнутое) |
| **Deine Quote** | твой процент по оценённым заданиям темы, с пометкой stark / mittel / schwach |
| **Verlust** | **BE / Prüfung × (1 − Quote)** — сколько баллов эта тема отнимает у тебя на настоящем экзамене |

Сортировка по последнему столбцу. Отсюда и берётся приоритет:

- **Kalkulation** — 22 балла за экзамен. Даже при 55 % это потеря 10 баллов →
  приоритет **hoch**
- **KI** — 2 балла за экзамен. Даже при 33 % это потеря 1,5 балла →
  приоритет **niedrig**

То есть слабая, но редкая тема вниз; средняя, но дорогая — наверх.

Наверху **одно число**: оценка IHK по той части экзамена, которую ты уже
проверила, и сколько баллов из ста это покрывает. Пока проверено мало —
число нестабильное, так и написано.

Темы, где ещё ни одно задание не оценено, идут отдельной таблицей ниже,
отсортированные по частоте: приоритет там неизвестен, но начинать логично
с самой дорогой.

Кнопка **«üben»** в конце строки сразу запускает тренировку по этой теме.

### Экзаменационный бланк

- таймер 90 минут, переживает перезагрузку; ответы автосохраняются
- слева Ausgangssituation, оглавление, Anlagen
- «nächste offene ↓» или `Alt` + `↓` — прыжок к первой неотвеченной
- задания-таблицы разбиты на **отдельные поля** с подписями и своими баллами
  плюс общее поле для черновых расчётов
- **«Antwort prüfen»** сверяет твой ответ с эталоном офлайн: числа с допуском
  0,5 % и ключевые термины. Показывает, что нашлось и чего не хватает, и
  предлагает балл. Это словарное сопоставление, а не проверяющий — решение
  всё равно читать
- в правой колонке самооценка баллов, внизу процент и оценка IHK
- «Vollständige Seite ansehen» — исходный скан страницы. Где эталон нарисован,
  под Musterlösung появляется «Lösungsseite ansehen»
- **«Drucken»** печатает бланк без решений и подсказок — можно решать на бумаге

### После сдачи

Экран Auswertung: твой ответ и эталон рядом, кнопки баллов, сверка чисел и
терминов, итог с оценкой.

- «Markdown für Claude» / «In Zwischenablage» — выгрузка бланка на проверку
- «Punkte einfügen» — вставить ответный блок с баллами, они проставятся сами
- «Ergebnis speichern» — попытка уходит в историю и статистику

Всё хранится в localStorage браузера. Другой браузер или инкогнито — другая
история; для переезда есть экспорт.

## Структура папки

```
ihk-sim/
├── index.html              симулятор — открывать этот файл
├── gen/                    генератор заданий
│   ├── kern.js             движок: случайность с семенем, проверка, подсчёт баллов
│   ├── vorlagen-*.js       шаблоны заданий по темам
│   ├── blatt.js            интерфейс «Arbeitsblätter»
│   ├── blatt.css           стили генератора
│   ├── druck.js            Prüfungsbogen im Drucklayout + Papiermodus
│   ├── druck.css           стили печати (A4, @page)
│   ├── gesamt.js           общая статистика: экзамены + генератор
│   ├── exam-diagramme.js   табличный ввод для диаграмм в настоящих экзаменах
│   ├── satzbausteine.js    51 карточка для Satzbau-Training
│   ├── satzbau.js          интерфейс Satzbau-Training
│   ├── formeln.js          Formelblatt A4
│   ├── operatoren.js       IHK-операторы: помощь в поле + лист A4
│   ├── simulation.js       Prüfungssimulation 90 минут по весам экзаменов
│   ├── fehlerjournal.js    журнал ошибок с разбором причин
│   ├── exam-rechenweg.js   Rechenweg-поле в настоящих экзаменах
│   ├── fortschritt.js      экспорт/импорт забирает и данные генератора
│   ├── mobil.css           вёрстка для телефона и планшета
│   └── mobil.js            подсказки «листай вбок», высота липкой шапки
├── exams/
│   ├── exams.js            собранные данные, их читает index.html
│   ├── ap1-YYYY-x.json     готовый экзамен (схема v2)
│   ├── *.text.json         тексты заданий (промежуточный файл)
│   ├── *.figures.json      координаты вырезанных схем
│   ├── katalog.json        правила: что ушло из каталога, что добавили
│   ├── luecken.json        покрытие новых тем каталога (генерируется)
│   ├── cards.json          флешкарты (генерируется)
│   └── topics.override.json  ручные правки тем
├── assets/                 схемы, полные страницы, страницы решений (PNG)
├── raw/                    исходные PDF
├── tools/                  скрипты конвейера
├── books/                  учебники (к симулятору не относятся)
├── _work/                  разобранные решения, черновики
└── _archiv/                старое, можно удалить
```

`assets/` обязательно рядом с `index.html` — иначе картинки не подгрузятся.

---

## Как добавить новый экзамен

Нужен `pymupdf`: `pip install pymupdf`

**1. Схемы и страницы (локально, бесплатно)**

```bash
python tools/extract_figures.py raw/ap1-2027-f-aufgaben.pdf --exam-id ap1-2027-f
python tools/render_loesung.py ap1-2027-f
```

**2. Решения**

Сначала проверь, есть ли текстовый слой:

```bash
python -c "import pymupdf; d=pymupdf.open('raw/ap1-2027-f-loesung.pdf'); print(sum(len(p.get_text()) for p in d))"
```

Больше нескольких тысяч символов — текстовый слой есть, тогда:

```bash
python tools/parse_loesung.py raw/ap1-2027-f-loesung.pdf -o _work/ap1-2027-f.loesung.json
```

Ноль или почти ноль — это скан, решения надо распознавать (см. ниже).

**3. Тексты заданий**

Задания в этих PDF почти всегда сканы. Файл `exams/ap1-2027-f.text.json`
пишется распознаванием — см. раздел «Распознавание».

**4. Сборка**

```bash
python tools/assemble.py ap1-2027-f     # сшить тексты + решения + схемы
python tools/normalize.py               # привести к схеме v2
python tools/tag_topics.py              # проставить темы
python tools/check.py                   # проверить, что всё сошлось
python tools/build_index.py             # пересобрать exams/exams.js
```

`check.py` должен сказать `0 ошибок`. Если сумма баллов не 100 — где-то
потерялась Teilaufgabe.

---

## Распознавание сканов

**Не делай это в чате.** Каждая страница-картинка съедает тысячи токенов
из лимита подписки. В проекте для этого есть `tools/parse_exam.py`, который
ходит в API напрямую с твоего компьютера: один экзамен стоит примерно
$0.35–0.50 реальных денег, и каждая страница кэшируется в `.cache/` —
повторный прогон бесплатный и мгновенный.

Один раз:

```powershell
pip install pymupdf anthropic
setx ANTHROPIC_API_KEY "sk-ant-..."
```

Ключ — на console.anthropic.com → API Keys. **Перезапусти терминал** после
`setx`. Проверка: `python tools/parse_exam.py --list-models`.

Прогон:

```powershell
# холостой — рендер и оценка стоимости, без вызовов API
python tools/parse_exam.py --aufgaben "raw/ap1-2027-f-aufgaben.pdf" --exam-id ap1-2027-f --dry-run

# боевой
python tools/parse_exam.py `
  --aufgaben  "raw/ap1-2027-f-aufgaben.pdf" `
  --loesungen "raw/ap1-2027-f-loesung.pdf" `
  --exam-id   ap1-2027-f `
  --title     "Einrichten eines IT-gestützten Arbeitsplatzes" `
  --part AP1 --year 2027 --season Frühjahr --minutes 90
```

Флаги: `--offline` — только из кэша; `--dpi 300` — схемы чётче; удалить
`.cache/` — заставить перечитать заново.

**Что проверить после.** Vision-модель читает текст хорошо, но это не
детерминированный OCR. Сомнительные символы помечаются `<?>` и подсвечиваются
в интерфейсе жёлтым — сверь их с PDF руками. В первую очередь цены, объёмы,
IP-адреса и маски подсети. Для каждой подзадачи сохранена полная страница,
кнопка «Vollständige Seite ansehen» открывает оригинал.

---

## Скрипты

| Скрипт | Что делает |
|---|---|
| `extract_figures.py` | режет схемы и рендерит полные страницы заданий |
| `render_loesung.py`  | рендерит страницы Lösungs-PDF (для рисунков-эталонов) |
| `parse_loesung.py`   | вытаскивает Musterlösungen из текстового PDF |
| `parse_exam.py`      | распознаёт сканы через Vision API |
| `assemble.py`        | сшивает тексты + решения + схемы в готовый экзамен |
| `normalize.py`       | приводит любой экзамен к схеме v2 |
| `tag_topics.py`      | проставляет темы; ручные правки в `topics.override.json` |
| `check.py`           | валидация перед сборкой |
| `tag_katalog.py`     | помечает вычеркнутые темы, считает пробелы каталога |
| `extract_pruefhilfe.py` | вытаскивает числа и термины для офлайн-проверки |
| `split_felder.py`    | превращает задания-таблицы в отдельные поля ввода |
| `build_cards.py`     | делает флешкарты (`--anki файл.tsv` — экспорт в Anki) |
| `build_index.py`     | собирает `exams/exams.js` |

Полный порядок при правке данных:

```bash
python tools/normalize.py
python tools/tag_topics.py
python tools/tag_katalog.py
python tools/extract_pruefhilfe.py
python tools/split_felder.py --apply
python tools/build_cards.py --anki _work/anki-ap1.tsv
python tools/check.py
python tools/build_index.py
```

Забыла `build_index` — интерфейс покажет старые данные.

---

## Схема данных (v2)

```jsonc
{
  "schemaVersion": 2,
  "examId": "ap1-2026-f",
  "meta":      { "title", "part", "year", "season", "durationMinutes", "maxPoints" },
  "situation": { "text": "...", "assets": [] },
  "tasks": [{
    "id": "a1", "number": 1, "label": "Aufgabe 1", "intro": "...", "maxPoints": 25,
    "subtasks": [{
      "id": "1aa", "label": "aa)", "fullLabel": "1 aa)",
      "groupLabel": null, "groupIntro": null,     // общий текст для aa)/ab)/ac)
      "prompt": "...", "maxPoints": 4,
      "answerType": "text" | "diagram",
      "topics": ["netzwerk", "kalkulation"],
      "solution": { "text": "...", "image": "assets/..._loesung_02.png",
                    "solutionPage": 2, "extractionConfidence": "high" },
      "sourcePage": 2,
      "assets":  [{ "id", "file", "sourcePage", "width", "height" }],
      "pageImage": "assets/ap1-2026-f_seite_02.png",
      "placeholder": null,      // подсказка для задач-рисунков
      "needsReview": false,
      "katalog":  { "status": "veraltet" | "reduziert" | null,
                    "grund": "...", "themen": ["RAID"], "treffer": ["raid"] },
      "pruefung": { "zahlen":   [{ "text": "448 Mbit/s", "wert": 448, "einheit": "Mbit/s" }],
                    "begriffe": ["Vertraulichkeit", "802.3at"] },
      "felder":   [{ "label": "Notebook — Vorteil", "maxPoints": 0.5 }]
    }]
  }],
  "gradingScale": "ihk-100"
}
```

Темы: `projekt`, `kalkulation`, `netzwerk`, `itsicherheit`, `datenschutz`,
`hardware`, `software`, `daten`, `arbeitsplatz`, `ki`, `programmierung`,
`kommunikation`.

---

## Шкала IHK (100 баллов)

| Punkte | Note |
|---|---|
| 100–92 | 1 sehr gut |
| 91–81 | 2 gut |
| 80–67 | 3 befriedigend |
| 66–50 | 4 ausreichend |
| 49–30 | 5 mangelhaft |
| 29–0 | 6 ungenügend |
