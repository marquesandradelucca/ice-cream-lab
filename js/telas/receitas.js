// Receitas (redesign): testes e finais juntos, com filtro Todas / Em teste / Finais.
// Rotas: #/receitas, #/receitas/teste, #/receitas/finais (o filtro fica no endereço para o voltar lembrar).
import { dados, versao, versoesDe, ingrediente } from "../dados.js?v=20261119141623";
import { NOMES_ESTILO } from "../calculo.js?v=20261119141623";
import { icone, capa, tomVidro, estrelas } from "../visual.js?v=20261119141623";

function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function normal(t){ return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }

let busca = "";

// Selos da receita, deduzidos dos ingredientes da versão: garrafinha = contém leite; folha = vegana.
// Leite = qualquer ingrediente com sólidos de leite ou soro. Vegana = sem leite e sem ovo, gelatina ou mel.
const NAO_VEGANOS = ["gema", "gelatina", "mel"];
export function selos(v){
  if (!v || !v.linhas || !v.linhas.length) return {leite:false, vegana:false};
  const comp = function(id){ return (v.snapshot && v.snapshot[id]) || ingrediente(id); };
  const leite = v.linhas.some(function(l){ const i = comp(l.id); return i && ((i.slng || 0) > 0 || (i.soro || 0) > 0); });
  const animal = v.linhas.some(function(l){ return NAO_VEGANOS.indexOf(l.id) >= 0; });
  return {leite:leite, vegana:!leite && !animal};
}
function selosHtml(v){
  const s = selos(v);
  return (s.leite ? '<span class="ui-etiqueta receitas-selo">' + icone("garrafa") + 'Com leite</span>' : '') +
    (s.vegana ? '<span class="ui-etiqueta receitas-selo">' + icone("folha") + 'Vegana</span>' : '');
}

// Usado por outras telas (ex.: Ideias) para listar receitas no formato antigo.
export function itemReceita(r, destino){
  const vs = versoesDe(r.id);
  const v = r.versaoFinal ? versao(r.versaoFinal) : vs[vs.length - 1];
  return '<a class="item-lista" href="' + destino + '"><span class="item-nome">' + esc(r.nome) + '</span><span class="item-desc muted">' +
    (NOMES_ESTILO[r.estilo] || "") + (v ? ' · v' + v.numero : '') + '</span></a>';
}

export function render(el, rota){
  document.body.classList.add("ui");
  const db = dados();
  const filtro = ["teste", "finais", "leite", "vegana"].indexOf(rota.args[0]) >= 0 ? rota.args[0] : "todas";
  const lotesDe = function(r){ return db.lotes.filter(function(l){ return l.receitaId === r.id; }).sort(function(a, b){ return b.inicio.localeCompare(a.inicio); }); };
  const ehFinal = function(r){ return r.status === "final" && r.versaoFinal && versao(r.versaoFinal); };

  const itens = db.receitas.map(function(r){
    const lotes = lotesDe(r), vs = versoesDe(r.id);
    return {r:r, lotes:lotes, final:!!ehFinal(r), v:ehFinal(r) ? versao(r.versaoFinal) : vs[vs.length - 1],
      data:(lotes[0] && lotes[0].inicio) || (vs.length ? vs[vs.length - 1].data : ""),
      avaliar:lotes.some(function(l){ return l.status === "aguardando"; })};
  });

  function desenha(){
    const q = normal(busca.trim());
    const lista = itens.filter(function(x){
      if (filtro === "teste" && x.final) return false;
      if (filtro === "finais" && !x.final) return false;
      if (filtro === "leite" && !selos(x.v).leite) return false;
      if (filtro === "vegana" && !selos(x.v).vegana) return false;
      return !q || normal(x.r.nome).indexOf(q) >= 0;
    }).sort(function(a, b){
      // Quem precisa de avaliação vem primeiro; depois, o mexido mais recentemente.
      if (a.avaliar !== b.avaliar) return a.avaliar ? -1 : 1;
      return b.data.localeCompare(a.data) || a.r.nome.localeCompare(b.r.nome);
    });
    const elLista = el.querySelector("#lista");
    if (!lista.length){
      elLista.innerHTML = '<p class="ui-sec receitas-vazio">' + (q ? 'Nada encontrado para “' + esc(busca.trim()) + '”.' :
        filtro === "finais" ? 'Nenhuma receita final ainda. Numa receita, marque a versão que ficou boa como final.' :
        filtro === "teste" ? 'Nenhuma receita em teste.' :
        filtro === "leite" ? 'Nenhuma receita com leite.' :
        filtro === "vegana" ? 'Nenhuma receita vegana ainda.' : 'Nenhuma receita ainda. Comece pela Calculadora.') + '</p>';
      return;
    }
    elLista.innerHTML = lista.map(function(x){
      const r = x.r, ultimo = x.lotes[0];
      const avaliado = x.lotes.find(function(l){ return l.status === "concluido" && l.avaliacao && l.avaliacao.nota; });
      let info = (NOMES_ESTILO[r.estilo] || "") + (x.v ? ' · v' + x.v.numero : '');
      let extra = "";
      if (x.avaliar) info += ' · lote para avaliar';
      else if (ultimo && ultimo.status === "em andamento") info += ' · lote preparando';
      else if (avaliado) extra = estrelas(avaliado.avaliacao.nota);
      else if (!ultimo) info += ' · sem lote';
      const href = "#/receita/" + encodeURIComponent(r.id) + (x.final ? "/pronta" : "");
      return '<a class="ui-bloco receitas-cartao" href="' + href + '" style="--capa:' + capa(r.nome, r.capa) + ';--ui-tom:' + (tomVidro(r.nome, r.capa) || 'rgba(255,255,255,.24)') + '">' +
        '<span class="titulo">' + esc(r.nome) + '</span>' +
        '<span class="ui-sec receitas-info">' + esc(info) + extra + '</span>' +
        // Etiquetas lado a lado: situação (Final/Teste) e selos (com leite / vegana).
        '<span class="receitas-etiquetas"><span class="ui-etiqueta' + (x.final ? ' final' : '') + '">' + (x.final ? 'Final' : 'Teste') + '</span>' + selosHtml(x.v) + '</span></a>';
    }).join("");
  }

  const filtroBtn = function(id, nome){ return '<a class="ui-filtro" href="#/receitas' + (id === "todas" ? "" : "/" + id) + '" aria-pressed="' + (filtro === id) + '">' + nome + '</a>'; };
  el.innerHTML =
    '<div class="ui-app">' +
    '<header class="ui-cabecalho com-extras"><h1>Receitas</h1>' +
      '<button class="ui-redondo" type="button" id="buscar" aria-label="Buscar receita">' + icone("buscar") + '</button>' +
      '<a class="ui-redondo" href="#/calculadora" aria-label="Nova receita">' + icone("mais") + '</a>' +
      '<input id="campoBusca" class="ui-campo" type="search" placeholder="Buscar receita" aria-label="Buscar receita" value="' + esc(busca) + '"' + (busca ? '' : ' hidden') + '>' +
      '<div class="ui-filtros estudo-filtros">' + filtroBtn("todas", "Todas") + filtroBtn("teste", "Em teste") + filtroBtn("finais", "Finais") + filtroBtn("leite", "Com leite") + filtroBtn("vegana", "Veganas") + '</div>' +
    '</header>' +
    '<div class="ui-tela">' +
      '<div id="lista" class="receitas-lista"></div>' +
    '</div></div>';

  const campo = el.querySelector("#campoBusca");
  el.querySelector("#buscar").addEventListener("click", function(){
    campo.hidden = !campo.hidden;
    if (!campo.hidden) campo.focus(); else { busca = ""; campo.value = ""; desenha(); }
  });
  campo.addEventListener("input", function(){ busca = campo.value; desenha(); });
  desenha();
  // Filtro escolhido sempre visível (a fileira rola de lado).
  const ativo = el.querySelector('.ui-filtro[aria-pressed="true"]'); if (ativo) ativo.scrollIntoView({inline:"nearest", block:"nearest"});
  return {titulo:"Receitas", limpa:function(){ document.body.classList.remove("ui"); }};
}
