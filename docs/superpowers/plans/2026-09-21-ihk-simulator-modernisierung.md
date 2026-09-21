# IHK-Simulator Modernisierung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Исправить подтверждённые ошибки данных и содержания и модернизировать дашборд без регрессий существующих экзаменов и пользовательских данных.

**Architecture:** Новая логика реализуется в небольших UMD-модулях, которые работают и в браузере, и в Node-тестах. Существующий монолитный сценарий остаётся совместимым и вызывает новые функции через window. Визуальные изменения добавляются отдельной CSS-слойкой и минимальной семантической разметкой.

**Tech Stack:** HTML5, CSS, vanilla JavaScript, Service Worker, Node.js assert, Python validators.

**Spec:** docs/superpowers/specs/2026-09-21-ihk-simulator-modernisierung-design.md

## Global Constraints

- Никаких внешних runtime-зависимостей и обязательного build-процесса.
- Импорт версий 1–3 остаётся рабочим.
- Удаляются только localStorage-ключи с префиксом ihk2:.
- Все десять экзаменов сохраняют 100 BE.
- Текущие глобальные точки входа остаются доступными.
- Светлая и тёмная темы, печать, мобильная версия и PWA сохраняются.

---

### Task 1: Надёжный импорт и замена данных

**Files:**
- Create: gen/storage-tools.js
- Create: tests/storage-tools.test.js
- Modify: index.html

**Interfaces:**
- Produces: IHKStorageTools.appKeys(storage, prefix)
- Produces: IHKStorageTools.replaceAppStorage(storage, incoming, prefix)
- Produces: IHKStorageTools.backupFingerprint(data)
- Produces: IHKStorageTools.hasImported(storage, fingerprint)
- Produces: IHKStorageTools.markImported(storage, fingerprint)
- Consumes: Web Storage compatible object with length, key, getItem, setItem and removeItem.

- [ ] **Step 1: Write failing replacement tests**

~~~js
const assert = require("assert");
const tools = require("../gen/storage-tools.js");
const storage = fakeStorage({
  "ihk2:answers": "old",
  "ihk2:orphan": "stale",
  "other:key": "keep"
});
tools.replaceAppStorage(storage, {"ihk2:answers": "new"}, "ihk2:");
assert.equal(storage.getItem("ihk2:answers"), "new");
assert.equal(storage.getItem("ihk2:orphan"), null);
assert.equal(storage.getItem("other:key"), "keep");
~~~

- [ ] **Step 2: Run node tests/storage-tools.test.js and verify module-not-found failure**
- [ ] **Step 3: Implement the minimal UMD storage module**
- [ ] **Step 4: Run the test and verify replacement cases pass**
- [ ] **Step 5: Add failing idempotency tests for one backup fingerprint**
- [ ] **Step 6: Implement import history with a bounded list of 100 fingerprints**
- [ ] **Step 7: Integrate version 4 backupId and duplicate-merge prevention in index.html**
- [ ] **Step 8: Run storage test, tools/check.py and generator tests**
- [ ] **Step 9: Commit as fix: make backup import idempotent**

### Task 2: Каталог статусов и качество компендия

**Files:**
- Create: gen/kompendium-status.js
- Create: tests/kompendium-status.test.js
- Create: tools/check_kompendium.py
- Modify: gen/kompendium.js
- Modify: index.html
- Modify: selected gen/komp/*.js content labels

**Interfaces:**
- Produces: IHKKompStatus.forSlug(slug)
- Produces: IHKKompStatus.decorate(root, slug)
- Produces statuses ap1, ap2, vertiefung and historisch.

- [ ] **Step 1: Write failing Node tests for sql-grundlagen, virtualisierung and an AP1 topic**
- [ ] **Step 2: Verify the test fails because the status module is absent**
- [ ] **Step 3: Implement the status registry and safe badge renderer**
- [ ] **Step 4: Integrate status badges and explanatory text into compendium rendering**
- [ ] **Step 5: Write failing Python validator tests for empty Musterantwort and stale AP1 claims**
- [ ] **Step 6: Implement tools/check_kompendium.py with actionable file counts**
- [ ] **Step 7: Hide empty answer headings in the rendered document and show one neutral notice**
- [ ] **Step 8: Correct explicit AP1 claims in SQL and virtualisation articles without deleting useful AP2 content**
- [ ] **Step 9: Run content validator, Node status tests and tools/check.py**
- [ ] **Step 10: Commit as fix: classify compendium topics by current catalog**

### Task 3: Корректные показатели прогресса

**Files:**
- Create: gen/progress-tools.js
- Create: tests/progress-tools.test.js
- Modify: index.html
- Modify: gen/archiv.js where archived topic summaries are consumed.

**Interfaces:**
- Produces: IHKProgressTools.summary(got, gradedMax, allMax, gradedCount, allCount)
- Produces: IHKProgressTools.distributeByTopics(subtasks, scores)

- [ ] **Step 1: Write a failing test separating gradedRate from examRate**
- [ ] **Step 2: Write a failing test that splits a 6-BE task over two topics as 3 BE each**
- [ ] **Step 3: Verify both tests fail because the module is absent**
- [ ] **Step 4: Implement pure calculation functions**
- [ ] **Step 5: Replace duplicated inline calculations with the tested functions**
- [ ] **Step 6: Label the grade as Zwischenstand while tasks remain open**
- [ ] **Step 7: Run the new test and all existing generator tests**
- [ ] **Step 8: Commit as fix: separate accuracy from exam progress**

### Task 4: Семантика, подписи и локальная блокировка

**Files:**
- Create: tests/accessibility-structure.test.js
- Modify: index.html
- Modify: gen/auth.js
- Modify: gen/auth.css

**Interfaces:**
- Existing DOM IDs remain unchanged.
- PIN overlay exposes role=dialog, aria-modal=true and an aria-live error area.

- [ ] **Step 1: Write failing structural tests for h1, seven labels and dialog attributes**
- [ ] **Step 2: Verify the test reports the current missing labels**
- [ ] **Step 3: Add explicit labels or aria-label without changing control IDs**
- [ ] **Step 4: Give the start page a stable h1 and repair heading order**
- [ ] **Step 5: Add dialog semantics, initial focus, focus trap and focus restoration**
- [ ] **Step 6: Change visible wording from protection to local device lock**
- [ ] **Step 7: Run structural test and browser keyboard smoke check**
- [ ] **Step 8: Commit as fix: improve dashboard accessibility**

### Task 5: Современный спокойный дашборд

**Files:**
- Create: gen/dashboard-modern.css
- Create: tests/dashboard-structure.test.js
- Modify: index.html
- Modify: gen/start.js

**Interfaces:**
- Existing section and button IDs remain unchanged.
- New classes: dashboard-hero, dashboard-stats, dashboard-stat, dashboard-actions, section-heading and status-chip.

- [ ] **Step 1: Write failing structural tests for the new dashboard landmarks and accessible card grouping**
- [ ] **Step 2: Verify the tests fail on the current markup**
- [ ] **Step 3: Add the separate stylesheet after existing feature styles**
- [ ] **Step 4: Build a hero block with one recommended action and four compact metrics**
- [ ] **Step 5: Group existing controls under Heute, Prüfungen, Üben and Nachschlagen without removing actions**
- [ ] **Step 6: Convert secondary long areas to native details/summary where content may be skipped**
- [ ] **Step 7: Add responsive 44-pixel targets, reduced-motion handling, stronger focus and dark theme tokens**
- [ ] **Step 8: Capture desktop and mobile screenshots and compare against the baseline**
- [ ] **Step 9: Verify no horizontal overflow and no console errors**
- [ ] **Step 10: Commit as feat: modernize the learning dashboard**

### Task 6: Честный офлайн-текст и документация

**Files:**
- Modify: gen/pwa.js
- Modify: gen/offline.js
- Modify: sw.js
- Modify: README.md
- Create: tests/pwa-copy.test.js

**Interfaces:**
- Service worker cache names remain compatible with existing cached images.
- PWA copy distinguishes shell availability from per-exam image download.

- [ ] **Step 1: Write a failing copy test that rejects the unconditional all-exams-offline promise**
- [ ] **Step 2: Verify the test fails on current gen/pwa.js**
- [ ] **Step 3: Replace the install text with precise offline behavior**
- [ ] **Step 4: Increment the service worker app-cache version and retain image cache name**
- [ ] **Step 5: Update README counts to 17 outdated tasks and 76 BE and explain heuristic weights**
- [ ] **Step 6: Add a non-official-app and source-maintenance notice**
- [ ] **Step 7: Run copy test, tools/check.py and offline browser reload**
- [ ] **Step 8: Commit as docs: clarify offline and catalog status**

### Task 7: Полная регрессионная проверка и интеграция

**Files:**
- Modify only files required by failures discovered here.

**Interfaces:**
- No new API; validates every interface produced in Tasks 1–6.

- [ ] **Step 1: Run every new Node test**
- [ ] **Step 2: Run python tools/check.py and tools/check_kompendium.py**
- [ ] **Step 3: Run gen/test2.js through gen/test5.js**
- [ ] **Step 4: Run node --check over every JavaScript file**
- [ ] **Step 5: Parse every JSON file and compile every Python file**
- [ ] **Step 6: Browser-test start, first exam, answer save, import UI, mobile and offline reload**
- [ ] **Step 7: Audit accessible names, duplicate IDs, heading order and touch targets**
- [ ] **Step 8: Review git diff for accidental generated or user-data files**
- [ ] **Step 9: Merge the verified branch into main without rewriting history**
- [ ] **Step 10: Re-run the complete verification from the original project folder**
