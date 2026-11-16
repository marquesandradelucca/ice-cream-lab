// Página de uma receita: status, versões, modo de preparo e a receita pronta com escala.
// Rotas: #/receita/<id> (versões e edição) e #/receita/<id>/pronta (para usar na bancada).
import { dados, salva, receita, versao, versoesDe, excluiReceita, ingrediente, criaLote } from "../dados.js?v=20261116194924";
import { confirma } from "../ui.js?v=20261116194924";
import { atualizaVoltar } from "../app.js?v=20261116194924";
import { resumoLote, dataCurta as dataLote } from "./lote.js?v=20261116194924";
import { calcula, NOMES_ESTILO, n } from "../calculo.js?v=20261116194924";

function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function dataCurta(iso){
  try { return new Date(iso).toLocaleDateString("pt-BR", {day:"2-digit", month:"short", year:"numeric"}); } catch (e) { return ""; }
}
function compDe(v){ return function(id){ return (v.snapshot && v.snapshot[id]) || ingrediente(id); }; }
function gramas(g){ return g < 10 ? n(g, 1) : n(Math.round(g), 0); }

// "Final" não fica no seletor: só se marca dentro do card da versão, que diz qual é.
// Uma receita está "em teste" até uma versão ser marcada como final (no card da versão).

export function render(el, rota){
  const r = receita(decodeURIComponent(rota.args[0] || ""));
  if (!r){
    el.innerHTML = '<p class="muted">Receita não encontrada.</p><a class="botao" href="#/receitas">Receitas prontas</a>';
    return {titulo:"Receita", voltar:"#/receitas", voltarRotulo:"Receitas"};
  }
  if (rota.args[1] === "pronta") return pronta(el, r);
  return detalhe(el, r);
}

// O que mudou de uma versão para a seguinte: quantidades, ingredientes e estilo.
function diferencas(ant, v){
  if (!ant) return [];
  function soma(linhas){ const o = {}; linhas.forEach(function(l){ o[l.id] = (o[l.id] || 0) + (Number(l.g) || 0); }); return o; }
  const a = soma(ant.linhas), b = soma(v.linhas), out = [];
  function nome(id){ const i = compDe(v)(id) || compDe(ant)(id); return i ? i.nome : "(ingrediente removido)"; }
  Object.keys(b).forEach(function(id){
    if (!(id in a)) out.push({t:"novo", txt:"+ " + nome(id) + " " + gramas(b[id]) + " g"});
    else if (Math.abs(a[id] - b[id]) > 0.001) out.push({t:"mudou", txt:nome(id) + " " + gramas(a[id]) + " → " + gramas(b[id]) + " g"});
  });
  Object.keys(a).forEach(function(id){ if (!(id in b)) out.push({t:"saiu", txt:"− " + nome(id)}); });
  if (ant.estilo !== v.estilo) out.push({t:"mudou", txt:"estilo " + NOMES_ESTILO[ant.estilo] + " → " + NOMES_ESTILO[v.estilo]});
  return out;
}

function detalhe(el, r, abertas){
  const db = dados();
  const vs = versoesDe(r.id);
  // Lote: continua o que estiver em andamento ou começa um novo com a versão final (ou a mais recente).
  const abertos = db.lotes.filter(function(l){ return l.receitaId === r.id && l.status !== "concluido"; })
    .sort(function(a, b){ return b.inicio.localeCompare(a.inicio); });
  const vLote = (r.versaoFinal && versao(r.versaoFinal)) || vs[vs.length - 1];
  function lotesDa(v){ return db.lotes.filter(function(l){ return l.versaoId === v.id; }).sort(function(a, b){ return b.inicio.localeCompare(a.inicio); }); }
  function botaoLote(l){
    const vv = versao(l.versaoId);
    return '<a class="botao largo" href="#/lote/' + encodeURIComponent(l.id) + (l.status === "aguardando" ? '/avaliar' : '') + '">' +
      (l.status === "aguardando" ? 'Avaliar lote' : 'Continuar lote') + (vv ? ' (v' + vv.numero + ', ' + dataLote(l.inicio) + ')' : '') + '</a>';
  }
  // Quais cards estavam abertos, para não fecharem ao redesenhar a página.
  if (!abertas) abertas = vs.length ? [vs[vs.length - 1].id] : [];

  el.innerHTML =
    '<div class="cabeca-receita">' +
      '<label class="rotulo-nome" for="nomeReceita">Nome</label>' +
      '<input class="titulo-receita titulo-editavel" id="nomeReceita" type="text" maxlength="60" enterkeyhint="done" aria-label="Nome da receita" value="' + esc(r.nome) + '">' +
      '<span class="muted pequeno">' + NOMES_ESTILO[r.estilo] + '</span></div>' +
    '<div class="bloco-status">' +
    (r.status === "final" && versao(r.versaoFinal) ?
      '<p class="estado-final">Receita final: v' + versao(r.versaoFinal).numero + '</p>' +
      '<a class="botao largo" href="#/receita/' + encodeURIComponent(r.id) + '/pronta">Ver receita</a>' : "") +
    abertos.map(botaoLote).join("") +
    (vs.length ? '<button type="button" class="' + (r.status === "final" || abertos.length ? 'pilula-cinza' : 'pilula-preta') + ' largo-pilula" id="fazerLote">' +
        (abertos.length ? 'Fazer outro lote' : 'Fazer lote') + '</button>' : '') +
    '</div>' +
    '<h2 class="subtitulo">Versões</h2>' +
    '<section class="lista-versoes" id="versoes">' + vs.slice().reverse().map(function(v){
      const idx = vs.indexOf(v), ant = idx > 0 ? vs[idx - 1] : null;
      const comp = compDe(v), res = calcula(v.linhas, comp);
      const final = r.versaoFinal === v.id;
      const difs = diferencas(ant, v);
      return '<details class="versao cartao' + (final ? " final" : "") + '" data-v="' + esc(v.id) + '"' + (abertas.indexOf(v.id) >= 0 ? " open" : "") + '>' +
        '<summary class="versao-topo"><span class="versao-num">v' + v.numero + (final ? ' · final' : '') + '</span>' +
        '<span class="versao-data muted pequeno">' + dataCurta(v.data) + '<span class="chevron" aria-hidden="true"></span></span></summary>' +
        '<div class="versao-corpo">' +
        '<div class="versao-nota-linha"><p class="versao-nota' + (v.nota ? '' : ' muted') + '">' + (v.nota ? esc(v.nota) : 'Sem nota') + '</p></div>' +
        (ant ? '<div class="versao-difs"><span class="muted pequeno">Mudou desde a v' + ant.numero + ':</span>' +
          (difs.length ? difs.map(function(d){ return '<span class="dif dif-' + d.t + '">' + esc(d.txt) + '</span>'; }).join("") : '<span class="muted pequeno">nada</span>') + '</div>' : '') +
        '<div class="versao-qtds">' + v.linhas.map(function(l){
          const i = comp(l.id);
          return '<div class="linha-pronta"><span>' + esc(i ? i.nome : "(ingrediente removido)") + '</span><span class="num">' + gramas(Number(l.g) || 0) + ' g</span></div>';
        }).join("") + '</div>' +
        '<p class="muted pequeno">' + n(res.peso, 0) + ' g · gord. ' + n(res.gord, 1) + '% · açúc. ' + n(res.ac, 1) +
          '% · POD ' + n(res.pod, 0) + ' · PAC ' + n(res.pac, 0) +
          '</p>' +
        (lotesDa(v).length ? '<div class="versao-lotes"><span class="muted pequeno">Lotes desta versão</span>' + lotesDa(v).map(function(l){
          return '<a class="lote-linha" href="#/lote/' + encodeURIComponent(l.id) + '"><span>' + dataLote(l.inicio) + '</span><span class="muted">' + esc(resumoLote(l)) + '</span></a>';
        }).join("") + '</div>' : '') +
        '<div class="versao-acoes"><button type="button" class="pilula-cinza" data-nota="' + esc(v.id) + '">Editar nota</button><a class="pilula-cinza" href="#/calculadora/v/' + encodeURIComponent(v.id) + '">Nova versão a partir desta</a>' +
        (final ? '' : '<button type="button" class="pilula-preta" data-final="' + esc(v.id) + '">marcar como final</button>') + '</div></div></details>';
    }).join("") + '</section>' +
    '<h2 class="subtitulo">Modo de preparo</h2>' +
    '<textarea class="campo-texto" id="preparo" rows="6" placeholder="Passo a passo: pesar, pasteurizar, maturar, bater…">' + esc(r.preparo) + '</textarea>' +
    '<p class="muted pequeno">Salvo sozinho. Aparece na receita pronta.</p>' +
    '<div class="acoes-linha"><button type="button" class="botao perigo" id="excluir">Excluir receita</button></div>';

  function redesenha(){
    const abertos = Array.prototype.map.call(el.querySelectorAll("details.versao[open]"), function(d){ return d.dataset.v; });
    detalhe(el, r, abertos);
  }

  // Nome editável: vale para a receita e para a calculadora, se ela estiver aberta lá.
  el.querySelector("#nomeReceita").addEventListener("input", function(ev){
    const nome = ev.target.value.trim(); if (!nome) return;
    r.nome = nome.slice(0, 60);
    if (db.calc.receitaId === r.id) db.calc.nome = r.nome;
    salva();
  });
  el.querySelector("#nomeReceita").addEventListener("blur", function(ev){ if (!ev.target.value.trim()) ev.target.value = r.nome; });
  el.querySelector("#nomeReceita").addEventListener("keydown", function(ev){ if (ev.key === "Enter") ev.target.blur(); });


  async function marcaFinal(id){
    const v = versao(id); if (!v) return;
    if (!(await confirma("Marcar a v" + v.numero + " como versão final? Ela vai para a lista de receitas prontas.", "Confirmar"))) return;
    r.versaoFinal = id; r.status = "final"; salva(); redesenha();
  }
  el.querySelectorAll("[data-final]").forEach(function(b){
    b.addEventListener("click", function(){ marcaFinal(b.dataset.final); });
  });

  // Editar a nota de uma versão (só a nota; as quantidades salvas não mudam).
  el.querySelectorAll("[data-nota]").forEach(function(b){
    b.addEventListener("click", function(){
      const v = versao(b.dataset.nota); if (!v) return;
      const linha = b.closest("details").querySelector(".versao-nota-linha");
      linha.innerHTML = '<input class="campo-texto" type="text" maxlength="140" enterkeyhint="done" placeholder="O que mudou nesta versão?">' +
        '<button type="button" class="pilula-cinza">ok</button>';
      const inp = linha.querySelector("input"); inp.value = v.nota || ""; inp.focus();
      function confirma(){ v.nota = inp.value.trim(); salva(); redesenha(); }
      linha.querySelector("button").addEventListener("click", confirma);
      inp.addEventListener("keydown", function(ev){ if (ev.key === "Enter"){ ev.preventDefault(); confirma(); } });
    });
  });

  const btLote = el.querySelector("#fazerLote");
  if (btLote) btLote.addEventListener("click", function(){
    const l = criaLote(vLote.id); salva();
    if (l) location.hash = "#/lote/" + encodeURIComponent(l.id);
  });
  el.querySelector("#preparo").addEventListener("input", function(ev){ r.preparo = ev.target.value; salva(); });
  el.querySelector("#excluir").addEventListener("click", async function(){
    if (!(await confirma("Excluir “" + r.nome + "” e todas as " + vs.length + " versões? Isso não pode ser desfeito (a não ser por um backup).", "Excluir", true))) return;
    excluiReceita(r.id); salva(); location.hash = "#/";
  });
  // O status pode mudar nesta tela; o voltar acompanha (em teste → Testes, senão → Receitas).
  const emTeste = r.status !== "final";
  atualizaVoltar(emTeste ? "#/testes" : "#/receitas", emTeste ? "Testes" : "Receitas");
  return {titulo:"Receita", limpa:function(){},
    voltar:emTeste ? "#/testes" : "#/receitas", voltarRotulo:emTeste ? "Testes" : "Receitas"};
}

// Receita pronta: quantidades da versão final, escala por tamanho de lote e preparo.
function pronta(el, r){
  const v = r.versaoFinal && versao(r.versaoFinal);
  if (!v){
    el.innerHTML = '<p class="muted">Esta receita ainda não tem versão final.</p><a class="botao" href="#/receita/' + encodeURIComponent(r.id) + '">Ver versões</a>';
    return {titulo:"Receita pronta", voltar:"#/receitas", voltarRotulo:"Receitas"};
  }
  const comp = compDe(v);
  const base = calcula(v.linhas, comp).peso || 1;
  let alvo = Math.round(base);

  el.innerHTML =
    '<div class="cabeca-receita"><h2 class="titulo-receita">' + esc(r.nome) + '</h2>' +
      '<span class="muted pequeno">' + NOMES_ESTILO[r.estilo] + ' · v' + v.numero + '</span></div>' +
    '<section class="cartao">' +
      '<div class="linha-lote"><span class="rotulo">Tamanho do lote</span>' +
        '<div class="qtd"><button type="button" class="passo" data-dir="-1" aria-label="Diminuir o lote">−</button>' +
        '<label class="campo-g"><input type="number" id="lote" inputmode="decimal" min="1" step="50" aria-label="Tamanho do lote em gramas"><span aria-hidden="true">g</span></label>' +
        '<button type="button" class="passo" data-dir="1" aria-label="Aumentar o lote">+</button></div></div>' +
      '<div class="atalhos-lote">' + [250, 500, 1000].map(function(g){ return '<button type="button" class="pilula-cinza" data-g="' + g + '">' + (g < 1000 ? g + ' g' : g / 1000 + ' kg') + '</button>'; }).join("") + '</div>' +
      '<div id="quantidades"></div>' +
    '</section>' +
    '<h2 class="subtitulo">Modo de preparo</h2>' +
    '<section class="cartao">' + (r.preparo ? '<div class="preparo">' + esc(r.preparo).replace(/\n/g, "<br>") + '</div>' :
      '<p class="muted sem-margem">Sem modo de preparo ainda.</p>') + '</section>' +
    '<a class="pilula-cinza" href="#/receita/' + encodeURIComponent(r.id) + '">versões e edição</a>';

  const elLote = el.querySelector("#lote");
  function desenha(){
    const f = alvo / base;
    elLote.value = alvo;
    el.querySelector("#quantidades").innerHTML = v.linhas.map(function(l){
      const i = comp(l.id);
      return '<div class="linha-pronta"><span>' + esc(i ? i.nome : "(ingrediente removido)") + '</span><span class="num">' + gramas(l.g * f) + ' g</span></div>';
    }).join("");
    el.querySelectorAll(".atalhos-lote button").forEach(function(b){ b.classList.toggle("ativo", Number(b.dataset.g) === alvo); });
  }
  elLote.addEventListener("input", function(){ const x = Number(elLote.value); if (x > 0){ alvo = x; desenhaSemCampo(); } });
  function desenhaSemCampo(){ const foco = document.activeElement === elLote; desenha(); if (foco) elLote.focus(); }
  el.querySelectorAll(".linha-lote .passo").forEach(function(b){
    b.addEventListener("click", function(){ alvo = Math.max(50, Math.round((alvo + Number(b.dataset.dir) * 50) / 50) * 50); desenha(); });
  });
  el.querySelectorAll(".atalhos-lote button").forEach(function(b){
    b.addEventListener("click", function(){ alvo = Number(b.dataset.g); desenha(); });
  });
  desenha();
  dados().ultima = {rota:"#/receita/" + encodeURIComponent(r.id) + "/pronta", rotulo:"Receita pronta · " + r.nome};
  salva();
  return {titulo:"Receita pronta", voltar:"#/receitas", voltarRotulo:"Receitas"};
}
