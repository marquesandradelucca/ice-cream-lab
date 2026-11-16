// Receitas: as finais em destaque (abrem a receita pronta) e os rascunhos embaixo
// (abrem a página de versões). As que estão "em teste" ficam na área Testes.
import { dados, versao, versoesDe } from "../dados.js?v=20261116175557";
import { NOMES_ESTILO } from "../calculo.js?v=20261116175557";

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
  const rascunhos = db.receitas.filter(function(r){ return r.status === "rascunho" || (r.status === "final" && !versao(r.versaoFinal)); }).sort(porNome);

  el.innerHTML =
    (finais.length ?
      '<section class="lista-cards">' + finais.map(function(r){ return itemReceita(r, "#/receita/" + encodeURIComponent(r.id) + "/pronta"); }).join("") + '</section>' :
      '<p class="muted">Nenhuma receita final ainda. Na página de versões de uma receita, toque em “Final”.</p>') +
    (rascunhos.length ? '<h2 class="subtitulo">Rascunhos</h2><section class="lista-cards">' +
      rascunhos.map(function(r){ return itemReceita(r, "#/receita/" + encodeURIComponent(r.id)); }).join("") + '</section>' : "");
  return {titulo:"Receitas"};
}
