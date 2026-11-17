// Estudo: temas agrupados (Fundamentos, Ingredientes, Bases e técnicas, Referências), trazidos
// do Notion e editáveis no app.
// Rotas: #/estudo (lista com busca), #/estudo/<id> (tema) e #/estudo/<id>/calculadora
// (tema aberto pelo atalho de um gráfico: o voltar leva de volta à calculadora).
import { dados, salva, paginaEstudo, originalEstudo } from "../dados.js?v=20261116211245";
import { GRUPOS_ESTUDO } from "../estudo-base.js?v=20261116211245";
import { mdParaHtml, confirma } from "../ui.js?v=20261116211245";

function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function normal(t){ return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
function textoPuro(md){ return String(md || "").replace(/\*\*|_|\|/g, " ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " "); }

// A busca fica guardada enquanto o app está aberto (ao voltar de um tema, ela continua lá).
let busca = "";

export function render(el, rota){
  const id = rota.args[0] ? decodeURIComponent(rota.args[0]) : "";
  return id ? tema(el, id, rota.args[1] === "calculadora") : lista(el);
}

function lista(el){
  const db = dados();
  el.innerHTML =
    '<input id="buscaEstudo" class="campo-texto campo-busca" type="search" placeholder="Buscar" aria-label="Buscar no Estudo" value="' + esc(busca) + '">' +
    '<div id="resultado"></div>';
  const elRes = el.querySelector("#resultado"), inp = el.querySelector("#buscaEstudo");

  function desenha(){
    const q = normal(busca.trim());
    if (!q){
      elRes.innerHTML = GRUPOS_ESTUDO.map(function(g){
        const temas = db.estudo.filter(function(p){ return p.grupo === g[0]; }).sort(function(a, b){ return a.ordem - b.ordem; });
        if (!temas.length) return "";
        return '<h2 class="subtitulo">' + g[1] + '</h2><section class="lista-cards">' + temas.map(function(p){
          return '<a class="item-lista" href="#/estudo/' + encodeURIComponent(p.id) + '"><span class="item-nome">' + esc(p.titulo) + '</span></a>';
        }).join("") + '</section>';
      }).join("");
      return;
    }
    // Procura no título e no texto, sem diferenciar acentos; mostra um trecho em volta do achado.
    const achados = db.estudo.map(function(p){
      const titulo = normal(p.titulo), texto = textoPuro(p.md), tn = normal(texto);
      const noTitulo = titulo.indexOf(q) >= 0, pos = tn.indexOf(q);
      if (!noTitulo && pos < 0) return null;
      let trecho = "";
      if (pos >= 0){
        let ini = Math.max(0, pos - 40), fim = Math.min(texto.length, pos + q.length + 60);
        // Começa e termina em palavra inteira.
        if (ini > 0){ const sp = texto.indexOf(" ", ini); if (sp >= 0 && sp < pos) ini = sp + 1; }
        if (fim < texto.length){ const sp = texto.lastIndexOf(" ", fim); if (sp > pos + q.length) fim = sp; }
        trecho = (ini ? "…" : "") + texto.slice(ini, fim).trim() + (fim < texto.length ? "…" : "");
      }
      return {p:p, peso:noTitulo ? 0 : 1, trecho:trecho};
    }).filter(Boolean).sort(function(a, b){ return a.peso - b.peso; });
    elRes.innerHTML = achados.length ?
      '<p class="dica-lista">' + achados.length + (achados.length === 1 ? ' tema encontrado' : ' temas encontrados') + '</p>' +
      '<section class="lista-cards">' + achados.map(function(x){
        return '<a class="item-lista" href="#/estudo/' + encodeURIComponent(x.p.id) + '"><span class="item-nome">' + esc(x.p.titulo) + '</span>' +
          (x.trecho ? '<span class="item-desc">' + esc(x.trecho) + '</span>' : '') + '</a>';
      }).join("") + '</section>' :
      '<p class="muted bloco-vazio">Nada encontrado para “' + esc(busca.trim()) + '”.</p>';
  }
  inp.addEventListener("input", function(){ busca = inp.value; desenha(); });
  desenha();
  return {titulo:"Estudo"};
}

function tema(el, id, daCalculadora){
  const p = paginaEstudo(id);
  const voltar = daCalculadora ? {voltar:"#/calculadora", voltarRotulo:"Calculadora"} : {voltar:"#/estudo", voltarRotulo:"Estudo"};
  if (!p){
    el.innerHTML = '<p class="muted">Tema não encontrado.</p>';
    return Object.assign({titulo:"Estudo"}, voltar);
  }
  const grupo = (GRUPOS_ESTUDO.find(function(g){ return g[0] === p.grupo; }) || [])[1] || "";

  function ler(){
    el.innerHTML =
      '<div class="cabeca-receita"><h2 class="titulo-receita">' + esc(p.titulo) + '</h2><span class="muted pequeno">' + esc(grupo) + '</span></div>' +
      '<article class="texto-estudo">' + mdParaHtml(p.md) + '</article>' +
      (daCalculadora ? '<a class="botao largo" href="#/calculadora">Voltar para a calculadora</a>' : '') +
      // Edição fica no fim, discreta, e pede confirmação antes de abrir.
      '<div class="acoes-edicao">' +
        (p.anterior ? '<button type="button" class="pilula-cinza" id="desfazer">Desfazer última edição</button>' : '') +
        '<button type="button" class="pilula-cinza" id="editar">Editar tema</button>' +
      '</div>';
    el.querySelector("#editar").addEventListener("click", async function(){
      if (!(await confirma("Editar o texto deste tema? Ao salvar, a versão atual fica guardada para você poder desfazer.", "Editar"))) return;
      editar();
    });
    const des = el.querySelector("#desfazer");
    if (des) des.addEventListener("click", async function(){
      if (!(await confirma("Voltar este tema para como estava antes da última edição?", "Desfazer"))) return;
      const atual = {titulo:p.titulo, md:p.md};
      p.titulo = p.anterior.titulo; p.md = p.anterior.md; p.anterior = atual;
      salva(); ler(); window.scrollTo(0, 0);
    });
  }

  function editar(){
    const original = originalEstudo(p.id);
    el.innerHTML =
      '<div class="cabeca-receita"><h2 class="titulo-receita">Editar tema</h2></div>' +
      '<label class="rotulo" for="tituloTema">Título</label>' +
      '<input id="tituloTema" class="campo-texto campo-estudo" type="text" maxlength="90" value="' + esc(p.titulo) + '">' +
      '<label class="rotulo rotulo-espaco" for="textoTema">Texto</label>' +
      '<textarea id="textoTema" class="campo-texto campo-estudo texto-edicao" rows="18">' + esc(p.md) + '</textarea>' +
      '<p class="muted pequeno dica-edicao">**negrito** · _itálico_ · linhas começando com "- " viram lista · tabelas com "|" · [nome](endereço) vira um link</p>' +
      '<div class="acoes-ing"><button type="button" class="pilula-cinza" id="cancelar">Cancelar</button>' +
        '<button type="button" class="pilula-preta" id="salvarTema">Salvar</button></div>' +
      (original && original.md !== p.md ? '<div class="acoes-linha espaco-topo"><button type="button" class="botao perigo" id="restaurar">Voltar ao texto do Notion</button></div>' : '');
    const elT = el.querySelector("#tituloTema"), elM = el.querySelector("#textoTema");
    function mudou(){ return elT.value !== p.titulo || elM.value !== p.md; }
    el.querySelector("#cancelar").addEventListener("click", async function(){
      if (mudou() && !(await confirma("Descartar as mudanças que você fez neste tema?", "Descartar", true))) return;
      ler(); window.scrollTo(0, 0);
    });
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
    const rest = el.querySelector("#restaurar");
    if (rest) rest.addEventListener("click", async function(){
      if (!(await confirma("Voltar este tema ao texto trazido do Notion? A versão atual fica guardada para desfazer.", "Voltar ao original", true))) return;
      p.anterior = {titulo:p.titulo, md:p.md};
      p.titulo = original.titulo; p.md = original.md; salva(); ler(); window.scrollTo(0, 0);
    });
  }

  ler();
  return Object.assign({titulo:"Estudo"}, voltar);
}
