// Ideias: lista simples (nome, estilo, nota). "Começar receita" abre a calculadora
// com um rascunho vazio no estilo da ideia, já com o nome dela.
import { dados, salva, ideia, criaIdeia, receita } from "../dados.js?v=20261118134917";
import { NOMES_ESTILO } from "../calculo.js?v=20261118134917";
import { confirma } from "../ui.js?v=20261118134917";
import { icone, capa, aplicaTom, tomVidro, escolheCapa } from "../visual.js?v=20261118134917";

function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
const ESTILOS = [["gelato", "Gelato"], ["icecream", "Sorvete"], ["sorbet", "Sorbet"]];

export function render(el, rota){
  const id = rota.args[0] ? decodeURIComponent(rota.args[0]) : "";
  if (id === "nova"){ const res = lista(el); setTimeout(function(){ novaIdeia(el); }, 0); history.replaceState(null, "", "#/ideias"); return res; }
  return id ? editor(el, id) : lista(el);
}

// Começar: rascunho vazio no estilo da ideia, na calculadora; ao salvar, a receita guarda de qual ideia veio.
async function comeca(alvo){
  const calc = dados().calc;
  if (calc.linhas.length && !calc.versaoId &&
      !(await confirma("A calculadora tem um rascunho não salvo. Começar a receita da ideia mesmo assim?", "Começar"))) return;
  calc.linhas = []; calc.estilo = alvo.estilo || "gelato"; calc.nome = alvo.nome; calc.ideiaId = alvo.id;
  delete calc.receitaId; delete calc.versaoId; delete calc.snapshot; delete calc.notaSugerida;
  salva();
  location.hash = "#/calculadora";
}

// Lista (redesign): anotar rápido no topo; cada ideia é um cartão de vidro claro com o botão Começar.
// Nova ideia em folha (padrão das folhas do app): nome, estilo, nota, capa; Salvar ideia ou Começar receita.
function novaIdeia(el){
  let estilo = "gelato", capaNova = "";
  const veu = document.createElement("div"); veu.className = "ui-veu";
  const f = document.createElement("div"); f.className = "ui-folha nova-ideia"; f.setAttribute("role", "dialog"); f.setAttribute("aria-label", "Nova ideia");
  f.innerHTML = '<span class="puxador"></span><h2>Nova ideia</h2>' +
    '<label class="ui-rotulo" for="nomeNova">Nome</label><input id="nomeNova" class="ui-campo" type="text" maxlength="60" placeholder="Ex.: Gelato de manjericão" enterkeyhint="done">' +
    '<span class="ui-rotulo">Estilo</span><div class="ui-filtros dividir" role="group" aria-label="Estilo">' + ESTILOS.map(function(e){
      return '<button type="button" class="ui-filtro" data-e="' + e[0] + '" aria-pressed="' + (e[0] === estilo) + '">' + e[1] + '</button>'; }).join("") + '</div>' +
    '<label class="ui-rotulo" for="notaNova">Nota</label><textarea id="notaNova" class="ui-campo ideia-texto" rows="3" placeholder="Ingredientes, referências, o que quer testar…"></textarea>' +
    '<div class="ideia-acoes"><button type="button" class="ui-botao preto" id="salvaNova">Salvar ideia</button>' +
      '<button type="button" class="ui-botao vidro ideia-capa-bt" id="capaNova" aria-label="Escolher capa">' + icone("imagem") + '</button></div>' +
    '<button type="button" class="ui-botao vidro largo" id="comecaNova">Começar receita</button>';
  document.body.append(veu, f);
  const fecha = function(){ veu.remove(); f.remove(); };
  veu.addEventListener("click", fecha);
  const nome = f.querySelector("#nomeNova"); setTimeout(function(){ nome.focus(); }, 250);
  f.querySelectorAll("[data-e]").forEach(function(b){ b.addEventListener("click", function(){
    estilo = estilo === b.dataset.e ? null : b.dataset.e;
    f.querySelectorAll("[data-e]").forEach(function(o){ o.setAttribute("aria-pressed", String(o.dataset.e === estilo)); });
  }); });
  f.querySelector("#capaNova").addEventListener("click", function(){
    escolheCapa({titulo:"Capa", semente:nome.value.trim() || "Ideia", atual:capaNova, aoEscolher:function(v){ capaNova = v; }});
  });
  function grava(){
    const n = nome.value.trim(); if (!n){ nome.focus(); return null; }
    const x = criaIdeia(n, estilo, f.querySelector("#notaNova").value);
    if (capaNova) x.capa = capaNova;
    salva(); return x;
  }
  f.querySelector("#salvaNova").addEventListener("click", function(){ if (grava()){ fecha(); lista(el); } });
  f.querySelector("#comecaNova").addEventListener("click", function(){ const x = grava(); if (x){ fecha(); comeca(x); } });
  nome.addEventListener("keydown", function(ev){ if (ev.key === "Enter"){ ev.preventDefault(); f.querySelector("#salvaNova").click(); } });
}

function lista(el){
  document.body.classList.add("ui");
  const db = dados();
  el.innerHTML =
    '<div class="ui-app">' +
    '<header class="ui-cabecalho"><h1>Ideias</h1><button class="ui-redondo" type="button" id="novaIdeia" aria-label="Nova ideia">' + icone("mais") + '</button></header>' +
    '<div class="ui-tela">' +
      (db.ideias.length ? db.ideias.map(function(x){
        const r = x.receitaId && receita(x.receitaId);
        const meta = [x.estilo ? NOMES_ESTILO[x.estilo] : '', r ? 'virou receita' : ''].filter(Boolean).join(' · ');
        const nota = x.nota ? x.nota.split("\n")[0].slice(0, 120) : '';
        return '<section class="ui-bloco ideia-cartao" style="--capa:' + capa(x.nome, x.capa) + ';--ui-tom:' + (tomVidro(x.nome, x.capa) || 'rgba(255,255,255,.24)') + '">' +
          '<a class="ideia-corpo" href="#/ideias/' + encodeURIComponent(x.id) + '">' +
            '<span class="titulo">' + esc(x.nome) + '</span>' +
            (meta ? '<span class="ui-sec">' + esc(meta) + '</span>' : '') +
            (nota ? '<span class="ideia-nota">' + esc(nota) + '</span>' : '') + '</a>' +
          (r ? '<a class="ui-botao vidro-escuro ideia-botao" href="#/receita/' + encodeURIComponent(r.id) + '">Ver receita</a>' :
            '<button type="button" class="ui-botao preto ideia-botao" data-comecar="' + esc(x.id) + '">Começar</button>') +
        '</section>';
      }).join("") : '<p class="ui-sec ideias-vazio">Nenhuma ideia ainda. Toque em + para anotar um sabor que quer testar.</p>') +
    '</div></div>';
  el.querySelector("#novaIdeia").addEventListener("click", function(){ novaIdeia(el); });
  el.querySelectorAll("[data-comecar]").forEach(function(b){ b.addEventListener("click", function(){ const x = ideia(b.dataset.comecar); if (x) comeca(x); }); });
  return {titulo:"Ideias", limpa:function(){ document.body.classList.remove("ui"); }};
}

function editor(el, id){
  const db = dados();
  const nova = id === "nova";
  const x = nova ? {nome:"", estilo:"gelato", nota:""} : ideia(id);
  const limpa = function(){ document.body.classList.remove("ui", "rec"); document.querySelectorAll(".ui-veu,.ui-folha").forEach(function(o){ o.remove(); }); };
  if (!x){
    el.innerHTML = '<p class="muted">Ideia não encontrada.</p>';
    return {titulo:"Ideias", voltar:"#/ideias", voltarRotulo:"Ideias"};
  }
  document.body.classList.add("ui", "rec");
  const r = !nova && x.receitaId && receita(x.receitaId);
  let estilo = x.estilo, capaNova = x.capa || "";
  el.innerHTML =
    '<div class="rec-fundo" id="fundoIdeia" style="--capa:' + capa(x.nome || "Ideia", capaNova || null) + '"></div>' +
    '<div class="ui-app">' +
    '<header class="ui-cabecalho nav"><a class="ui-redondo escuro" href="#/ideias" aria-label="Voltar para Ideias">' + icone("voltar") + '</a>' +
      '<span style="flex:1"></span>' +
      (nova ? '' : '<button class="ui-redondo escuro" type="button" id="opcoes" aria-label="Mais opções">' + icone("opcoes") + '</button>') + '</header>' +
    '<div class="ui-tela rec-tela ideia-tela">' +
      '<section class="ui-cartao ui-vidro-escuro rec-painel ideia-form">' +
        '<label class="ui-rotulo" for="nomeIdeia">Nome</label>' +
        '<input id="nomeIdeia" class="ideia-campo" type="text" maxlength="60" placeholder="Ex.: Gelato de manjericão" value="' + esc(x.nome) + '">' +
        '<span class="ui-rotulo">Estilo</span>' +
        '<div class="rec-tamanhos" id="estiloIdeia" role="group" aria-label="Estilo">' + ESTILOS.map(function(e){
          return '<button type="button" data-e="' + e[0] + '" aria-pressed="' + (e[0] === estilo) + '">' + e[1] + '</button>'; }).join("") + '</div>' +
        '<label class="ui-rotulo" for="notaIdeia">Nota</label>' +
        '<textarea id="notaIdeia" class="ideia-campo ideia-texto" rows="5" placeholder="Ingredientes, referências, o que quer testar…">' + esc(x.nota) + '</textarea>' +
      '</section>' +
      '<div class="ideia-rodape">' +
        (r ? '<p class="lote-estado">Virou a receita “' + esc(r.nome) + '”.</p>' : '') +
        // Linha 1: Salvar ideia (principal) + trocar fundo. Linha 2: Começar receita (ou Ver receita) + Cancelar.
        '<div class="ideia-acoes"><button type="button" class="ui-botao preto" id="salvarIdeia">Salvar ideia</button>' +
          '<button type="button" class="ui-botao vidro-escuro ideia-capa-bt" id="trocaCapa" aria-label="Trocar capa">' + icone("imagem") + '</button></div>' +
        '<div class="ideia-acoes">' +
          (r ? '<a class="ui-botao vidro-escuro" href="#/receita/' + encodeURIComponent(r.id) + '">Ver receita</a>' :
            '<button type="button" class="ui-botao vidro-escuro" id="comecar">Começar receita</button>') +
          (nova ? '<a class="ui-botao vidro-escuro" href="#/ideias">Cancelar</a>' : '') + '</div>' +
      '</div>' +
    '</div></div>';

  aplicaTom(el, x.nome || "Ideia", capaNova || null);
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
    if (capaNova) alvo.capa = capaNova; else delete alvo.capa;
    salva();
    return alvo;
  }
  // Capa: degradê ou foto; vale ao salvar (ou ao começar).
  el.querySelector("#trocaCapa").addEventListener("click", function(){
    const nome = el.querySelector("#nomeIdeia").value.trim() || x.nome || "Ideia";
    escolheCapa({titulo:"Capa", semente:nome, atual:capaNova, foto:true, aoEscolher:function(valor){
      capaNova = valor; el.querySelector("#fundoIdeia").style.setProperty("--capa", capa(nome, capaNova || null)); aplicaTom(el, nome, capaNova || null);
      if (!nova){ if (capaNova) x.capa = capaNova; else delete x.capa; if (!salva()){ delete x.capa; alert("A foto é grande demais para guardar. Tente outra."); } }
    }});
  });
  el.querySelector("#salvarIdeia").addEventListener("click", function(){ if (grava()) location.hash = "#/ideias"; });
  const com = el.querySelector("#comecar");
  if (com) com.addEventListener("click", function(){ const alvo = grava(); if (alvo) comeca(alvo); });
  // Mais opções: Excluir ideia (vermelho) e Fechar.
  const op = el.querySelector("#opcoes");
  if (op) op.addEventListener("click", function(){
    const veu = document.createElement("div"); veu.className = "ui-veu";
    const f = document.createElement("div"); f.className = "ui-folha"; f.setAttribute("role", "dialog"); f.setAttribute("aria-label", "Opções da ideia");
    f.innerHTML = '<span class="puxador"></span><h2>' + esc(x.nome) + '</h2>' +
      '<button type="button" class="ui-botao vidro largo perigo" id="excluirIdeia">Excluir ideia</button>' +
      '<button type="button" class="ui-botao preto largo" id="fechar">Fechar</button>';
    document.body.append(veu, f);
    const fecha = function(){ veu.remove(); f.remove(); };
    veu.addEventListener("click", fecha); f.querySelector("#fechar").addEventListener("click", fecha);
    f.querySelector("#excluirIdeia").addEventListener("click", async function(){
      fecha();
      if (!(await confirma("Excluir a ideia “" + x.nome + "”?", "Excluir", true))) return;
      db.ideias = db.ideias.filter(function(o){ return o !== x; }); salva(); location.hash = "#/ideias";
    });
  });
  return {titulo:"Ideias", voltar:"#/ideias", voltarRotulo:"Ideias", limpa:limpa};
}
