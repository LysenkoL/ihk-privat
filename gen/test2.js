global.window = global;
const M=["kern","vorlagen-kalkulation","vorlagen-netz","vorlagen-text","vorlagen-katalog","vorlagen-diagramm","vorlagen-modelle","vorlagen-problemfaelle","vorlagen-tabellen","vorlagen-sicherheit","vorlagen-hardware","vorlagen-fachthemen","vorlagen-ki","vorlagen-einheiten"];
M.forEach(m=>require("./"+m+".js"));
const G = window.GEN;
function antwort(f){
  switch(f.typ){
    case "zahl": return String(f.loesung).replace(".", ",");
    case "auswahl": return f.loesung;
    case "mehrfachwahl": return f.loesung;
    case "aussagen": { const o={}; f.aussagen.forEach((a,i)=>o[i]=a.wahr?"w":"f"); return o; }
    case "zuordnung": { const o={}; f.paare.forEach((p,i)=>o[i]=p[1]); return o; }
    case "modell": return f.soll.map(row=>{ const o={}; f.spalten.forEach(sp=>{ const v=row[sp.key]; o[sp.key]= Array.isArray(v)? (sp.art==="menge"? v.join(", ") : v[0]) : (v==null?"":String(v)); }); return o; });
    case "knoten": return f.soll.map(k=>({name:k.name, typ:k.typ, nach:(k.nach||[]).join(", "), bed:(k.bed||[]).join(", ")}));
    case "flussbild": { const o={}; (f.luecken||[]).forEach((l,i)=>o[i]=l.soll); return o; }
    case "rechenweg": return f.soll.map(x=>x.roh).join("\n");
    case "raster": { const o={}; f.zeilen.forEach((z,zi)=>z.zellen.forEach((c,ci)=>{ if(c.eingabe) o[zi+"-"+ci] = c.text!=null ? (Array.isArray(c.text)?c.text[0]:c.text) : String(c.loesung).replace(".",","); })); return o; }
    default: {
      const n = f.noetig || f.erwartet.length;
      return f.erwartet.slice(0,n).map(s => s[0] + " – dadurch wird der Betrieb im Unternehmen spuerbar sicherer und einfacher").join("\n");
    }
  }
}
let schlecht = 0, geprueft = 0;
for (const v of G.alleVorlagen()){
  for (let s=0; s<40; s++){
    const a = G.erzeuge(v.id, s*104729+7);
    const ein = {}; a.felder.forEach(f => ein[f.nr] = antwort(f));
    const r = G.pruefeAufgabe(a, ein); geprueft++;
    if (r.punkte < a.maxPoints - 1e-6){
      schlecht++;
      if (schlecht < 25) console.log(v.id, "seed", s, r.punkte + "/" + a.maxPoints,
        r.felder.filter(x=>x.punkte < x.be-1e-9).map(x=>x.label+" ["+x.status+"|"+x.text+"]").join(" ;; "));
      break;
    }
  }
}
console.log("geprueft", geprueft, "· nicht voll:", schlecht);
