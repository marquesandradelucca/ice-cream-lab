// Estudo (redesign): temas agrupados, trazidos do Notion e editáveis no app.
// Rotas: #/estudo (todos, com busca), #/estudo/grupo/<grupo> (filtrado pela seção vinda da Biblioteca),
// #/estudo/<id> (tema) e #/estudo/<id>/calculadora (aberto por um gráfico: o voltar leva à calculadora).
import { dados, salva, paginaEstudo, originalEstudo } from "../dados.js?v=20261123120149";
import { GRUPOS_ESTUDO } from "../estudo-base.js?v=20261123120149";
import { mdParaHtml, confirma } from "../ui.js?v=20261123120149";
import { icone, capa, aplicaTom } from "../visual.js?v=20261123120149";
import { capaBiblioteca } from "./biblioteca.js?v=20261123120149";

function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function normal(t){ return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
function textoPuro(md){ return String(md || "").replace(/\*\*|_|\|/g, " ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " "); }
function limpaUi(){ document.body.classList.remove("ui", "rec"); document.querySelectorAll(".ui-veu,.ui-folha").forEach(function(x){ x.remove(); }); }

const CAPA_DO_GRUPO = {fundamentos:"fundamentos", bases:"bases", ingredientes:"guia", referencias:"referencias"};
// Temas de uma seção usam a capa do card dessa seção na Biblioteca (troca em Ajustes › Personalização e muda junto).
function capaTemas(grupo){ return capaBiblioteca(dados(), CAPA_DO_GRUPO[grupo] || grupo); }

// A busca fica guardada enquanto o app está aberto (ao voltar de um tema, ela continua lá).
let busca = "";

export function render(el, rota){
  if (rota.args[0] === "grupo") return lista(el, rota.args[1] || "");
  const id = rota.args[0] ? decodeURIComponent(rota.args[0]) : "";
  return id ? tema(el, id, rota.args[1] === "calculadora") : lista(el, "");
}

function lista(el, grupo){
  document.body.classList.add("ui");
  const db = dados();
  const gAtual = GRUPOS_ESTUDO.find(function(g){ return g[0] === grupo; });
  const nomeGrupo = gAtual ? gAtual[1] : "Estudo";
  const filtro = function(id, nome){ return '<a class="ui-filtro" href="#/estudo' + (id ? '/grupo/' + id : '') + '" aria-pressed="' + (grupo === id) + '">' + nome + '</a>'; };
  // Com seção escolhida: fundo = capa da seção e temas em cartões de vidro (padrão das telas com capa).
  const comCapa = !!gAtual;
  document.body.classList.toggle("est-capa", comCapa);
  el.innerHTML =
    (comCapa ? '<div class="rec-fundo" style="--capa:' + capa(nomeGrupo, capaTemas(grupo)) + '"></div>' : '') +
    '<div class="ui-app">' +
    '<header class="ui-cabecalho nav"><a class="ui-redondo' + (comCapa ? ' escuro' : '') + '" href="#/biblioteca" aria-label="Voltar para a Biblioteca">' + icone("voltar") + '</a><h1>' + esc(nomeGrupo) + '</h1>' +
      '<button class="ui-redondo' + (comCapa ? ' escuro' : '') + '" type="button" id="abreBusca" aria-label="Buscar nos temas">' + icone("buscar") + '</button></header>' +
    '<div class="ui-tela">' +
      '<input id="buscaEstudo" class="ui-campo" type="search" placeholder="Buscar nos temas" aria-label="Buscar no Estudo" value="' + esc(busca) + '"' + (busca ? '' : ' hidden') + '>' +
      '<div id="resultado" class="estudo-lista"></div>' +
    '</div></div>';
  const elRes = el.querySelector("#resultado"), inp = el.querySelector("#buscaEstudo");
  const linha = function(p, sub){
    return '<a class="ui-linha estudo-linha" href="#/estudo/' + encodeURIComponent(p.id) + '"><span class="estudo-linha-texto"><span>' + esc(p.titulo) + '</span>' +
      (sub ? '<span class="ui-sec">' + esc(sub) + '</span>' : '') + '</span><span class="estudo-seta" aria-hidden="true">' + icone("direita") + '</span></a>';
  };

  function desenha(){
    const q = normal(busca.trim());
    const grupos = GRUPOS_ESTUDO.filter(function(g){ return !grupo || g[0] === grupo; });
    if (!q){
      // Sem busca: cada tema é um cartão de capa (grade de 2), agrupado por seção.
      elRes.innerHTML = grupos.map(function(g){
        const temas = db.estudo.filter(function(p){ return p.grupo === g[0]; }).sort(function(a, b){ return a.ordem - b.ordem; });
        if (!temas.length) return "";
        return (grupo ? '<p class="ui-sec estudo-desc">' + esc(g[2]) + '</p>' : '<h2 class="ing-sec">' + g[1] + '</h2>') +
          '<div class="temas-lista">' + temas.map(function(p){
            return '<a class="ui-bloco pequeno tema-bloco" href="#/estudo/' + encodeURIComponent(p.id) + '" style="--capa:' + capa(p.titulo, capaTemas(p.grupo)) + '"><span class="titulo">' + esc(p.titulo) + '</span></a>';
          }).join("") + '</div>';
      }).join("");
      return;
    }
    // Procura no título e no texto, sem diferenciar acentos; mostra um trecho em volta do achado.
    const achados = db.estudo.filter(function(p){ return !grupo || p.grupo === grupo; }).map(function(p){
      const titulo = normal(p.titulo), texto = textoPuro(p.md), tn = normal(texto);
      const noTitulo = titulo.indexOf(q) >= 0, pos = tn.indexOf(q);
      if (!noTitulo && pos < 0) return null;
      let trecho = "";
      if (pos >= 0){
        let ini = Math.max(0, pos - 40), fim = Math.min(texto.length, pos + q.length + 60);
        if (ini > 0){ const sp = texto.indexOf(" ", ini); if (sp >= 0 && sp < pos) ini = sp + 1; }
        if (fim < texto.length){ const sp = texto.lastIndexOf(" ", fim); if (sp > pos + q.length) fim = sp; }
        trecho = (ini ? "…" : "") + texto.slice(ini, fim).trim() + (fim < texto.length ? "…" : "");
      }
      return {p:p, peso:noTitulo ? 0 : 1, trecho:trecho};
    }).filter(Boolean).sort(function(a, b){ return a.peso - b.peso; });
    elRes.innerHTML = achados.length ?
      '<section class="ui-cartao ui-vidro"><div class="estudo-cab"><h2>Resultados</h2><span class="ui-sec">' + achados.length + (achados.length === 1 ? ' tema' : ' temas') + '</span></div>' +
        '<div class="ui-linhas">' + achados.map(function(x){ return linha(x.p, x.trecho); }).join("") + '</div></section>' :
      '<p class="ui-sec ideias-vazio">Nada encontrado para “' + esc(busca.trim()) + '”.</p>';
  }
  inp.addEventListener("input", function(){ busca = inp.value; desenha(); });
  // Lupa: mostra/esconde a busca (escondendo, limpa).
  el.querySelector("#abreBusca").addEventListener("click", function(){
    inp.hidden = !inp.hidden;
    if (!inp.hidden) inp.focus(); else { busca = ""; inp.value = ""; desenha(); }
  });
  if (comCapa) aplicaTom(el, nomeGrupo, capaTemas(grupo));
  desenha();
  return {titulo:"Estudo", voltar:"#/biblioteca", voltarRotulo:"Biblioteca", limpa:function(){ document.body.classList.remove("est-capa"); limpaUi(); }};
}

// Bibliografia: cada linha "[Título - Autores](endereço)" vira um cartão separado que abre o link.
function referencias(md){
  const itens = String(md || "").split("\n").map(function(l){
    const m = l.match(/\[([^\]]+)\]\(([^)]+)\)/); if (!m) return null;
    const partes = m[1].split(" - "), titulo = partes[0].trim(), autor = partes.slice(1).join(" - ").trim();
    let site = ""; try { site = new URL(m[2]).hostname.replace(/^www\./, ""); } catch (e) {}
    return {titulo:titulo, autor:autor, url:m[2], site:site};
  }).filter(Boolean);
  if (!itens.length) return '<article class="ui-cartao ui-vidro texto-estudo tema-texto">' + mdParaHtml(md) + '</article>';
  return itens.map(function(x){
    return '<a class="ui-bloco ref-cartao" href="' + esc(x.url) + '" target="_blank" rel="noopener" style="--capa:' + capa("Referência " + x.titulo) + '">' +
      '<span class="titulo">' + esc(x.titulo) + '</span>' + (x.autor ? '<span class="ui-sec">' + esc(x.autor) + '</span>' : '') +
      (x.site ? '<span class="ref-site">' + esc(x.site) + ' ↗</span>' : '') + '</a>';
  }).join("");
}

function tema(el, id, daCalculadora){
  const p = paginaEstudo(id);
  // Referências não tem lista própria (um tema só): o voltar leva direto à Biblioteca.
  const daRef = p && p.grupo === "referencias";
  const voltar = daCalculadora ? "#/calculadora" : daRef ? "#/biblioteca" : "#/estudo/grupo/" + (p ? p.grupo : "");
  const rotuloVoltar = daCalculadora ? "Calculadora" : daRef ? "Biblioteca" : "Estudo";
  if (!p){
    el.innerHTML = '<p class="muted">Tema não encontrado.</p>';
    return {titulo:"Estudo", voltar:"#/estudo", voltarRotulo:"Estudo"};
  }
  document.body.classList.add("ui");
  const grupo = (GRUPOS_ESTUDO.find(function(g){ return g[0] === p.grupo; }) || [])[1] || "";

  function ler(){
    // Tema (exceto Bibliografia): fundo = capa da seção; título e texto em painéis de vidro escuro.
    const bib = p.id === "bibliografia", esc2 = !bib ? " escuro" : "";
    document.body.classList.toggle("est-capa", !bib);
    el.innerHTML =
      (!bib ? '<div class="rec-fundo" style="--capa:' + capa(p.titulo, capaTemas(p.grupo)) + '"></div>' : '') +
      '<div class="ui-app">' +
      '<header class="ui-cabecalho nav"><a class="ui-redondo' + esc2 + '" href="' + voltar + '" aria-label="Voltar para ' + rotuloVoltar + '">' + icone("voltar") + '</a>' +
        (bib ? '<h1>' + esc(p.titulo) + '</h1>' : '<span style="flex:1"></span>') +
        '<button class="ui-redondo' + esc2 + '" type="button" id="opcoes" aria-label="Mais opções">' + icone("opcoes") + '</button></header>' +
      '<div class="ui-tela">' +
        (bib ? referencias(p.md) :
          '<section class="ui-cartao ui-vidro-escuro rec-painel"><div class="rec-etiquetas"><span class="ui-etiqueta">' + esc(grupo) + '</span></div><h1 class="rec-nome">' + esc(p.titulo) + '</h1></section>' +
          '<article class="ui-cartao ui-vidro-escuro rec-painel texto-estudo tema-texto">' + mdParaHtml(p.md) + '</article>') +
      '</div></div>';
    if (!bib) aplicaTom(el, p.titulo, capaTemas(p.grupo));
    el.querySelector("#opcoes").addEventListener("click", opcoes);
  }

  // Mais opções: Editar, Desfazer a última edição e Voltar ao texto do Notion (destrutivo, vermelho).
  function opcoes(){
    const original = originalEstudo(p.id);
    const veu = document.createElement("div"); veu.className = "ui-veu";
    const f = document.createElement("div"); f.className = "ui-folha"; f.setAttribute("role", "dialog"); f.setAttribute("aria-label", "Opções do tema");
    f.innerHTML = '<span class="puxador"></span><h2>' + esc(p.titulo) + '</h2>' +
      '<button type="button" class="ui-botao vidro largo" id="editar">Editar texto</button>' +
      (p.anterior ? '<button type="button" class="ui-botao vidro largo" id="desfazer">Desfazer última edição</button>' : '') +
      (original && original.md !== p.md ? '<button type="button" class="ui-botao vidro largo perigo" id="restaurar">Voltar ao texto do Notion</button>' : '') +
      '<button type="button" class="ui-botao preto largo" id="fechar">Fechar</button>';
    document.body.append(veu, f);
    const fecha = function(){ veu.remove(); f.remove(); };
    veu.addEventListener("click", fecha); f.querySelector("#fechar").addEventListener("click", fecha);
    f.querySelector("#editar").addEventListener("click", function(){ fecha(); editar(); });
    const des = f.querySelector("#desfazer");
    if (des) des.addEventListener("click", async function(){
      fecha();
      if (!(await confirma("Voltar este tema para como estava antes da última edição?", "Desfazer"))) return;
      const atual = {titulo:p.titulo, md:p.md};
      p.titulo = p.anterior.titulo; p.md = p.anterior.md; p.anterior = atual;
      salva(); ler(); window.scrollTo(0, 0);
    });
    const rest = f.querySelector("#restaurar");
    if (rest) rest.addEventListener("click", async function(){
      fecha();
      if (!(await confirma("Voltar este tema ao texto trazido do Notion? A versão atual fica guardada para desfazer.", "Voltar ao original", true))) return;
      p.anterior = {titulo:p.titulo, md:p.md};
      p.titulo = original.titulo; p.md = original.md; salva(); ler(); window.scrollTo(0, 0);
    });
  }

  function editar(){
    document.body.classList.remove("est-capa");
    el.innerHTML =
      '<div class="ui-app">' +
      '<header class="ui-cabecalho nav"><button class="ui-redondo" type="button" id="fecharEd" aria-label="Cancelar">' + icone("fechar") + '</button><h1>Editar tema</h1></header>' +
      '<div class="ui-tela">' +
        '<section class="ui-cartao ui-vidro ideia-form-claro">' +
          '<label class="ui-rotulo" for="tituloTema">Título</label>' +
          '<input id="tituloTema" class="ui-campo campo-branco" type="text" maxlength="90" value="' + esc(p.titulo) + '">' +
          '<label class="ui-rotulo" for="textoTema">Texto</label>' +
          '<textarea id="textoTema" class="ui-campo campo-branco tema-edicao" rows="18">' + esc(p.md) + '</textarea>' +
          '<p class="ui-sec">**negrito** · _itálico_ · linhas começando com "- " viram lista · tabelas com "|" · [nome](endereço) vira um link</p>' +
        '</section>' +
        '<div class="rec-acoes"><button type="button" class="ui-botao vidro" id="cancelar">Cancelar</button>' +
          '<button type="button" class="ui-botao preto" id="salvarTema">Salvar</button></div>' +
      '</div></div>';
    const elT = el.querySelector("#tituloTema"), elM = el.querySelector("#textoTema");
    function mudou(){ return elT.value !== p.titulo || elM.value !== p.md; }
    const cancela = async function(){
      if (mudou() && !(await confirma("Descartar as mudanças que você fez neste tema?", "Descartar", true))) return;
      ler(); window.scrollTo(0, 0);
    };
    el.querySelector("#cancelar").addEventListener("click", cancela);
    el.querySelector("#fecharEd").addEventListener("click", cancela);
    el.querySelector("#salvarTema").addEventListener("click", async function(){
      const t = elT.value.trim();
      if (!t){ elT.focus(); return; }
      if (!mudou()){ ler(); return; }
      // Texto muito menor que o anterior costuma ser apagamento sem querer: confirma antes.
      if (elM.value.trim().length < p.md.trim().length * 0.5 &&
          !(await confirma("O texto ficou bem menor que antes. Salvar mesmo assim? (Dá para desfazer depois.)", "Salvar"))) return;
      p.anterior = {titulo:p.titulo, md:p.md};
      p.titulo = t; p.md = elM.value;
      salva(); ler(); window.scrollTo(0, 0);
    });
    window.scrollTo(0, 0);
  }

  ler();
  return {titulo:"Estudo", voltar:voltar, voltarRotulo:rotuloVoltar, limpa:function(){ document.body.classList.remove("est-capa"); limpaUi(); }};
}
