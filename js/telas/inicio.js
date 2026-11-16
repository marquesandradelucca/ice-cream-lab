import { dados, exportaBackup, importaBackup, receita, versao } from "../dados.js?v=20261116194924";
import { confirma } from "../ui.js?v=20261116194924";
import { dataCurta } from "./lote.js?v=20261116194924";
import { toast } from "../app.js?v=20261116194924";

const OFICINA = [
  {area:"ideias",       nome:"Ideias",           desc:"Sabores para testar",          pronto:false},
  {area:"calculadora",  nome:"Calculadora",      desc:"Balanço da mistura ao vivo",   pronto:true},
  {area:"testes",       nome:"Testes",           desc:"Lotes e receitas em teste",    pronto:true},
  {area:"receitas",     nome:"Receitas",         desc:"Receitas finais",                 pronto:true}
];
const BIBLIOTECA = [
  {area:"estudo",       nome:"Estudo",           desc:"Fundamentos e técnicas",       pronto:false},
  {area:"ingredientes", nome:"Ingredientes",     desc:"Composição de cada um",        pronto:true}
];

function bloco(titulo, itens){
  const lotes = dados().lotes;
  const preparando = lotes.filter(function(l){ return l.status === "em andamento"; }).length;
  const avisoTestes = preparando ? preparando + (preparando === 1 ? " lote preparando" : " lotes preparando") : "";
  return '<section class="grupo-areas"><h2>' + titulo + '</h2><div class="grade">' +
    itens.map(function(a){
      return '<a class="area' + (a.pronto ? "" : " embreve") + '" href="#/' + a.area + '">' +
        '<span class="area-nome">' + a.nome + '</span>' +
        '<span class="area-desc">' + (a.area === "testes" && avisoTestes ? avisoTestes :
          a.pronto ? a.desc : "Em breve") + '</span></a>';
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
    '<section class="grupo-areas backup"><h2>Backup</h2>' +
    '<p class="muted">Seus dados ficam só neste aparelho. Guarde um backup de vez em quando (no app Arquivos ou no Drive).</p>' +
    '<div class="acoes-linha"><button class="botao" type="button" id="exportar">Exportar backup</button>' +
    '<button class="botao secundario" type="button" id="importar">Importar backup</button></div>' +
    '<input type="file" id="arquivo" accept="application/json,.json" hidden></section>' +
    '<footer class="creditos muted">Ice Cream Lab · © 2026 Lucca Marques · v2.0 (etapa 3)</footer>';

  el.querySelector("#exportar").addEventListener("click", exportaBackup);
  const arq = el.querySelector("#arquivo");
  el.querySelector("#importar").addEventListener("click", function(){ arq.click(); });
  arq.addEventListener("change", function(){
    const f = arq.files && arq.files[0]; if (!f) return;
    const leitor = new FileReader();
    leitor.onload = async function(){
      try {
        const ehCompleto = /"versaoDados"/.test(leitor.result);
        if (ehCompleto && !(await confirma("Restaurar este backup substitui todos os dados atuais do app. Continuar?", "Restaurar", true))) return;
        toast(importaBackup(leitor.result));
        render(el);
      } catch (e) { toast("Não consegui ler o arquivo: " + e.message); }
    };
    leitor.readAsText(f);
    arq.value = "";
  });
  return {titulo:"Ice Cream Lab"};
}
