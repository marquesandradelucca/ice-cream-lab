import { dados, exportaBackup, importaBackup, receita, versao } from "../dados.js?v=20261117020901";
import { confirma } from "../ui.js?v=20261117020901";
import { dataCurta } from "./lote.js?v=20261117020901";
import { situacao, aoMudar } from "../sync.js?v=20261117020901";
import { textoSituacao } from "./ajustes.js?v=20261117020901";
import { toast } from "../app.js?v=20261117020901";

const OFICINA = [
  {area:"ideias",       nome:"Ideias",           desc:"Sabores para testar",          pronto:true},
  {area:"calculadora",  nome:"Calculadora",      desc:"Balanço da mistura ao vivo",   pronto:true},
  {area:"testes",       nome:"Testes",           desc:"Lotes e receitas em teste",    pronto:true},
  {area:"receitas",     nome:"Receitas",         desc:"Receitas finais",                 pronto:true}
];
const BIBLIOTECA = [
  {area:"estudo",       nome:"Estudo",           desc:"Fundamentos e técnicas",       pronto:true},
  {area:"ingredientes", nome:"Ingredientes",     desc:"Composição de cada um",        pronto:true}
];

function bloco(titulo, itens){
  const lotes = dados().lotes;
  const preparando = lotes.filter(function(l){ return l.status === "em andamento"; }).length;
  const avisoTestes = preparando ? preparando + (preparando === 1 ? " lote preparando" : " lotes preparando") : "";
  // O card de Ideias mostra as últimas anotadas (até 3) e quantas mais existem.
  const ideias = dados().ideias;
  const listaIdeias = '<span class="area-ideias">' + ideias.slice(0, 3).map(function(x){
    return '<span class="area-ideia">' + esc(x.nome) + '</span>';
  }).join("") + (ideias.length > 3 ? '<span class="area-desc">+ ' + (ideias.length - 3) + ' ' + (ideias.length - 3 === 1 ? 'ideia' : 'ideias') + '</span>' : '') + '</span>';
  return '<section class="grupo-areas"><h2>' + titulo + '</h2><div class="grade">' +
    itens.map(function(a){
      return '<a class="area' + (a.pronto ? "" : " embreve") + '" href="#/' + a.area + '">' +
        '<span class="area-nome">' + a.nome + '</span>' +
        (a.area === "ideias" && ideias.length ? listaIdeias :
        '<span class="area-desc">' + (a.area === "testes" && avisoTestes ? avisoTestes :
          a.pronto ? a.desc : "Em breve") + '</span>') + '</a>';
    }).join("") + '</div></section>';
}

function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

export function render(el){
  const db = dados();
  // Lembrete: lotes preparados que ainda faltam avaliar.
  const aguardando = db.lotes.filter(function(l){ return l.status === "aguardando"; })
    .sort(function(a, b){ return a.inicio.localeCompare(b.inicio); });
  const lembrete = aguardando.length ? '<section class="lembrete">' + aguardando.map(function(l){
    const r = receita(l.receitaId), v = versao(l.versaoId);
    return '<a class="lembrete-item" href="#/lote/' + encodeURIComponent(l.id) + '/avaliar">' +
      '<span class="lembrete-rotulo">Avaliar lote</span>' +
      '<span class="lembrete-nome">' + esc(r ? r.nome : "Receita") + (v ? ' · v' + v.numero : '') + '</span>' +
      '<span class="lembrete-data">preparado em ' + dataCurta(l.inicio) + '</span></a>';
  }).join("") + '</section>' : '';
  el.innerHTML =
    lembrete +
    bloco("Oficina", OFICINA) + bloco("Biblioteca", BIBLIOTECA) +
    // Backup e conta foram para Ajustes; aqui fica só a situação da sincronização.
    '<a class="item-lista item-ajustes" href="#/ajustes"><span class="item-nome">Ajustes</span>' +
      '<span class="item-desc" id="situacaoSync">' + esc(textoSituacao(situacao())) + '</span></a>' +
    '<footer class="creditos muted">Ice Cream Lab · © 2026 Lucca Marques · v2.0 (etapa 5)</footer>';
  const parar = aoMudar(function(s){ const e = document.getElementById("situacaoSync"); if (e) e.textContent = textoSituacao(s); });
  return {titulo:"Ice Cream Lab", limpa:parar};
}

