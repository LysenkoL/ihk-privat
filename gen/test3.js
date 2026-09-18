global.window = global;
const M=["kern","vorlagen-kalkulation","vorlagen-netz","vorlagen-text","vorlagen-katalog","vorlagen-diagramm","vorlagen-modelle","vorlagen-problemfaelle","vorlagen-tabellen","vorlagen-sicherheit","vorlagen-hardware","vorlagen-fachthemen","vorlagen-ki","vorlagen-einheiten"];
M.forEach(m=>require("./"+m+".js"));
const G = window.GEN;
const bloedsinn = "Man macht das halt so wie immer und dann passt das schon irgendwie ganz gut.\nDas ist wichtig.\nJa.\nWeiss nicht.";
function falsch(f){
  switch(f.typ){
    case "zahl": return String(G.runde(f.loesung*1.37+3.7,2)).replace(".",",");
    case "auswahl": return f.optionen.find(o=>String(o)!==String(f.loesung));
    case "aussagen": { const o={}; f.aussagen.forEach((a,i)=>o[i]=a.wahr?"f":"w"); return o; }
    case "zuordnung": { const o={}; f.paare.forEach((p,i)=>{ o[i]=f.optionen.find(x=>x!==p[1]); }); return o; }
    case "modell": return [{},{}].map(()=>{ const o={}; f.spalten.forEach(sp=>o[sp.key]="Quatsch"); return o; });
    case "knoten": return [{name:"Irgendwas", typ:"Aktion", nach:"Blabla", bed:""}];
    case "flussbild": { const o={}; (f.luecken||[]).forEach((l,i)=>o[i]= l.art==="typ"?"Aktion" : l.art==="bed"?"[ja]" : "Irgendein Schritt"); return o; }
    case "raster": { const o={}; f.zeilen.forEach((z,zi)=>z.zellen.forEach((c,ci)=>{ if(c.eingabe) o[zi+"-"+ci] = c.text!=null? "irgendwas" : String(G.runde((c.loesung||1)*1.4+2,2)).replace(".",","); })); return o; }
    default: return bloedsinn;
  }
}
let summe=0, max=0, schlimm=0;
for (const v of G.alleVorlagen()){
  for (let s=0;s<40;s++){
    const a = G.erzeuge(v.id, s*7717+3);
    const ein={}; a.felder.forEach(f=>ein[f.nr]=falsch(f));
    const r = G.pruefeAufgabe(a, ein);
    summe += r.punkte; max += a.maxPoints;
    if (r.punkte > a.maxPoints*0.25 && schlimm<15){ schlimm++;
      console.log("zu grosszuegig:", v.id, r.punkte+"/"+a.maxPoints,
        r.felder.filter(x=>x.punkte>0).map(x=>x.label+" ("+x.punkte+")").join(" ;; ")); }
  }
}
console.log("Falschantworten bekommen", G.runde(summe/max*100,1), "% der Punkte");
