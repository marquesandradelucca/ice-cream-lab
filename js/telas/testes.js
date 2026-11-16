// Testes (versão provisória até a etapa 3): lista as receitas marcadas "em teste",
// com acesso às versões. O diário de lotes e o modo lote entram na etapa 3.
import { dados } from "../dados.js?v=20261116175557";
import { itemReceita } from "./receitas.js?v=20261116175557";

export function render(el){
  const db = dados();
  const emTeste = db.receitas.filter(function(r){ return r.status === "em teste"; })
    .sort(function(a, b){ return a.nome.localeCompare(b.nome); });
  el.innerHTML =
    '<h2 class="subtitulo">Receitas em teste</h2>' +
    (emTeste.length ? '<section class="lista-cards">' + emTeste.map(function(r){ return itemReceita(r, "#/receita/" + encodeURIComponent(r.id)); }).join("") + '</section>' :
      '<p class="muted">Nenhuma receita em teste. Na página de versões de uma receita, toque em “Em teste”.</p>') +
    '<p class="muted pequeno">O diário de lotes e o modo lote na bancada chegam na etapa 3.</p>';
  return {titulo:"Testes"};
}
