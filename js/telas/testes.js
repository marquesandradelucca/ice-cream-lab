// Testes: uma lista só, das receitas que estão sendo testadas (status "em teste"
// ou com lote aberto). Cada card mostra o último lote e, se algum lote precisa de algo,
// uma pílula "avaliar" ou "preparando". Tocar abre a página da receita (versões e lotes).
import { dados, versao, versoesDe } from "../dados.js?v=20261117020901";
import { resumoLote } from "./lote.js?v=20261117020901";

function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function data(iso){ try { return new Date(iso).toLocaleDateString("pt-BR", {day:"2-digit", month:"short"}); } catch (e) { return ""; } }

export function render(el){
  const db = dados();
  function lotesDe(r){ return db.lotes.filter(function(l){ return l.receitaId === r.id; }).sort(function(a, b){ return b.inicio.localeCompare(a.inicio); }); }
  const receitas = db.receitas.filter(function(r){
    return r.status === "em teste" || lotesDe(r).some(function(l){ return l.status !== "concluido"; });
  }).map(function(r){ return {r:r, lotes:lotesDe(r)}; })
  // Primeiro as que pedem ação, depois as com lote mais recente.
    .sort(function(a, b){
      const pa = a.lotes.some(function(l){ return l.status === "aguardando"; }) ? 0 : 1;
      const pb = b.lotes.some(function(l){ return l.status === "aguardando"; }) ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return ((b.lotes[0] || {}).inicio || "").localeCompare((a.lotes[0] || {}).inicio || "") || a.r.nome.localeCompare(b.r.nome);
    });

  el.innerHTML = receitas.length ? '<section class="lista-cards">' + receitas.map(function(x){
    const r = x.r, ultimo = x.lotes[0];
    const vs = versoesDe(r.id), v = vs[vs.length - 1];
    const avaliar = x.lotes.find(function(l){ return l.status === "aguardando"; });
    const preparando = x.lotes.find(function(l){ return l.status === "em andamento"; });
    const pilula = avaliar ? '<span class="pilula-preta pilula-etiqueta">avaliar</span>' :
                   preparando ? '<span class="pilula-cinza pilula-etiqueta">preparando</span>' : '';
    const desc = (v ? 'v' + v.numero : '') +
      (ultimo ? ' · último lote ' + data(ultimo.inicio) + (ultimo.status === "concluido" ? ' · ' + resumoLote(ultimo) : '') : ' · nenhum lote ainda');
    return '<a class="item-lista item-teste" href="#/receita/' + encodeURIComponent(r.id) + '">' +
      '<span class="item-texto"><span class="item-nome">' + esc(r.nome) + '</span><span class="item-desc">' + esc(desc) + '</span></span>' + pilula + '</a>';
  }).join("") + '</section>' :
    '<p class="muted bloco-vazio">Nenhuma receita em teste. Na página de uma receita, toque em “Fazer lote” ou em “Em teste”.</p>';
  return {titulo:"Testes"};
}
