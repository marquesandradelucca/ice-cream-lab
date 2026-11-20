// Biblioteca: hub da aba com Ingredientes e as seções do Estudo, cada uma como um bloco de capa.
// Rota: #/biblioteca
import { dados } from "../dados.js?v=20261120173630";
import { GRUPOS_ESTUDO } from "../estudo-base.js?v=20261120173630";
import { icone, capa } from "../visual.js?v=20261120173630";

function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function plural(n, um, varios){ return n + " " + (n === 1 ? um : varios); }

// Blocos da Biblioteca: a capa padrão pode ser trocada em Ajustes › Personalização.
export const WIDGETS_BIBLIOTECA = [
  {id:"ingredientes", nome:"Ingredientes", padrao:"paleta:Pistache"},
  {id:"fundamentos", nome:"Fundamentos", padrao:"paleta:Baunilha"},
  {id:"bases", nome:"Bases e técnicas", padrao:"paleta:Morango"},
  {id:"guia", nome:"Guia de ingredientes", padrao:"paleta:Caramelo"},
  {id:"referencias", nome:"Bibliografia", padrao:"paleta:Coco"}
];
export function capaBiblioteca(db, id){
  const w = WIDGETS_BIBLIOTECA.find(function(x){ return x.id === id; });
  // Mesma chave da Home (db.home): Ingredientes é um só nos dois lugares.
  return (db.home && db.home[id]) || (db.biblioteca && db.biblioteca[id]) || (w && w.padrao);
}

export function render(el){
  document.body.classList.add("ui");
  const db = dados();
  const temas = function(g){ return db.estudo.filter(function(p){ return p.grupo === g; }).length; };
  const grupo = function(id){ return GRUPOS_ESTUDO.find(function(g){ return g[0] === id; }); };
  const bloco = function(href, nome, sub, id, extra){
    return '<a class="ui-bloco" href="' + href + '" style="--capa:' + capa(nome, capaBiblioteca(db, id)) + ';' + (extra || '') + '">' +
      '<span class="titulo">' + esc(nome) + '</span><span class="ui-sec">' + esc(sub) + '</span></a>';
  };
  // Bibliografia: conta as referências (cada link do tema vira um cartão).
  const bib = db.estudo.find(function(p){ return p.id === "bibliografia"; });
  const nRefs = bib ? (bib.md.match(/\[[^\]]+\]\([^)]+\)/g) || []).length : 0;
  const nomeG = function(id, padrao){ const g = grupo(id); return g ? g[1] : padrao; };
  el.innerHTML =
    '<div class="ui-app">' +
    '<header class="ui-cabecalho"><h1>Biblioteca</h1></header>' +
    '<div class="ui-tela bib-tela">' +
      bloco("#/ingredientes", "Ingredientes", plural(db.ingredientes.length, "ingrediente", "ingredientes") + " · composição", "ingredientes", "min-height:170px") +
      // As 4 seções do Estudo, do mesmo tamanho, preenchendo o resto da tela.
      '<div class="bib-grade">' +
        bloco("#/estudo/grupo/fundamentos", nomeG("fundamentos", "Fundamentos"), plural(temas("fundamentos"), "tema", "temas"), "fundamentos") +
        bloco("#/estudo/grupo/bases", nomeG("bases", "Bases e técnicas"), plural(temas("bases"), "tema", "temas"), "bases") +
        bloco("#/estudo/grupo/ingredientes", "Guia de ingredientes", plural(temas("ingredientes"), "tema", "temas"), "guia") +
        // Referências tem um tema só (Bibliografia): vai direto para ele.
        bloco("#/estudo/bibliografia", "Bibliografia", plural(nRefs, "referência", "referências"), "referencias") +
      '</div>' +
    '</div></div>';
  return {titulo:"Biblioteca", limpa:function(){ document.body.classList.remove("ui"); }};
}
