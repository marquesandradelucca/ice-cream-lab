// Banco local do app: um único objeto salvo no localStorage a cada mudança.
// Até a etapa 5 os dados ficam só no aparelho; por isso existe o backup em arquivo.
import { ING_BASE } from "./ingredientes-base.js?v=20261119143400";
import { PRESETS } from "./calculo.js?v=20261119143400";
import { ESTUDO_BASE } from "./estudo-base.js?v=20261119143400";
import { notificaMudanca } from "./sync.js?v=20261119143400";

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
    fotos: [],   // biblioteca de fotos {id, dado}; capas guardam "foto:<id>" e reaproveitam a mesma foto
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
    // Ingredientes novos da lista base chegam para quem já tem dados (uma vez só; se apagar, não volta).
    const NOVOS = ["ovo","clara","essBaunilha","essMenta","essLaranja","polpaMelancia","sucoLimao","polpaMorango","polpaMaracuja","polpaJabuticaba","polpaMelao","polpaAbacaxi","polpaAmora","polpaFramboesa","polpaManga","sucoLaranja","polpaPera","polpaTangerina","hortela","sucoLaranjaBaia","sucoLaranjaLima","sucoLaranjaValencia","polpaLaranjaSeleta","cascaLaranja","polpaMirtilo","polpaLichia","coco","leiteCoco","callebaut7030"];
    db.ingBaseAdicionados = db.ingBaseAdicionados || [];
    const faltam = NOVOS.filter(function(id){ return db.ingBaseAdicionados.indexOf(id) < 0; });
    if (faltam.length){
      faltam.forEach(function(id){
        if (!db.ingredientes.some(function(i){ return i.id === id; })){
          const b = ING_BASE.find(function(i){ return i.id === id; });
          if (b) db.ingredientes.push(copia(b));
        }
        db.ingBaseAdicionados.push(id);
      });
      salva();
    }
    // Polpas revistas pela TACO: atualiza só as que o usuário não editou.
    if (!db.frutasTaco){
      const ANTES = {polpaMelancia:[3.4,1.6,1.2], polpaMorango:[2.4,2.0,0.5], polpaMelao:[1.9,1.5,4.4], polpaAbacaxi:[2.1,1.7,6.0]};
      Object.keys(ANTES).forEach(function(id){
        const i = db.ingredientes.find(function(x){ return x.id === id; });
        const b = ING_BASE.find(function(x){ return x.id === id; });
        const v = ANTES[id], ac = (i && i.ac) || {};
        if (i && b && ac.frutose === v[0] && ac.dextrose === v[1] && ac.sacarose === v[2]) i.ac = copia(b.ac);
      });
      db.frutasTaco = true; salva();
    }
    // Frutas revistas pela TBCA: atualiza só as que o usuário não editou desde a versão anterior.
    if (!db.frutasTbca){
      const ANTES = {"polpaMelancia": [0.2, 4.4, 2.1, 1.5, 1.2], "sucoLimao": [0.2, 1.1, 1.0, 0.4, 6.0], "polpaMorango": [0.3, 2.5, 2.1, 0.5, 3.0], "polpaMaracuja": [0.2, 5.5, 5.0, 3.0, 4.0], "polpaJabuticaba": [0.1, 6.0, 5.0, 1.0, 3.5], "polpaMelao": [0.2, 1.7, 1.4, 4.1, 1.8], "polpaAbacaxi": [0.1, 2.4, 1.9, 7.0, 2.2], "polpaAmora": [0.5, 2.4, 2.3, 0.1, 7.0], "polpaFramboesa": [0.7, 2.4, 1.9, 0.2, 8.0], "polpaManga": [0.2, 3.6, 1.6, 5.5, 3.3], "sucoLaranja": [0.1, 2.0, 1.8, 3.8, 1.5], "polpaPera": [0.1, 6.9, 3.2, 0.9, 3.8], "polpaTangerina": [0.1, 2.0, 1.7, 5.0, 1.9]};
      Object.keys(ANTES).forEach(function(id){
        const i = db.ingredientes.find(function(x){ return x.id === id; });
        const b = ING_BASE.find(function(x){ return x.id === id; });
        if (!i || !b) return;
        const ac = i.ac || {}, v = ANTES[id];
        if (i.gord === v[0] && ac.frutose === v[1] && ac.dextrose === v[2] && ac.sacarose === v[3] && i.outros === v[4]){
          i.ac = copia(b.ac); i.outros = b.outros; i.gord = b.gord; if (b.nota) i.nota = b.nota;
        }
      });
      db.frutasTbca = true; salva();
    }
    db.ingredientes.forEach(function(i){
      if (i.id === "callebaut7030" && i.gord === 38 && i.outros === 32){
        const b = ING_BASE.find(function(x){ return x.id === "callebaut7030"; });
        i.gord = b.gord; i.outros = b.outros; i.ac = copia(b.ac); i.nota = b.nota; salva();
      }
    });
    db.ingredientes.forEach(function(i){ if (i.id === "sucoLaranja" && i.nome === "Suco de laranja"){ i.nome = "Suco de laranja pera"; salva(); } });
  } else {
    db = vazio();
    if (migraLegado(db)) db.migradoDoLegado = new Date().toISOString();
    converteLegado();
    salva();
  }
  if (semeiaEstudo()) salva();
  // Pede ao navegador para não apagar os dados sozinho (ajuda, mas não garante).
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function(){});
  return db;
}

export function dados(){ return db; }

// Estudo: na primeira vez, as páginas vêm do conteúdo trazido do Notion. Depois são editáveis no app.
function semeiaEstudo(){
  if (Array.isArray(db.estudo) && db.estudo.length){
    // Revisão do tema de estilos (16/11): troca o texto antigo, se ainda não foi editado no app.
    const e = db.estudo.find(function(p){ return p.id === "estilos"; });
    const novo = ESTUDO_BASE.find(function(p){ return p.id === "estilos"; });
    let mudou = false;
    if (e && novo && e.titulo === "Gelato, sorvete e ice cream: diferenças"){ e.titulo = novo.titulo; e.md = novo.md; mudou = true; }
    // Bibliografia revisada (16/11): troca a versão anterior, se não foi editada à mão.
    const bib = db.estudo.find(function(p){ return p.id === "bibliografia"; });
    const bibNova = ESTUDO_BASE.find(function(p){ return p.id === "bibliografia"; });
    if (bib && bibNova && bib.md.indexOf("Também citados") >= 0){ bib.md = bibNova.md; mudou = true; }
    // PAC e POD ganhou a explicação sobre a calculadora (16/11), se o tema não foi editado.
    const pac = db.estudo.find(function(p){ return p.id === "pac-pod"; });
    const pacNovo = ESTUDO_BASE.find(function(p){ return p.id === "pac-pod"; });
    if (pac && pacNovo && !pac.anterior && pac.md.indexOf("Na calculadora do app") < 0 && pacNovo.md.indexOf(pac.md.trim()) === 0){ pac.md = pacNovo.md; mudou = true; }
    // Temas que passaram a existir no conteúdo base (ex.: Bibliografia) entram no fim.
    ESTUDO_BASE.forEach(function(p, i){
      if (!db.estudo.some(function(x){ return x.id === p.id; })){ db.estudo.push({id:p.id, grupo:p.grupo, titulo:p.titulo, md:p.md, ordem:i}); mudou = true; }
    });
    return mudou;
  }
  db.estudo = ESTUDO_BASE.map(function(p, i){ return {id:p.id, grupo:p.grupo, titulo:p.titulo, md:p.md, ordem:i}; });
  return true;
}
export function paginaEstudo(id){ return db.estudo.find(function(p){ return p.id === id; }) || null; }
export function originalEstudo(id){ return ESTUDO_BASE.find(function(p){ return p.id === id; }) || null; }

// Ideias: nome, estilo e nota livre. "Começar receita" leva à calculadora.
export function ideia(id){ return db.ideias.find(function(x){ return x.id === id; }) || null; }
export function criaIdeia(nome, estilo, nota){
  const x = {id:novoId(), nome:String(nome || "").slice(0, 60), estilo:estilo || null, nota:String(nota || ""), criada:new Date().toISOString()};
  db.ideias.unshift(x);
  return x;
}

// Grava no aparelho e avisa a sincronização (que envia para a nuvem quando há login e internet).
export function salva(){
  const ok = salvaLocal();
  try { notificaMudanca(); } catch (e) {}
  return ok;
}
// Só grava no aparelho (usado pela sincronização ao aplicar o que veio da nuvem).
export function salvaLocal(){
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
