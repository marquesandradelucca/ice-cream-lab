import { dados, exportaBackup, importaBackup } from "../dados.js?v=20261116175557";
import { confirma } from "../ui.js?v=20261116175557";
import { toast } from "../app.js?v=20261116175557";

const OFICINA = [
  {area:"ideias",       nome:"Ideias",           desc:"Sabores para testar",          pronto:false},
  {area:"calculadora",  nome:"Calculadora",      desc:"Balanço da mistura ao vivo",   pronto:true},
  {area:"testes",       nome:"Testes",           desc:"Receitas em teste",            pronto:true},
  {area:"receitas",     nome:"Receitas",         desc:"Finais e rascunhos",                 pronto:true}
];
const BIBLIOTECA = [
  {area:"estudo",       nome:"Estudo",           desc:"Fundamentos e técnicas",       pronto:false},
  {area:"ingredientes", nome:"Ingredientes",     desc:"Composição de cada um",        pronto:true}
];

function bloco(titulo, itens){
  return '<section class="grupo-areas"><h2>' + titulo + '</h2><div class="grade">' +
    itens.map(function(a){
      return '<a class="area' + (a.pronto ? "" : " embreve") + '" href="#/' + a.area + '">' +
        '<span class="area-nome">' + a.nome + '</span>' +
        '<span class="area-desc">' + (a.pronto ? a.desc : "Em breve") + '</span></a>';
    }).join("") + '</div></section>';
}

function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

export function render(el){
  const db = dados();
  el.innerHTML =
    bloco("Oficina", OFICINA) + bloco("Biblioteca", BIBLIOTECA) +
    '<section class="grupo-areas backup"><h2>Backup</h2>' +
    '<p class="muted">Seus dados ficam só neste aparelho. Guarde um backup de vez em quando (no app Arquivos ou no Drive).</p>' +
    '<div class="acoes-linha"><button class="botao" type="button" id="exportar">Exportar backup</button>' +
    '<button class="botao secundario" type="button" id="importar">Importar backup</button></div>' +
    '<input type="file" id="arquivo" accept="application/json,.json" hidden></section>' +
    '<footer class="creditos muted">Ice Cream Lab · © 2026 Lucca Marques · v2.0 (etapa 2)</footer>';

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
