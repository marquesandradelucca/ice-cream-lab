// Receitas: só as finais (abrem a receita pronta). As que ainda não são finais ficam em Testes.
import { dados, versao, versoesDe } from "../dados.js?v=20261117034523";
import { NOMES_ESTILO } from "../calculo.js?v=20261117034523";

function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function porNome(a, b){ return a.nome.localeCompare(b.nome); }

export function itemReceita(r, destino){
  const vs = versoesDe(r.id);
  const v = r.versaoFinal ? versao(r.versaoFinal) : vs[vs.length - 1];
  return '<a class="item-lista" href="' + destino + '">' +
    '<span class="item-nome">' + esc(r.nome) + '</span><span class="item-desc muted">' + NOMES_ESTILO[r.estilo] +
    (v ? ' · v' + v.numero : '') + (vs.length > 1 ? ' · ' + vs.length + ' versões' : '') + '</span></a>';
}

export function render(el){
  const db = dados();
  const finais = db.receitas.filter(function(r){ return r.status === "final" && r.versaoFinal && versao(r.versaoFinal); }).sort(porNome);


  el.innerHTML =
    (finais.length ?
      '<section class="lista-cards">' + finais.map(function(r){ return itemReceita(r, "#/receita/" + encodeURIComponent(r.id) + "/pronta"); }).join("") + '</section>' :
      '<p class="muted bloco-vazio">Nenhuma receita final ainda. Em Testes, abra uma receita e marque a versão que ficou boa como final.</p>');
  return {titulo:"Receitas"};
}
