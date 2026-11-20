// Página de uma receita: status, versões, modo de preparo e a receita pronta com escala.
// Rotas: #/receita/<id> (versões e edição) e #/receita/<id>/pronta (para usar na bancada).
import { dados, salva, receita, versao, versoesDe, excluiReceita, ingrediente, criaLote } from "../dados.js?v=20261120163643";
import { icone, capa, aplicaTom, estrelas, escolheCapa, DUREZA, DOCURA, docuraAtual } from "../visual.js?v=20261120163643";
import { confirma, LAPIS } from "../ui.js?v=20261120163643";
import { atualizaVoltar } from "../app.js?v=20261120163643";
import { resumoLote, cartaoLote, dataCurta as dataLote } from "./lote.js?v=20261120163643";
import { calcula, NOMES_ESTILO, n } from "../calculo.js?v=20261120163643";

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
  // Guarda quando esta receita foi aberta (só neste aparelho), para a Home ordenar por "vista por último".
  if (r) try { const m = JSON.parse(localStorage.getItem("icl-vistas") || "{}"); m[r.id] = Date.now(); localStorage.setItem("icl-vistas", JSON.stringify(m)); } catch(e){}
  if (!r){
    el.innerHTML = '<p class="muted">Receita não encontrada.</p><a class="botao" href="#/receitas">Receitas prontas</a>';
    return {titulo:"Receita", voltar:"#/receitas", voltarRotulo:"Receitas"};
  }
  // Receita final abre na aba Receita; "/pronta" é o endereço antigo dessa aba.
  const aba = rota.args[1] === "pronta" ? "receita" : (rota.args[1] === "versoes" ? "versoes" : null);
  return detalhe(el, r, null, aba);
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

const abaDe = {};   // aba escolhida por receita, para manter ao redesenhar
function detalhe(el, r, abertas, aba){
  document.body.classList.add("ui", "rec");
  const db = dados();
  const vs = versoesDe(r.id);
  const abertos = db.lotes.filter(function(l){ return l.receitaId === r.id && l.status !== "concluido"; })
    .sort(function(a, b){ return b.inicio.localeCompare(a.inicio); });
  const vLote = (r.versaoFinal && versao(r.versaoFinal)) || vs[vs.length - 1];
  const vUltima = vs[vs.length - 1];
  const final = r.status === "final" && versao(r.versaoFinal);
  function lotesDa(v){ return db.lotes.filter(function(l){ return l.versaoId === v.id; }).sort(function(a, b){ return b.inicio.localeCompare(a.inicio); }); }
  // Ao abrir a página tudo começa fechado; ao redesenhar (ex.: editar nota) mantém o que estava aberto.
  if (!abertas) abertas = [];
  const emTeste = !final;
  const voltarHref = emTeste ? "#/receitas/teste" : "#/receitas";
  aba = final ? (aba || abaDe[r.id] || "receita") : "versoes";
  abaDe[r.id] = aba;
  // Só um botão de lote aberto (o mais recente); os outros aparecem nos lotes da versão.
  // Receita final não pede avaliação: só o lote em preparo vira botão.
  const loteAberto = final ? abertos.filter(function(l){ return l.status !== "aguardando"; })[0] : abertos[0];
  const pr = final ? prontaHtml(r, final) : null;
  function versaoCard(v){
        const idx = vs.indexOf(v), ant = idx > 0 ? vs[idx - 1] : null;
        const comp = compDe(v), res = calcula(v.linhas, comp);
        const ehFinal = r.versaoFinal === v.id;
        const difs = diferencas(ant, v);
        const lotes = lotesDa(v);
        return '<details class="rec-versao" data-v="' + esc(v.id) + '"' + (abertas.indexOf(v.id) >= 0 ? " open" : "") + '>' +
          '<summary><span class="rec-versao-nome"><b>v' + v.numero + (ehFinal ? ' · final' : '') + '</b><span class="ui-sec">' + dataCurta(v.data) + '</span></span><button type="button" class="rec-seta rec-vmenu" data-vmenu="' + esc(v.id) + '" aria-label="Opções da v' + v.numero + '">' + icone("opcoes") + '</button><span class="rec-seta" aria-hidden="true">' + icone("baixo") + '</span></summary>' +
          '<div class="rec-versao-corpo">' +
            '<p class="rec-nota' + (v.nota ? '' : ' vazia') + '" data-nota-texto="' + esc(v.id) + '">' + (v.nota ? esc(v.nota) : 'Sem nota') + '</p>' +
            (ant && difs.length ? '<div class="rec-difs">' + difs.map(function(d){ return '<span class="rec-dif ' + d.t + '">' + esc(d.txt) + '</span>'; }).join("") + '</div>' : '') +
            '<div class="ui-linhas">' + v.linhas.map(function(l){ const i = comp(l.id);
              return '<div class="ui-linha"><span>' + esc(i ? i.nome : "(ingrediente removido)") + '</span><b class="ui-num">' + gramas(Number(l.g) || 0) + ' g</b></div>'; }).join("") + '</div>' +
            '<p class="ui-sec">' + n(res.peso, 0) + ' g · gord. ' + n(res.gord, 1) + '% · açúc. ' + n(res.ac, 1) + '% · POD ' + n(res.pod, 0) + ' · PAC ' + n(res.pac, 0) + '</p>' +
            (lotes.length ? '<div class="rec-lotes"><span class="ui-rotulo">Lotes desta versão</span>' + lotes.map(loteItem).join("") + '</div>' : '') +
            (ehFinal ? '' : '<div class="rec-versao-acoes"><button type="button" class="ui-botao vidro-escuro" data-lotev="' + esc(v.id) + '">Novo lote</button>' +
                '<button type="button" class="ui-botao preto" data-final="' + esc(v.id) + '">Marcar como final</button></div>') +
          '</div></details>';
  }
  // Receita final: a versão final em cima e os testes recolhidos num bloco só.
  const testes = vs.filter(function(v){ return !final || v.id !== final.id; }).reverse();

  el.innerHTML =
    '<div class="rec-fundo" style="--capa:' + capa(r.nome, r.capa) + '"></div>' +
    '<div class="ui-app">' +
    '<header class="ui-cabecalho nav"><a class="ui-redondo escuro" href="' + voltarHref + '" aria-label="Voltar para Receitas">' + icone("voltar") + '</a>' +
      '<span style="flex:1"></span><button class="ui-redondo escuro" type="button" id="opcoes" aria-label="Mais opções">' + icone("opcoes") + '</button></header>' +
    '<div class="ui-tela rec-tela">' +
      // Painel principal: etiquetas, nome editável e ações.
      '<section class="ui-cartao ui-vidro-escuro rec-painel">' +
        '<div class="rec-etiquetas"><span class="ui-etiqueta' + (final ? ' final' : '') + '">' + (final ? 'Final' : 'Em teste') + '</span>' +
          '<span class="ui-etiqueta">' + esc(NOMES_ESTILO[r.estilo] || "") + '</span>' + (final ? '<span class="ui-etiqueta">v' + final.numero + '</span>' : vUltima ? '<span class="ui-etiqueta">v' + vUltima.numero + '</span>' : '') + '</div>' +
        '<h1 class="rec-nome" id="nomeReceita">' + esc(r.nome) + '</h1>' +
        (final ? '<div class="ui-opcoes rec-abas" id="recAbas" role="group" aria-label="Ver"><button type="button" data-aba="receita" aria-pressed="' + (aba === "receita") + '">Receita</button><button type="button" data-aba="versoes" aria-pressed="' + (aba === "versoes") + '">Versões</button></div>' : '') +
        (loteAberto ? (function(l){ const vv = versao(l.versaoId);
          return '<a class="ui-botao vidro-escuro largo" href="#/lote/' + encodeURIComponent(l.id) + (l.status === "aguardando" ? '/avaliar' : '') + '">' +
            (l.status === "aguardando" ? 'Avaliar lote' : 'Continuar lote') + (vv ? ' · v' + vv.numero + ', ' + dataLote(l.inicio) : '') + '</a>'; })(loteAberto) : '') +
      '</section>' +
      (pr ? '<div id="abaReceita" class="rec-aba"' + (aba === "receita" ? '' : ' hidden') + '>' + pr.html + '</div>' : '') +
      '<div id="abaVersoes" class="rec-aba"' + (aba === "versoes" ? '' : ' hidden') + '>' +
      (vs.length && !final ? '<div class="rec-acoes"><a class="ui-botao vidro-escuro" href="#/calculadora/v/' + encodeURIComponent(vUltima.id) + '/nova">Usar mistura em nova receita</a></div>' : '') +
      '<section class="ui-cartao ui-vidro-escuro rec-painel"><h2>Versões</h2><div class="rec-versoes">' +
        (final ? versaoCard(final) + (testes.length ? '<details class="rec-dobra rec-testes"' + (abertas.indexOf("testes") >= 0 ? ' open' : '') + '><summary><span class="ui-sec">Testes (' + testes.length + ')</span><span class="rec-seta" aria-hidden="true">' + icone("baixo") + '</span></summary><div class="rec-versoes">' + testes.map(versaoCard).join("") + '</div></details>' : '')
          : testes.map(versaoCard).join("")) +
      '</div></section></div>' +
      // Modo de preparo abre e fecha; começa fechado.
      '<section class="ui-cartao ui-vidro-escuro rec-painel"><details class="rec-dobra">' +
        '<summary><h2>Modo de preparo</h2><span class="rec-seta" aria-hidden="true">' + icone("baixo") + '</span></summary>' +
        '<textarea id="preparo" class="rec-preparo" rows="5" placeholder="Passo a passo: pesar, pasteurizar, maturar, bater…">' + esc(r.preparo) + '</textarea></details></section>' +
    '</div></div>';

  function redesenha(){
    const ab = Array.prototype.map.call(el.querySelectorAll("details.rec-versao[open]"), function(d){ return d.dataset.v; });
    if (el.querySelector("details.rec-testes[open]")) ab.push("testes");
    detalhe(el, r, ab, abaDe[r.id]);
  }
  el.querySelectorAll("[data-final]").forEach(function(b){ b.addEventListener("click", async function(){
    const v = versao(b.dataset.final); if (!v) return;
    if (!(await confirma("Marcar a v" + v.numero + " como versão final? Ela vira a receita final.", "Confirmar"))) return;
    r.versaoFinal = v.id; r.status = "final"; salva(); redesenha();
  }); });
  if (pr) pr.liga(el);
  el.querySelectorAll("#recAbas [data-aba]").forEach(function(b){ b.addEventListener("click", function(){
    aba = abaDe[r.id] = b.dataset.aba;
    el.querySelectorAll("#recAbas [data-aba]").forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); });
    el.querySelector("#abaReceita").hidden = aba !== "receita";
    el.querySelector("#abaVersoes").hidden = aba !== "versoes";
    history.replaceState(null, "", "#/receita/" + encodeURIComponent(r.id) + (aba === "receita" ? "/pronta" : "/versoes"));
  }); });
  el.querySelectorAll("[data-lotev]").forEach(function(b){ b.addEventListener("click", function(){
    const l = criaLote(b.dataset.lotev); salva(); if (l) location.hash = "#/lote/" + encodeURIComponent(l.id);
  }); });
  // ⋯ da versão: editar a versão inteira (calculadora, corrigindo no lugar), a nota, ou partir dela.
  el.querySelectorAll("[data-vmenu]").forEach(function(b){ b.addEventListener("click", function(ev){
    ev.preventDefault(); ev.stopPropagation();   // dentro do summary: não abre/fecha a versão
    const v = versao(b.dataset.vmenu); if (!v) return;
    const veu = document.createElement("div"); veu.className = "ui-veu";
    const f = document.createElement("div"); f.className = "ui-folha"; f.setAttribute("role", "dialog"); f.setAttribute("aria-label", "Opções da versão");
    f.innerHTML = '<span class="puxador"></span><h2>v' + v.numero + '</h2>' +
      '<a class="ui-botao vidro largo" href="#/calculadora/v/' + encodeURIComponent(v.id) + '/corrigir">Editar versão</a>' +
      '<button type="button" class="ui-botao vidro largo" id="vNota">Editar nota</button>' +
      '<a class="ui-botao vidro largo" href="#/calculadora/v/' + encodeURIComponent(v.id) + '">Nova versão a partir desta</a>' +
      '<button type="button" class="ui-botao preto largo" id="vFechar">Fechar</button>';
    document.body.append(veu, f);
    const fecha = function(){ veu.remove(); f.remove(); };
    veu.addEventListener("click", fecha); f.querySelector("#vFechar").addEventListener("click", fecha);
    f.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", fecha); });
    f.querySelector("#vNota").addEventListener("click", function(){ fecha(); const d = el.querySelector('details.rec-versao[data-v="' + CSS.escape(v.id) + '"]'); if (d){ d.open = true; const t = d.closest(".rec-testes"); if (t) t.open = true; } editaNota(v); });
  }); });
  function editaNota(v){
    {
    const p = el.querySelector('[data-nota-texto="' + CSS.escape(v.id) + '"]');
    const inp = document.createElement("input"); inp.className = "rec-nota-campo"; inp.maxLength = 140; inp.placeholder = "O que mudou nesta versão?"; inp.value = v.nota || "";
    p.replaceWith(inp); inp.focus();
    const ok = function(){ v.nota = inp.value.trim(); salva(); redesenha(); };
    inp.addEventListener("keydown", function(ev){ if (ev.key === "Enter"){ ev.preventDefault(); ok(); } });
    inp.addEventListener("blur", ok);
    }
  }
  aplicaTom(el, r.nome, r.capa);
  const btLote = el.querySelector("#fazerLote");
  if (btLote) btLote.addEventListener("click", function(){ const l = criaLote(vLote.id); salva(); if (l) location.hash = "#/lote/" + encodeURIComponent(l.id); });
  el.querySelector("#preparo").addEventListener("input", function(ev){ r.preparo = ev.target.value; salva(); });

  // Mais opções: folha com Excluir receita.
  el.querySelector("#opcoes").addEventListener("click", function(){
    const veu = document.createElement("div"); veu.className = "ui-veu";
    const f = document.createElement("div"); f.className = "ui-folha"; f.setAttribute("role", "dialog"); f.setAttribute("aria-label", "Opções da receita");
    f.innerHTML = '<span class="puxador"></span><h2>' + esc(r.nome) + '</h2>' +
      // Editar nome + botão redondo de foto/capa ao lado (mesmo padrão do editor de ideia).
      '<div class="ideia-acoes"><button type="button" class="ui-botao vidro" id="editarNome">Editar nome</button>' +
        '<button type="button" class="ui-botao vidro ideia-capa-bt" id="trocaCapa" aria-label="Trocar capa">' + icone("imagem") + '</button></div>' +
      (final ? '<button type="button" class="ui-botao vidro largo" id="paraTeste">Voltar para teste</button>' : '') +
      '<button type="button" class="ui-botao vidro largo perigo" id="excluir">Excluir receita</button>' +
      '<button type="button" class="ui-botao preto largo" id="fechar">Fechar</button>';
    document.body.append(veu, f);
    const fecha = function(){ veu.remove(); f.remove(); };
    const btT = f.querySelector("#paraTeste");
    if (btT) btT.addEventListener("click", async function(){
      fecha();
      if (!(await confirma("Voltar a receita para teste? Ela deixa de ser final; dá para marcar de novo depois.", "Voltar para teste"))) return;
      r.status = "em teste"; delete r.versaoFinal; salva(); redesenha();
    });
    veu.addEventListener("click", fecha); f.querySelector("#fechar").addEventListener("click", fecha);
    // Editar nome: troca os botões por um campo com Cancelar / Salvar.
    f.querySelector("#editarNome").addEventListener("click", function(){
      f.innerHTML = '<span class="puxador"></span><div class="acoes"><button type="button" class="ui-botao vidro" id="cancela">Cancelar</button><button type="button" class="ui-botao preto" id="salvaNome">Salvar</button></div>' +
        '<h2>Nome da receita</h2><input class="ui-campo" id="campoNome" maxlength="60" enterkeyhint="done">';
      const campo = f.querySelector("#campoNome"); campo.value = r.nome; campo.focus(); campo.select();
      const salvaNome = function(){ const nome = campo.value.trim(); if (!nome){ campo.focus(); return; }
        r.nome = nome.slice(0, 60); if (db.calc.receitaId === r.id) db.calc.nome = r.nome; salva(); fecha(); redesenha(); };
      f.querySelector("#cancela").addEventListener("click", fecha);
      f.querySelector("#salvaNome").addEventListener("click", salvaNome);
      campo.addEventListener("keydown", function(ev){ if (ev.key === "Enter"){ ev.preventDefault(); salvaNome(); } });
    });
    // Capa: escolher um degradê (ou voltar ao automático, que segue o nome).
    f.querySelector("#trocaCapa").addEventListener("click", function(){
      fecha();
      escolheCapa({titulo:"Capa", foto:true, semente:r.nome, atual:r.capa || "",
        aoEscolher:function(valor){ const antes = r.capa; if (valor) r.capa = valor; else delete r.capa;
          if (!salva()){ if (antes) r.capa = antes; else delete r.capa; alert("A foto é grande demais para guardar. Tente outra."); } redesenha(); }});
    });
    f.querySelector("#excluir").addEventListener("click", async function(){
      fecha();
      if (!(await confirma("Excluir “" + r.nome + "” e todas as " + vs.length + " versões? Isso não pode ser desfeito (a não ser por um backup).", "Excluir", true))) return;
      excluiReceita(r.id); salva(); location.hash = "#/receitas";
    });
  });

  return {titulo:r.nome, voltar:voltarHref, voltarRotulo:"Receitas",
    limpa:function(){ document.body.classList.remove("ui", "rec"); document.querySelectorAll(".ui-veu,.ui-folha").forEach(function(x){ x.remove(); }); }};
}

// Lote dentro da versão: data, estrelas, o que foi marcado e as observações.
function loteItem(l){
  const a = l.avaliacao || {};
  const marcas = [];
  if (Array.isArray(a.textura) && a.textura.length) marcas.push("Textura " + a.textura.map(function(t){ return ({lisa:"lisa", cristais:"cristais de gelo", arenosa:"arenosa", gomosa:"gomosa"})[t] || t; }).join(", "));
  const d = DUREZA.find(function(o){ return o[0] === a.dureza; }); if (d) marcas.push("Dureza " + d[1].toLowerCase());
  const dc = DOCURA.find(function(o){ return o[0] === docuraAtual(a.docura); }); if (dc) marcas.push("Doçura " + dc[1].toLowerCase());
  const obs = l.proximoEditado && l.proximo ? l.proximo : "";
  const dir = l.status === "concluido" ? (a.nota ? estrelas(a.nota) : '<span class="ui-sec">sem nota</span>') :
    '<span class="ui-sec">' + (l.status === "aguardando" ? "para avaliar" : "preparando") + '</span>';
  return '<a class="rec-lote" href="#/lote/' + encodeURIComponent(l.id) + (l.status === "aguardando" ? "/avaliar" : "") + '">' +
    '<span class="rec-lote-topo"><b>' + dataLote(l.inicio) + '</b>' + dir + '</span>' +
    (marcas.length ? '<span class="ui-sec">' + esc(marcas.join(" · ")) + '</span>' : '') +
    (obs ? '<span class="rec-lote-obs">' + esc(obs).replace(/\n/g, "<br>") + '</span>' : '') + '</a>';
}

// Aba Receita (receita final): quantidades da versão final com escala por tamanho de lote.
function prontaHtml(r, v){
  const db = dados();
  const comp = compDe(v);
  const base = calcula(v.linhas, comp).peso || 1;
  let alvo = Math.round(base);
  const tamanhos = [250, 500, 1000];
  const html =
      '<section class="ui-cartao ui-vidro-escuro rec-painel">' +
        '<div class="rec-cab"><h2>Ingredientes · v' + v.numero + '</h2><span class="ui-sec" id="paraTotal"></span></div>' +
        '<div class="ui-linhas" id="quantidades"></div>' +
        '<div class="rec-tamanhos" role="group" aria-label="Tamanho do lote">' + tamanhos.map(function(g){
          return '<button type="button" data-g="' + g + '" aria-pressed="false">' + (g < 1000 ? g + ' g' : g / 1000 + ' kg') + '</button>'; }).join("") +
          '<label class="rec-outro"><input type="number" id="lote" inputmode="decimal" min="50" step="50" aria-label="Outro tamanho em gramas"><span>g</span></label></div>' +
      '</section>' +
      '<button type="button" class="ui-botao preto largo" id="comecar">Começar lote</button>';
  function liga(el){
    const elLote = el.querySelector("#lote");
    function desenha(foco){
      const f = alvo / base;
      if (!foco) elLote.value = tamanhos.indexOf(alvo) >= 0 ? "" : alvo;
      el.querySelector("#paraTotal").textContent = "para " + (alvo >= 1000 && alvo % 1000 === 0 ? alvo / 1000 + " kg" : alvo + " g");
      el.querySelector("#quantidades").innerHTML = v.linhas.map(function(l){ const i = comp(l.id);
        return '<div class="ui-linha"><span>' + esc(i ? i.nome : "(ingrediente removido)") + '</span><b class="ui-num">' + gramas(l.g * f) + ' g</b></div>'; }).join("") +
        '<div class="ui-linha rec-total"><span>Peso total</span><b class="ui-num">' + gramas(alvo) + ' g</b></div>';
      el.querySelectorAll(".rec-tamanhos [data-g]").forEach(function(b){ b.setAttribute("aria-pressed", Number(b.dataset.g) === alvo); });
      el.querySelector(".rec-outro").classList.toggle("ativo", tamanhos.indexOf(alvo) < 0);
    }
    el.querySelectorAll(".rec-tamanhos [data-g]").forEach(function(b){ b.addEventListener("click", function(){ alvo = Number(b.dataset.g); desenha(); }); });
    elLote.addEventListener("input", function(){ const x = Number(elLote.value); if (x > 0){ alvo = x; desenha(true); } });
    el.querySelector("#comecar").addEventListener("click", function(){
      const l = criaLote(v.id); if (!l) return;
      l.escala = alvo / base; salva();
      location.hash = "#/lote/" + encodeURIComponent(l.id);
    });
    desenha();
    db.ultima = {rota:"#/receita/" + encodeURIComponent(r.id) + "/pronta", rotulo:"Receita pronta · " + r.nome};
    salva();
  }
  return {html:html, liga:liga};
}
