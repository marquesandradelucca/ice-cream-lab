// Ideias: lista simples (nome, estilo, nota). "Começar receita" abre a calculadora
// com um rascunho vazio no estilo da ideia, já com o nome dela.
import { dados, salva, ideia, criaIdeia, receita } from "../dados.js?v=20261117020901";
import { NOMES_ESTILO } from "../calculo.js?v=20261117020901";
import { confirma } from "../ui.js?v=20261117020901";

function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
const ESTILOS = [["gelato", "Gelato"], ["icecream", "Sorvete"], ["sorbet", "Sorbet"]];

export function render(el, rota){
  const id = rota.args[0] ? decodeURIComponent(rota.args[0]) : "";
  return id ? editor(el, id) : lista(el);
}

function lista(el){
  const db = dados();
  // Anotar rápido: só o nome, Enter ou "Anotar". Estilo e nota, se quiser, depois, tocando na ideia.
  el.innerHTML =
    '<div class="anotar-ideia"><input id="novaIdeia" class="campo-texto campo-estudo" type="text" maxlength="60" enterkeyhint="done" placeholder="Anotar uma ideia…" aria-label="Nova ideia">' +
      '<button type="button" class="pilula-preta" id="anotar">Anotar</button></div>' +
    (db.ideias.length ? '<section class="lista-cards espaco-lista">' + db.ideias.map(function(x){
      const r = x.receitaId && receita(x.receitaId);
      return '<a class="item-lista" href="#/ideias/' + encodeURIComponent(x.id) + '">' +
        '<span class="item-nome">' + esc(x.nome) + '</span>' +
        (function(){ const partes = [x.estilo ? NOMES_ESTILO[x.estilo] : '', r ? 'virou receita' : '', x.nota ? esc(x.nota.split("\n")[0].slice(0, 60)) : ''].filter(Boolean);
          return partes.length ? '<span class="item-desc">' + partes.join(' · ') + '</span>' : ''; })() + '</a>';
    }).join("") + '</section>' :
      '<p class="muted bloco-vazio espaco-lista">Nenhuma ideia ainda.</p>');
  const inp = el.querySelector("#novaIdeia");
  function anota(){
    const nome = inp.value.trim(); if (!nome){ inp.focus(); return; }
    criaIdeia(nome, null, ""); salva(); lista(el);
    el.querySelector("#novaIdeia").focus();
  }
  el.querySelector("#anotar").addEventListener("click", anota);
  inp.addEventListener("keydown", function(ev){ if (ev.key === "Enter"){ ev.preventDefault(); anota(); } });
  return {titulo:"Ideias"};
}

function editor(el, id){
  const db = dados();
  const nova = id === "nova";
  const x = nova ? {nome:"", estilo:"gelato", nota:""} : ideia(id);
  if (!x){
    el.innerHTML = '<p class="muted">Ideia não encontrada.</p>';
    return {titulo:"Ideias", voltar:"#/ideias", voltarRotulo:"Ideias"};
  }
  const r = !nova && x.receitaId && receita(x.receitaId);
  let estilo = x.estilo;
  el.innerHTML =
    '<div class="cabeca-receita"><h2 class="titulo-receita">' + (nova ? 'Nova ideia' : 'Ideia') + '</h2></div>' +
    '<label class="rotulo" for="nomeIdeia">Nome</label>' +
    '<input id="nomeIdeia" class="campo-texto campo-estudo" type="text" maxlength="60" placeholder="Ex.: Gelato de manjericão" value="' + esc(x.nome) + '">' +
    '<p class="rotulo rotulo-espaco">Estilo</p>' +
    '<div class="seg" id="estiloIdeia" role="group" aria-label="Estilo">' + ESTILOS.map(function(e){
      return '<button type="button" data-e="' + e[0] + '" aria-pressed="' + (e[0] === estilo) + '">' + e[1] + '</button>';
    }).join("") + '</div>' +
    '<label class="rotulo rotulo-espaco" for="notaIdeia">Nota</label>' +
    '<textarea id="notaIdeia" class="campo-texto campo-estudo" rows="4" placeholder="Ingredientes, referências, o que quer testar…">' + esc(x.nota) + '</textarea>' +
    (r ? '<p class="estado-final espaco-curto">Virou a receita “' + esc(r.nome) + '”.</p>' : '') +
    '<div class="acoes-final">' +
      (r ? '<a class="botao largo" href="#/receita/' + encodeURIComponent(r.id) + '">Ver receita</a>' :
        '<button type="button" class="botao largo" id="comecar">Começar receita</button>') +
      '<div class="acoes-ing">' +
        (nova ? '<a class="pilula-cinza" href="#/ideias">Cancelar</a>' : '') +
        '<button type="button" class="pilula-cinza" id="salvarIdeia">Salvar ideia</button></div>' +
    '</div>' +
    (nova ? '' : '<div class="acoes-linha"><button type="button" class="botao perigo" id="excluirIdeia">Excluir ideia</button></div>');

  el.querySelectorAll("[data-e]").forEach(function(b){
    b.addEventListener("click", function(){
      estilo = estilo === b.dataset.e ? null : b.dataset.e;   // tocar de novo desmarca (estilo é opcional)
      el.querySelectorAll("[data-e]").forEach(function(o){ o.setAttribute("aria-pressed", String(o.dataset.e === estilo)); });
    });
  });
  function grava(){
    const nome = el.querySelector("#nomeIdeia").value.trim();
    if (!nome){ el.querySelector("#nomeIdeia").focus(); return null; }
    const alvo = nova ? criaIdeia(nome, estilo, "") : x;
    alvo.nome = nome.slice(0, 60); alvo.estilo = estilo; alvo.nota = el.querySelector("#notaIdeia").value;
    salva();
    return alvo;
  }
  el.querySelector("#salvarIdeia").addEventListener("click", function(){ if (grava()) location.hash = "#/ideias"; });
  const com = el.querySelector("#comecar");
  if (com) com.addEventListener("click", async function(){
    const alvo = grava(); if (!alvo) return;
    const calc = db.calc;
    if (calc.linhas.length && !calc.versaoId &&
        !(await confirma("A calculadora tem um rascunho não salvo. Começar a receita da ideia mesmo assim?", "Começar"))) return;
    // Rascunho vazio no estilo da ideia; ao salvar, a receita guarda de qual ideia veio.
    calc.linhas = []; calc.estilo = alvo.estilo || "gelato"; calc.nome = alvo.nome; calc.ideiaId = alvo.id;
    delete calc.receitaId; delete calc.versaoId; delete calc.snapshot; delete calc.notaSugerida;
    salva();
    location.hash = "#/calculadora";
  });
  const exc = el.querySelector("#excluirIdeia");
  if (exc) exc.addEventListener("click", async function(){
    if (!(await confirma("Excluir a ideia “" + x.nome + "”?", "Excluir", true))) return;
    db.ideias = db.ideias.filter(function(o){ return o !== x; }); salva(); location.hash = "#/ideias";
  });
  return {titulo:"Ideias", voltar:"#/ideias", voltarRotulo:"Ideias"};
}
