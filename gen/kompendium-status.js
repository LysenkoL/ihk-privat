/* ============================================================================
   Katalogstatus der Kompendium-Themen.
   Fachlich nützliche AP2- und Vertiefungsseiten bleiben erhalten, werden aber
   nicht mehr als aktueller AP1-Kern ausgegeben.
   ========================================================================== */
"use strict";

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.IHKKompStatus = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DEFAULT = {
    code: "ap1",
    label: "AP1 aktuell",
    text: "Dieses Thema gehört zum aktuellen AP1-Lernbereich."
  };

  const STATUS = {
    "sql-grundlagen": {
      code: "ap2",
      label: "AP2",
      text: "SQL gehört nach dem aktualisierten Katalog nicht mehr zum AP1-Kern."
    },
    "virtualisierung": {
      code: "vertiefung",
      label: "Vertiefung / AP2",
      text: "Für AP1 stehen virtuelle Desktops sowie SaaS und DaaS im Vordergrund. Hypervisor-Typen, Container und Docker sind Vertiefung."
    },
    "cloud-modelle-iaas-paas-saas": {
      code: "vertiefung",
      label: "Vertiefung",
      text: "SaaS ist für AP1 relevant; die ausführliche Abgrenzung von IaaS und PaaS dient vor allem der Vertiefung."
    },
    "algorithmen-ablaufdiagramme": {
      code: "ap1",
      label: "AP1 mit Kataloghinweis",
      text: "Pseudocode und UML-Aktivitätsdiagramme sind aktuell. PAP und Struktogramm sind nur noch historischer Vergleich."
    },
    "datensicherungskonzepte": {
      code: "ap1",
      label: "AP1 mit Kataloghinweis",
      text: "Datensicherung bleibt relevant. RAID-Level gehören nach dem aktualisierten Katalog nicht mehr zum AP1-Kern."
    },
    "bedrohungsszenarien": {
      code: "ap1",
      label: "AP1 mit Kataloghinweis",
      text: "Bedrohungsszenarien bleiben AP1-relevant. RAID-Details in diesem Kapitel sind Vertiefung und kein aktueller AP1-Kern."
    }
  };

  function forSlug(slug) {
    const value = STATUS[String(slug || "")] || DEFAULT;
    return { code: value.code, label: value.label, text: value.text };
  }

  function countEmptyAnswers(html) {
    const pattern = /<h5[^>]*>\s*Musterantwort\s*<\/h5>\s*(?:<p[^>]*>\s*<\/p>\s*)*(?=<(?:h[1-6]|hr)\b|$)/gi;
    return (String(html || "").match(pattern) || []).length;
  }

  function rewriteText(slug, value) {
    let text = String(value == null ? "" : value);
    const replacements = {
      "sql-grundlagen": [
        [/SQL-Grundlagen in der AP1/g, "SQL-Grundlagen für AP2 und zur fachlichen Vertiefung"],
        [/In der AP1 geht es/g, "In AP2 und in der Vertiefung geht es"],
        [/AP1-Kernidee/g, "Grundidee"],
        [/AP1-Hinweis/g, "Hinweis"],
        [/AP1-Merksätze/g, "SQL-Merksätze"],
        [/AP1-Merksatz/g, "SQL-Merksatz"],
        [/Typische AP1-Fallen/g, "Typische SQL-Fallen"],
        [/Typische AP1-Aufgaben/g, "Typische AP2-Aufgaben"],
        [/Für die AP1 solltest du können/g, "Für AP2 beziehungsweise zur Vertiefung solltest du können"],
        [/Allgemeine AP1-Einordnung/g, "Aktuelle Einordnung"]
      ],
      "virtualisierung": [
        [/Virtualisierung in der AP1/g, "Virtualisierung: AP1-Kern und Vertiefung"],
        [/Für die AP1 ist Virtualisierung wichtig, weil/g, "Virtualisierung ist fachlich wichtig, weil"],
        [/Virtualisierung taucht in der AP1 oft/g, "In älteren AP1-Aufgaben tauchte Virtualisierung häufig"],
        [/AP1-Bezug/g, "Katalogbezug"],
        [/AP1-Kernidee/g, "Grundidee"],
        [/AP1-Hinweis/g, "Vertiefungshinweis"],
        [/Typische AP1-Aufgaben zu Hypervisor und Docker/g, "Vertiefungsaufgaben zu Hypervisor und Docker"],
        [/Typische AP1-Aufgaben/g, "Vertiefungsaufgaben"],
        [/In der AP1 könnten Aufgaben so formuliert sein/g, "Als Vertiefungsaufgaben sind möglich"],
        [/AP1-Merksätze/g, "Merksätze zur Vertiefung"],
        [/Für die AP1 solltest du können/g, "Zur fachlichen Vertiefung kannst du lernen"],
        [/Allgemeine AP1-Einordnung/g, "Aktuelle Einordnung"]
      ]
    };
    (replacements[String(slug || "")] || []).forEach(([from, to]) => {
      text = text.replace(from, to);
    });
    return text;
  }

  function rewriteCatalogClaims(root, slug) {
    if (!root || !root.ownerDocument || !root.ownerDocument.createTreeWalker) return 0;
    const filter = (root.ownerDocument.defaultView && root.ownerDocument.defaultView.NodeFilter) ||
      (typeof NodeFilter !== "undefined" ? NodeFilter : null);
    if (!filter) return 0;
    const walker = root.ownerDocument.createTreeWalker(root, filter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let changed = 0;
    nodes.forEach(node => {
      const next = rewriteText(slug, node.nodeValue);
      if (next !== node.nodeValue) {
        node.nodeValue = next;
        changed++;
      }
    });
    return changed;
  }

  function isEmptyElement(node) {
    return node && node.nodeType === 1 && node.tagName === "P" &&
      !String(node.textContent || "").trim() && !node.querySelector("img,table,code,pre");
  }

  function isSourcePlaceholder(value) {
    return /(?:Kursunterlagen aus\s*:|Vorhandene Workspace-Seite\s*:)/i
      .test(String(value || "")) &&
      !/https?:\/\//i.test(String(value || ""));
  }

  function cleanSourcePlaceholders(root) {
    let count = 0;
    Array.from(root.querySelectorAll("li")).forEach(item => {
      if (!isSourcePlaceholder(item.textContent)) return;
      item.remove();
      count++;
    });
    Array.from(root.querySelectorAll("ul,ol")).forEach(list => {
      if (!list.querySelector("li") && !String(list.textContent || "").trim()) list.remove();
    });
    if (count) {
      const note = root.ownerDocument.createElement("p");
      note.className = "kp-quellenhinweis";
      note.textContent = count + " interne Quellenverweise ohne nachvollziehbare Adresse wurden ausgeblendet.";
      root.appendChild(note);
    }
    return count;
  }

  function replaceEmptyAnswerHeadings(root) {
    let count = 0;
    Array.from(root.querySelectorAll("h5")).forEach(heading => {
      if (String(heading.textContent || "").trim().toLowerCase() !== "musterantwort") return;
      let next = heading.nextSibling;
      while (next && (next.nodeType === 3 && !String(next.nodeValue || "").trim())) next = next.nextSibling;
      while (isEmptyElement(next)) {
        const remove = next;
        next = next.nextSibling;
        remove.remove();
        while (next && next.nodeType === 3 && !String(next.nodeValue || "").trim()) next = next.nextSibling;
      }
      const empty = !next || (next.nodeType === 1 && /^(H[1-6]|HR)$/.test(next.tagName));
      if (!empty) return;
      const notice = root.ownerDocument.createElement("p");
      notice.className = "kp-antwort-fehlt";
      notice.textContent = "Für diese Übung ist noch keine geprüfte Musterantwort hinterlegt.";
      heading.replaceWith(notice);
      count++;
    });
    return count;
  }

  function decorate(root, slug) {
    if (!root || !root.ownerDocument) return 0;
    if (!root.querySelector(".kp-kataloghinweis")) {
      const status = forSlug(slug);
      const notice = root.ownerDocument.createElement("aside");
      notice.className = "kp-kataloghinweis ist-" + status.code;
      notice.setAttribute("aria-label", "Katalogstatus");
      const strong = root.ownerDocument.createElement("strong");
      strong.textContent = status.label;
      const text = root.ownerDocument.createElement("span");
      text.textContent = status.text;
      notice.append(strong, text);
      root.prepend(notice);
    }
    rewriteCatalogClaims(root, slug);
    const empty = replaceEmptyAnswerHeadings(root);
    cleanSourcePlaceholders(root);
    return empty;
  }

  return {
    forSlug,
    countEmptyAnswers,
    isSourcePlaceholder,
    rewriteText,
    decorate,
    replaceEmptyAnswerHeadings,
    rewriteCatalogClaims,
    cleanSourcePlaceholders
  };
});
