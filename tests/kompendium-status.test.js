"use strict";

const assert = require("assert");
const status = require("../gen/kompendium-status.js");

assert.deepEqual(status.forSlug("sql-grundlagen"), {
  code: "ap2",
  label: "AP2",
  text: "SQL gehört nach dem aktualisierten Katalog nicht mehr zum AP1-Kern."
});

assert.equal(status.forSlug("virtualisierung").code, "vertiefung");
assert.equal(status.forSlug("cloud-modelle-iaas-paas-saas").code, "vertiefung");
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
  status.isSourcePlaceholder("Kursunterlagen aus : Die Seite wurde für Linux genutzt."),
  true
);
assert.equal(
  status.isSourcePlaceholder("BSI: https://www.bsi.bund.de/"),
  false
);

console.log("kompendium-status: catalog and empty-answer behavior OK");
