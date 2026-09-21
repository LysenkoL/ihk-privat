"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const status = require("../gen/kompendium-status.js");

assert.deepEqual(status.forSlug("sql-grundlagen"), {
  code: "ap2",
  label: "AP2",
  text: "SQL gehört nach dem aktualisierten Katalog nicht mehr zum AP1-Kern."
});

assert.equal(status.forSlug("virtualisierung").code, "vertiefung");
assert.equal(status.forSlug("cloud-modelle-iaas-paas-saas").code, "vertiefung");
assert.equal(status.forSlug("algorithmen-ablaufdiagramme").code, "historisch");
assert.equal(status.forSlug("datensicherungskonzepte").code, "historisch");
assert.equal(status.forSlug("bedrohungsszenarien").label, "AP1 mit Kataloghinweis");
assert.equal(status.forSlug("osi-referenzmodell").code, "ap1");

const empty = "<h4>Aufgabe 1</h4><h5>Musterantwort</h5><hr><h4>Aufgabe 2</h4>";
const filled = "<h4>Aufgabe 1</h4><h5>Musterantwort</h5><p>Eine Antwort.</p>";
assert.equal(status.countEmptyAnswers(empty), 1);
assert.equal(status.countEmptyAnswers(filled), 0);
assert.equal(
  status.rewriteText("sql-grundlagen", "SQL-Grundlagen in der AP1"),
  "SQL-Grundlagen für AP2 und zur fachlichen Vertiefung"
);
assert.equal(
  status.rewriteText("virtualisierung", "Typische AP1-Aufgaben zu Hypervisor und Docker"),
  "Vertiefungsaufgaben zu Hypervisor und Docker"
);
assert.equal(
  status.rewriteText("cloud-modelle-iaas-paas-saas", "Für die AP1 sind vor allem IaaS, PaaS und SaaS wichtig."),
  "Für AP1 stehen SaaS und DaaS im Vordergrund; IaaS und PaaS sind Vertiefung."
);
assert.equal(
  status.rewriteText("algorithmen-ablaufdiagramme", "Besonders wichtig sind Programmablaufplan (PAP), Struktogramm nach Nassi-Shneiderman, Pseudocode."),
  "Aktuell wichtig sind Pseudocode und UML-Aktivitätsdiagramme; PAP und Struktogramm dienen nur als historischer Vergleich."
);
assert.equal(
  status.rewriteText("datensicherungskonzepte", "Für die AP1 sind Backup-Arten und RAID-Level besonders wichtig."),
  "Für AP1 sind Backup-Arten besonders wichtig; RAID-Level gehören nicht mehr zum AP1-Kern."
);
assert.equal(
  status.isSourcePlaceholder("Kursunterlagen aus : Die Seite wurde für Linux genutzt."),
  true
);
assert.equal(
  status.isSourcePlaceholder("BSI: https://www.bsi.bund.de/"),
  false
);

function article(slug) {
  const context = { window: { KOMP_TEXT: {} } };
  const file = path.join(__dirname, "..", "gen", "komp", slug + ".js");
  vm.runInNewContext(fs.readFileSync(file, "utf8"), context);
  return status.rewriteText(slug, context.window.KOMP_TEXT[slug]);
}

assert.doesNotMatch(article("cloud-modelle-iaas-paas-saas"), /Für die AP1 sind vor allem\s*<strong>IaaS, PaaS und SaaS/i);
assert.doesNotMatch(article("algorithmen-ablaufdiagramme"), /Besonders wichtig sind Programmablaufplan \(PAP\)/i);
assert.doesNotMatch(article("algorithmen-ablaufdiagramme"), /Algorithmus, PAP, Struktogramm, Pseudocode und Aktivitätsdiagramm unterscheiden/i);
assert.doesNotMatch(article("algorithmen-ablaufdiagramme"), /PAP-Symbole lesen und anwenden/i);
assert.doesNotMatch(article("algorithmen-ablaufdiagramme"), /Struktogramm lesen und erstellen/i);
assert.doesNotMatch(article("datensicherungskonzepte"), /Für die AP1 sind[^<]{0,120}RAID-Level/i);

console.log("kompendium-status: catalog and empty-answer behavior OK");
