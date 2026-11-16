// Banco local do app: um único objeto salvo no localStorage a cada mudança.
// Até a etapa 5 os dados ficam só no aparelho; por isso existe o backup em arquivo.
import { ING_BASE } from "./ingredientes-base.js?v=20261116194924";
import { PRESETS } from "./calculo.js?v=20261116194924";

const CHAVE = "icelab-v1";
const LEGADO = {calc:"mistura-v1", produtos:"mistura-produtos-v1", receitas:"mistura-receitas-v1"};
const VERSAO_DADOS = 2;

let db = null;

export function novoId(){
  return "p:" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function copia(o){ return JSON.parse(JSON.stringify(o)); }

function vazio(){
  return {
    versaoDados: VERSAO_DADOS,
    ingredientes: copia(ING_BASE),
    calc: {estilo:"gelato", nome:PRESETS.gelato.nome, linhas:copia(PRESETS.gelato.linhas)},
    receitasLegado: [],   // receitas salvas na calculadora antiga; viram receitas de verdade na etapa 2
    receitas: [], versoes: [], lotes: [], ideias: [], estudo: [],
    ultima: null
  };
}

function lerJSON(chave){
  try { return JSON.parse(localStorage.getItem(chave)); } catch (e) { return null; }
}

// Converte a composição de um produto/personalizado antigo ({gord, ac, outros}) para o modelo novo.
function deCompAntiga(nome, c){
  return {id:novoId(), nome:String(nome || "Personalizado").slice(0, 60),
    gord:Number(c.gord) || 0, ac:{sacarose:Number(c.ac) || 0}, outros:Number(c.outros) || 0};
}

// Traz os dados da calculadora antiga (mesmo endereço no GitHub Pages) para o modelo novo.
// Nada é apagado das chaves antigas: elas continuam lá como cópia de segurança.
function migraLegado(d){
  let achou = false;
  const produtos = lerJSON(LEGADO.produtos);
  if (Array.isArray(produtos)){
    produtos.forEach(function(p){
      if (!p || !p.id || !p.nome) return;
      d.ingredientes.push({id:String(p.id), nome:String(p.nome).slice(0, 60),
        gord:Number(p.gord) || 0, ac:{sacarose:Number(p.ac) || 0}, outros:Number(p.outros) || 0});
      achou = true;
    });
  }
  // Linhas "personalizadas" viram ingredientes da lista, para aparecerem no seletor.
  const personalizados = {};
  function converteLinhas(linhas){
    return (linhas || []).filter(function(l){ return l && l.id; }).map(function(l){
      if (l.id === "custom"){
        const c = l.comp || {};
        const chave = [c.nome, c.gord, c.ac, c.outros].join("|");
        if (!personalizados[chave]){
          const ing = deCompAntiga(c.nome, c);
          d.ingredientes.push(ing);
          personalizados[chave] = ing.id;
        }
        return {id:personalizados[chave], g:Number(l.g) || 0};
      }
      return {id:String(l.id), g:Number(l.g) || 0};
    });
  }
  const recs = lerJSON(LEGADO.receitas);
  if (Array.isArray(recs)){
    recs.forEach(function(r){
      if (!r || !r.nome || !Array.isArray(r.linhas)) return;
      d.receitasLegado.push({id:String(r.id || novoId()), nome:String(r.nome).slice(0, 60),
        estilo:r.estilo || "gelato", linhas:converteLinhas(r.linhas)});
      achou = true;
    });
  }
  const calc = lerJSON(LEGADO.calc);
  if (calc && Array.isArray(calc.linhas)){
    d.calc = {estilo:calc.estilo || "gelato", nome:"", linhas:converteLinhas(calc.linhas)};
    const r = d.receitasLegado.find(function(x){ return x.id === calc.receitaAtual; });
    if (r) d.calc.nome = r.nome;
    else if (calc.receitaAtual && calc.receitaAtual.indexOf("preset:") === 0){
      const p = PRESETS[calc.receitaAtual.slice(7)];
      if (p) d.calc.nome = p.nome;
    }
    achou = true;
  }
  return achou;
}

export function carrega(){
  const salvo = lerJSON(CHAVE);
  if (salvo && salvo.versaoDados){
    db = Object.assign(vazio(), salvo);
    if (converteLegado()) salva();
    // Não existe mais "rascunho": toda receita que não é final está em teste.
    let mudou = false;
    db.receitas.forEach(function(r){ if (r.status !== "final" && r.status !== "em teste"){ r.status = "em teste"; mudou = true; } });
    if (mudou) salva();
  } else {
    db = vazio();
    if (migraLegado(db)) db.migradoDoLegado = new Date().toISOString();
    converteLegado();
    salva();
  }
  // Pede ao navegador para não apagar os dados sozinho (ajuda, mas não garante).
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function(){});
  return db;
}

export function dados(){ return db; }

export function salva(){
  try { localStorage.setItem(CHAVE, JSON.stringify(db)); return true; }
  catch (e) { return false; }
}

// ---------- Ingredientes ----------
export function ingrediente(id){
  return db.ingredientes.find(function(i){ return i.id === id; }) || null;
}

export function ingredienteUsado(id){
  return db.calc.linhas.some(function(l){ return l.id === id; });
}

// ---------- Receitas e versões ----------
// Composição usada por uma versão, guardada junto dela: se o ingrediente for corrigido
// depois, a versão continua com os números de quando foi salva.
const CAMPOS_COMP = ["nome", "gord", "slng", "soro", "outros", "ac", "estab", "contaTotal"];
export function snapshotDe(linhas, base){
  const snap = {};
  linhas.forEach(function(l){
    const i = (base && base[l.id]) || ingrediente(l.id);
    if (!i || snap[l.id]) return;
    const c = {};
    CAMPOS_COMP.forEach(function(k){ if (i[k] !== undefined) c[k] = JSON.parse(JSON.stringify(i[k])); });
    snap[l.id] = c;
  });
  return snap;
}

// Ingredientes cuja composição atual difere da guardada na versão.
export function ingredientesMudados(snapshot){
  return Object.keys(snapshot || {}).filter(function(id){
    const atual = ingrediente(id);
    if (!atual) return true;
    const agora = snapshotDe([{id:id}])[id], antes = snapshot[id];
    return ["gord", "slng", "soro", "outros", "ac", "estab", "contaTotal"].some(function(k){
      return JSON.stringify(agora[k] || null) !== JSON.stringify(antes[k] || null);
    });
  });
}

export function receita(id){ return db.receitas.find(function(r){ return r.id === id; }) || null; }
export function versao(id){ return db.versoes.find(function(v){ return v.id === id; }) || null; }
export function versoesDe(receitaId){
  return db.versoes.filter(function(v){ return v.receitaId === receitaId; })
    .sort(function(a, b){ return a.numero - b.numero; });
}

export function criaReceita(nome, estilo, origem){
  const r = {id:novoId(), nome:String(nome || "Receita sem nome").slice(0, 60), estilo:estilo || "gelato",
    status:"em teste", versaoFinal:null, preparo:"", ideia:origem || null,
    criada:new Date().toISOString()};
  db.receitas.push(r);
  return r;
}

export function novaVersao(receitaId, linhas, estilo, nota, snapshotBase){
  const vs = versoesDe(receitaId);
  const limpas = linhas.map(function(l){ return {id:l.id, g:Number(l.g) || 0}; });
  const v = {id:novoId(), receitaId:receitaId, numero:vs.length ? vs[vs.length - 1].numero + 1 : 1,
    linhas:limpas, estilo:estilo, data:new Date().toISOString(), nota:String(nota || ""),
    snapshot:snapshotDe(limpas, snapshotBase)};
  db.versoes.push(v);
  const r = receita(receitaId); if (r) r.estilo = estilo;
  return v;
}

export function excluiReceita(id){
  db.receitas = db.receitas.filter(function(r){ return r.id !== id; });
  db.versoes = db.versoes.filter(function(v){ return v.receitaId !== id; });
  db.lotes = db.lotes.filter(function(l){ return l.receitaId !== id; });
  if (db.calc.receitaId === id){ delete db.calc.receitaId; delete db.calc.versaoId; delete db.calc.snapshot; }
}

// Receitas salvas na calculadora antiga viram receitas de verdade, cada uma com sua v1.
function converteLegado(){
  if (!db.receitasLegado || !db.receitasLegado.length) return false;
  db.receitasLegado.forEach(function(rl){
    const r = criaReceita(rl.nome, rl.estilo);
    const v = novaVersao(r.id, rl.linhas, rl.estilo, "Trazida da calculadora antiga.");
    if (db.calc.nome === rl.nome && !db.calc.receitaId){ db.calc.receitaId = r.id; db.calc.versaoId = v.id; }
  });
  db.receitasLegado = [];
  return true;
}

// ---------- Lotes (testes) ----------
// Um lote é criado ao tocar em "Fazer lote": já nasce com data e versão, e cada toque
// durante o preparo fica salvo. Se o app fechar, ele retoma do passo em que parou.
export function lote(id){ return db.lotes.find(function(l){ return l.id === id; }) || null; }

export function criaLote(versaoId){
  const v = versao(versaoId); if (!v) return null;
  const l = {id:novoId(), receitaId:v.receitaId, versaoId:v.id, inicio:new Date().toISOString(), fim:null,
    status:"em andamento", passo:0, escala:1,
    pesado:v.linhas.map(function(x){ return {id:x.id, previsto:Number(x.g) || 0, real:null, ok:false}; }),
    avaliacao:{textura:[], dureza:null, docura:null, nota:null}, obs:"", proximo:""};
  db.lotes.push(l);
  const r = receita(v.receitaId);
  return l;
}

export function excluiLote(id){ db.lotes = db.lotes.filter(function(l){ return l.id !== id; }); }

// ---------- Backup em arquivo ----------
export function exportaBackup(){
  const pacote = Object.assign({app:"ice-cream-lab", exportadoEm:new Date().toISOString()}, db);
  const blob = new Blob([JSON.stringify(pacote, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  const hoje = new Date().toISOString().slice(0, 10);
  a.href = URL.createObjectURL(blob);
  a.download = "ice-cream-lab-backup-" + hoje + ".json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
}

// Aceita o backup deste app (substitui tudo) ou o "meus-dados.json" da calculadora antiga (junta).
export function importaBackup(texto){
  const bruto = JSON.parse(texto);
  if (bruto && bruto.versaoDados){
    const novo = Object.assign(vazio(), bruto);
    delete novo.app; delete novo.exportadoEm;
    if (!Array.isArray(novo.ingredientes)) throw new Error("Arquivo sem lista de ingredientes.");
    db = novo; salva();
    return "Backup restaurado.";
  }
  const produtos = Array.isArray(bruto) ? bruto : (bruto && bruto.produtos) || [];
  const recs = Array.isArray(bruto) ? [] : (bruto && bruto.receitas) || [];
  if (!produtos.length && !recs.length) throw new Error("Não reconheci este arquivo.");
  let np = 0, nr = 0;
  produtos.forEach(function(p){
    if (!p || !p.nome) return;
    const igual = db.ingredientes.find(function(x){ return x.nome === p.nome; });
    const comp = {gord:Number(p.gord) || 0, ac:{sacarose:Number(p.ac) || 0}, outros:Number(p.outros) || 0};
    if (igual) Object.assign(igual, comp);
    else db.ingredientes.push(Object.assign({id:p.id ? String(p.id) : novoId(), nome:String(p.nome).slice(0, 60)}, comp));
    np++;
  });
  recs.forEach(function(r){
    if (!r || !r.nome || !Array.isArray(r.linhas)) return;
    const linhas = r.linhas.map(function(l){
      if (l.id === "custom" && l.comp){
        const ing = deCompAntiga(l.comp.nome, l.comp); db.ingredientes.push(ing);
        return {id:ing.id, g:Number(l.g) || 0};
      }
      return {id:String(l.id), g:Number(l.g) || 0};
    });
    db.receitasLegado = db.receitasLegado.filter(function(x){ return x.nome !== r.nome; });
    db.receitasLegado.push({id:String(r.id || novoId()), nome:String(r.nome), estilo:r.estilo || "gelato", linhas:linhas});
    nr++;
  });
  converteLegado();
  salva();
  return "Importados da calculadora antiga: " + np + " produto(s) e " + nr + " receita(s).";
}
