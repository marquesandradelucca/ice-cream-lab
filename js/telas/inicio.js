// Home (redesign): hub com blocos de cada área.
// Para avaliar (se houver lote esperando) · Calculadora + Ideias/Ingredientes · Receitas (faixa lateral) · Estudo.
import { dados, receita, versao, versoesDe } from "../dados.js?v=20261121091931";
import { abreAjustes } from "./ajustes.js?v=20261121091931";
import { dataCurta } from "./lote.js?v=20261121091931";
import { icone, capa, tomVidro } from "../visual.js?v=20261121091931";

function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function diasDesde(iso){ const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); return d <= 0 ? "hoje" : d === 1 ? "há 1 dia" : "há " + d + " dias"; }

// Miniatura genérica do gráfico de intervalos (só símbolo, sem receita).
function miniGrafico(){
  return [[20,55,40],[35,70,60],[25,60,30],[40,75,55]].map(function(f){
    return '<div class="ui-faixa mini"><div class="trilho"><span class="ideal" style="left:' + f[0] + '%;width:' + (f[1] - f[0]) + '%"></span><span class="traco" style="left:' + f[2] + '%"></span></div></div>';
  }).join("");
}

// Widgets da Home com imagem: o padrão pode ser trocado em Ajustes › Personalização.
export const WIDGETS_HOME = [
  {id:"ingredientes", nome:"Ingredientes", padrao:"paleta:Pistache"},
  {id:"estudo", nome:"Estudo", padrao:"paleta:Baunilha"}
];
export function capaHome(db, id){
  const w = WIDGETS_HOME.find(function(x){ return x.id === id; });
  return (db.home && db.home[id]) || (w && w.padrao);
}

export function render(el){
  document.body.classList.add("ui");
  const db = dados();

  // Lote esperando avaliação (o mais antigo primeiro).
  const aguardando = db.lotes.filter(function(l){
    // Preparo de receita final não tem avaliação: não vira lembrete.
    const r = receita(l.receitaId); if (r && r.status === "final" && r.versaoFinal === l.versaoId) return false;
    return l.status === "aguardando"; })
    .sort(function(a, b){ return a.inicio.localeCompare(b.inicio); });
  // Um cartão por lote esperando; com mais de um, rolam para o lado.
  const cartaoAvaliar = function(l){
    const r = receita(l.receitaId), v = versao(l.versaoId);
    const nome = (r ? r.nome : "Receita") + (v ? " · v" + v.numero : "");
    return '<section class="ui-bloco home-avaliar" style="--capa:' + capa(r ? r.nome : "", r && r.capa) + ';--ui-tom:' + ((r && tomVidro(r.nome, r.capa)) || 'rgba(255,255,255,.24)') + '">' +
      '<span class="ui-rotulo home-avaliar-rotulo">Para avaliar</span>' +
      '<a class="ui-botao vidro-escuro home-avaliar-botao" href="#/lote/' + encodeURIComponent(l.id) + '/avaliar">Avaliar</a>' +
      '<span class="titulo home-avaliar-nome">' + esc(nome) + '</span>' +
      '<span class="ui-sec">Lote de ' + dataCurta(l.inicio) + ' · no freezer ' + diasDesde(l.inicio) + '</span></section>';
  };
  let avaliar = "";
  if (aguardando.length === 1) avaliar = cartaoAvaliar(aguardando[0]);
  else if (aguardando.length > 1) avaliar = '<div class="ui-rolagem home-avaliar-faixa">' + aguardando.map(cartaoAvaliar).join("") + '</div>';

  // Continuar teste: as duas últimas receitas com teste em aberto (pelo lote mais recente de cada).
  const ultimoLote = {};
  db.lotes.forEach(function(l){
    const r = receita(l.receitaId); if (!r || r.status === "final") return;
    const quando = String(l.fim || l.inicio || "");
    if (!ultimoLote[r.id] || quando > ultimoLote[r.id].quando) ultimoLote[r.id] = {l:l, quando:quando};
  });
  // Lote mais recente já avaliado (concluído) = teste terminado: sai do widget.
  const continuar = Object.keys(ultimoLote).map(function(id){ return ultimoLote[id]; })
    .filter(function(x){ return x.l.status !== "concluido"; })
    .sort(function(a, b){ return b.quando.localeCompare(a.quando); }).slice(0, 2)
    .map(function(x){
      const r = receita(x.l.receitaId), v = versao(x.l.versaoId);
      return '<a class="ui-bloco home-continuar" href="#/receita/' + encodeURIComponent(r.id) + '" style="--capa:' + capa(r.nome, r.capa) + ';--ui-tom:' + (tomVidro(r.nome, r.capa) || 'rgba(255,255,255,.24)') + '">' +
        '<span class="ui-rotulo home-continuar-rotulo">Continuar</span>' +
        '<span class="ui-redondo escuro home-continuar-seta" aria-hidden="true">' + icone("direita") + '</span>' +
        '<span class="titulo home-continuar-nome">' + esc(r.nome) + '</span>' +
        '<span class="ui-sec">' + (v ? 'v' + v.numero + ' · ' : '') + 'lote de ' + dataCurta(x.l.fim || x.l.inicio) + '</span></a>';
    }).join("");
  const blocoContinuar = continuar ? '<div class="home-continuar-par">' + continuar + '</div>' : '';

  // Receitas: da aberta por último (à esquerda) para a vista há mais tempo; nunca abertas vão ao fim, das mexidas mais recentemente.
  const ultimaData = function(r){ const vs = versoesDe(r.id); return vs.length ? vs[vs.length - 1].data : ""; };
  let vistas = {}; try { vistas = JSON.parse(localStorage.getItem("icl-vistas") || "{}"); } catch(e){}
  const receitas = db.receitas.slice().sort(function(a, b){
    const va = vistas[a.id] || 0, vb = vistas[b.id] || 0;
    if (va !== vb) return vb - va;
    return ultimaData(b).localeCompare(ultimaData(a));
  });
  const faixa = receitas.length ? '<div class="ui-rolagem">' + receitas.map(function(r){
    const final = r.status === "final" && r.versaoFinal && versao(r.versaoFinal);
    const href = "#/receita/" + encodeURIComponent(r.id) + (final ? "/pronta" : "");
    return '<a class="ui-bloco pequeno home-capa" href="' + href + '" style="--capa:' + capa(r.nome, r.capa) + '"><span class="ui-etiqueta' + (final ? ' final' : '') + '">' + (final ? 'Final' : 'Teste') + '</span><span class="titulo">' + esc(r.nome) + '</span></a>';
  }).join("") + '</div>' : '<p class="ui-sec">Nenhuma receita ainda. Comece pela Calculadora.</p>';

  const paraTestar = db.ideias.filter(function(x){ return !(x.receitaId && receita(x.receitaId)); }).length;

  el.innerHTML =
    '<div class="ui-app">' +
    '<header class="ui-cabecalho"><h1>Ice Cream Lab</h1><button class="ui-redondo" type="button" id="abreAjustes" aria-label="Ajustes">' + icone("ajustes") + '</button></header>' +
    '<div class="ui-tela home-tela' + (aguardando.length ? ' com-avaliar' : '') + '">' +
      avaliar + blocoContinuar +
      '<div class="ui-par home-par">' +
        '<a class="ui-cartao ui-vidro home-calc" href="#/calculadora"><h2>Calculadora</h2><div class="home-mini">' + miniGrafico() + '</div></a>' +
        '<div class="home-coluna">' +
          '<a class="ui-cartao ui-vidro home-ideias" href="#/ideias"><h2>Ideias</h2><span class="home-numero ui-num">' + paraTestar + '</span><span class="ui-sec">para testar</span></a>' +
          '<a class="ui-bloco home-ingredientes" href="#/ingredientes" style="--capa:' + capa("Ingredientes", capaHome(db, "ingredientes")) + '"><span class="titulo">Ingredientes</span></a>' +
        '</div>' +
      '</div>' +
      '<section class="ui-cartao ui-vidro home-receitas"><a class="home-titulo-link" href="#/receitas"><h2>Receitas</h2></a>' + faixa + '</section>' +
      '<a class="ui-bloco home-estudo" href="#/estudo" style="--capa:' + capa("Estudo", capaHome(db, "estudo")) + '"><span class="titulo">Estudo</span></a>' +
    '</div></div>';

  // Ajustes em folha; ao fechar, a Home redesenha (as capas podem ter mudado).
  el.querySelector("#abreAjustes").addEventListener("click", function(){ abreAjustes(function(){ render(el); }); });
  return {titulo:"Ice Cream Lab", limpa:function(){ document.body.classList.remove("ui"); }};
}
