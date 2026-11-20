// Guia de componentes do redesign (Fase 1). Rota escondida: #/guia
// Serve para conferir os componentes novos no Mac e no iPhone antes de refazer as telas.
import { icone, estrelas, estrelasEscolha, capa, DUREZA, DOCURA } from "../visual.js?v=20261120172649";

export function render(el){
  document.body.classList.add("ui");
  const faixa = function(nome, valor, a, b, m, atencao){
    return '<div class="ui-faixa' + (nome ? '' : ' mini') + '"><div class="topo"><span>' + nome + '</span><b class="' + (atencao ? 'atencao' : '') + '">' + valor + '</b></div>' +
      '<div class="trilho"><span class="ideal" style="left:' + a + '%;width:' + (b - a) + '%"></span><span class="traco" style="left:' + m + '%"></span></div></div>';
  };
  const opcoes = function(lista, sel){ return '<div class="ui-opcoes">' + lista.map(function(o){ return '<button type="button" aria-pressed="' + (o[0] === sel) + '">' + o[1] + '</button>'; }).join("") + '</div>'; };
  el.innerHTML =
    '<div class="ui-app">' +
    '<header class="ui-cabecalho"><h1>Guia</h1><button class="ui-redondo" type="button" id="abreFolha" aria-label="Abrir folha">' + icone("ajustes") + '</button></header>' +
    '<div class="ui-tela">' +
      // Bloco grande com botão no canto
      '<a class="ui-bloco" style="--capa:' + capa("Chocolate 70%") + ';min-height:140px">' +
        '<span class="ui-rotulo" style="position:absolute;top:28px;left:16px">Para avaliar</span>' +
        '<span class="ui-botao vidro-escuro" style="position:absolute;top:16px;right:16px">Avaliar</span>' +
        '<span class="titulo" style="font-size:20px">Chocolate 70% · v2</span><span class="ui-sec">Lote no freezer há 2 dias</span></a>' +
      // Cartões de vidro lado a lado
      '<div style="display:flex;gap:12px">' +
        '<section class="ui-cartao ui-vidro" style="flex:1"><h2>Calculadora</h2>' + faixa("", "", 20, 55, 40) + faixa("", "", 35, 70, 60) + faixa("", "", 25, 60, 30) + faixa("", "", 40, 75, 55) + '</section>' +
        '<section class="ui-cartao ui-vidro" style="flex:1;gap:4px"><h2>Ideias</h2><span style="font-size:28px;font-weight:700">5</span><span class="ui-sec">para testar</span></section>' +
      '</div>' +
      // Faixa de receitas
      '<section class="ui-cartao ui-vidro" style="overflow:hidden"><h2>Receitas</h2><div class="ui-rolagem">' +
        ["Base branca", "Pistache", "Manga", "Figo", "Morango"].map(function(n){ return '<a class="ui-bloco pequeno" style="--capa:' + capa(n) + ';width:92px;height:112px"><span class="titulo">' + n + '</span></a>'; }).join("") +
      '</div></section>' +
      // Cartão de receita (lista)
      '<a class="ui-bloco" style="--capa:' + capa("Sorbet de manga") + ';min-height:200px"><div style="display:flex;align-items:flex-end;gap:8px"><span class="titulo" style="flex:1">Sorbet de manga</span><span class="ui-etiqueta">Teste</span></div><span class="ui-sec">Sorbet · v1 · sem lote</span></a>' +
      '<a class="ui-bloco" style="--capa:' + capa("Base branca de gelato") + ';min-height:200px"><div style="display:flex;align-items:flex-end;gap:8px"><span class="titulo" style="flex:1">Base branca de gelato</span><span class="ui-etiqueta final">Final</span></div><span class="ui-sec" style="display:flex;gap:8px;align-items:center">Gelato · v3 ' + estrelas(5) + '</span></a>' +
      // Botões e filtros
      '<div class="ui-filtros"><button class="ui-filtro" aria-pressed="true">Todas</button><button class="ui-filtro" aria-pressed="false">Em teste</button><button class="ui-filtro" aria-pressed="false">Finais</button></div>' +
      '<div style="display:flex;gap:8px"><button class="ui-botao preto" style="flex:2">+ ingrediente</button><button class="ui-botao vidro perigo" style="flex:1">Excluir</button></div>' +
      // Gráfico de intervalos
      '<section class="ui-cartao ui-vidro"><div style="display:flex;justify-content:space-between"><h2>Composição</h2><span class="ui-sec">4 de 5 na faixa</span></div>' +
        faixa("Gordura", "7,7%", 20, 45, 36) + faixa("Açúcares", "19,7%", 42, 62, 54) + faixa("POD", "214", 35, 58, 62, true) + '</section>' +
      // Avaliação
      '<section class="ui-cartao ui-vidro"><h2>Dureza</h2>' + opcoes(DUREZA, "firme") + '</section>' +
      '<section class="ui-cartao ui-vidro"><h2>Doçura</h2>' + opcoes(DOCURA, "doce") + '</section>' +
      '<section class="ui-cartao ui-vidro"><h2>Nota</h2>' + estrelasEscolha(4) + '</section>' +
      // Campo e lista
      '<input class="ui-campo" placeholder="Anotar uma ideia…">' +
      '<section class="ui-cartao ui-vidro"><h2>Ingredientes</h2><div class="ui-linhas">' +
        [["Leite integral","597 g"],["Creme 35%","160 g"],["Açúcar","150 g"]].map(function(l){ return '<div class="ui-linha"><span>' + l[0] + '</span><b class="ui-num">' + l[1] + '</b></div>'; }).join("") + '</div></section>' +
    '</div>' +
    '<nav class="ui-abas" aria-label="Abas">' +
      [["home","Home",true],["ideia","Ideias"],["calculadora","Calculadora"],["receitas","Receitas"],["biblioteca","Biblioteca"]].map(function(a){ return '<a href="#/guia"' + (a[2] ? ' aria-current="page"' : '') + '>' + icone(a[0]) + a[1] + '</a>'; }).join("") +
    '</nav></div>';

  // Folha de exemplo
  el.querySelector("#abreFolha").addEventListener("click", function(){
    const veu = document.createElement("div"); veu.className = "ui-veu";
    const f = document.createElement("div"); f.className = "ui-folha"; f.setAttribute("role", "dialog");
    f.innerHTML = '<span class="puxador"></span><div class="acoes"><button class="ui-botao vidro" id="fx">Cancelar</button><button class="ui-botao preto" id="fy">Salvar</button></div>' +
      '<h2>Salvar receita</h2><input class="ui-campo" placeholder="O que mudou? (opcional)">';
    document.body.append(veu, f);
    const fecha = function(){ veu.remove(); f.remove(); };
    veu.addEventListener("click", fecha); f.querySelector("#fx").addEventListener("click", fecha); f.querySelector("#fy").addEventListener("click", fecha);
  });
  // Seletores e estrelas clicáveis
  el.querySelectorAll(".ui-opcoes,.ui-filtros").forEach(function(g){ g.addEventListener("click", function(ev){ const b = ev.target.closest("button"); if (!b) return; g.querySelectorAll("button").forEach(function(x){ x.setAttribute("aria-pressed", x === b); }); }); });
  const est = el.querySelector(".ui-estrelas.grandes");
  est.addEventListener("click", function(ev){ const b = ev.target.closest("button"); if (!b) return; const n = Number(b.dataset.nota); est.querySelectorAll("button").forEach(function(x){ x.classList.toggle("vazia", Number(x.dataset.nota) > n); }); });

  return {titulo:"Guia", limpa:function(){ document.body.classList.remove("ui"); }};
}
