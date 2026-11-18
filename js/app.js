// Navegação do hub: cada área é uma "tela" escolhida pelo endereço (#/calculadora etc.).
import { carrega, dados, salva, novoId } from "./dados.js?v=20261118133701";
import { iniciaSync } from "./sync.js?v=20261118133701";
import * as inicio from "./telas/inicio.js?v=20261118133701";
import * as calculadora from "./telas/calculadora.js?v=20261118133701";
import * as ingredientes from "./telas/ingredientes.js?v=20261118133701";
import * as embreve from "./telas/embreve.js?v=20261118133701";
import * as receitas from "./telas/receitas.js?v=20261118133701";
import * as receita from "./telas/receita.js?v=20261118133701";
import * as testes from "./telas/testes.js?v=20261118133701";
import { icone, defineArmazemFotos } from "./visual.js?v=20261118133701";
import * as loteTela from "./telas/lote.js?v=20261118133701";
import * as estudo from "./telas/estudo.js?v=20261118133701";
import * as ideias from "./telas/ideias.js?v=20261118133701";
import * as ajustes from "./telas/ajustes.js?v=20261118133701";
import * as biblioteca from "./telas/biblioteca.js?v=20261118133701";
import * as guia from "./telas/guia.js?v=20261118133701";

const TELAS = {
  "": inicio,
  "calculadora": calculadora,
  "ingredientes": ingredientes,
  "receitas": receitas, "receita": receita,
  "testes": testes, "lote": loteTela,
  "ideias": ideias, "estudo": estudo, "ajustes": ajustes, "guia": guia, "biblioteca": biblioteca
};

const elTela = document.getElementById("tela");
const elTitulo = document.getElementById("titulo");
const elVoltar = document.getElementById("voltar");
let limpa = null;

// Voltar: sempre para a tela "de cima" no mapa do app, mostrando o nome do destino.
// Cada tela pode informar o seu (voltar + voltarRotulo); sem isso, o destino é a Home.
export function atualizaVoltar(href, rotulo){
  const destino = href || "#/";
  elVoltar.href = destino;
  elVoltar.setAttribute("aria-label", "Voltar para " + (rotulo || "Home"));
  // Nas telas internas o conteúdo já começa com o próprio título (nome da receita etc.).
  elTitulo.hidden = destino !== "#/";
}

// Topo: "Ice Cream Lab" sempre visível e leva à home. Logo abaixo, o voltar
// sobe para a tela de cima (com o nome do destino) e o título da tela.
function rota(){
  const partes = location.hash.replace(/^#\/?/, "").split("/");
  const nome = partes[0] || "";
  const tela = TELAS[nome] || inicio;
  if (typeof limpa === "function") limpa();
  elTela.innerHTML = "";
  window.scrollTo(0, 0);
  const res = tela.render(elTela, {area:nome, args:partes.slice(1)}) || {};
  elTitulo.textContent = res.titulo || "";
  document.title = res.titulo && nome ? res.titulo + " · Ice Cream Lab" : "Ice Cream Lab";
  elVoltar.hidden = !nome;
  if (nome) atualizaVoltar(res.voltar, res.voltarRotulo);
  else elTitulo.hidden = true;
  limpa = res.limpa || null;
  marcaAba(nome, partes[1]);
}

// Barra de abas: cada rota pertence a uma aba. O modo bancada do lote esconde as abas.
const ABA_DA_ROTA = {"":"home", ajustes:"home", guia:"home", ideias:"ideias", calculadora:"calculadora",
  receitas:"receitas", receita:"receitas", testes:"receitas", lote:"receitas",
  biblioteca:"biblioteca", estudo:"biblioteca", ingredientes:"biblioteca"};
function marcaAba(nome, sub){
  const aba = nome === "calculadora" && sub === "v" ? "receitas" : (ABA_DA_ROTA[nome] || "home");
  document.querySelectorAll("#abas a").forEach(function(a){
    if (a.dataset.aba === aba) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  const semAbas = nome === "lote";
  document.getElementById("abas").hidden = semAbas;
  document.body.classList.toggle("sem-abas", semAbas);
  moveIndicador();
}

// Pílula da aba ativa: um elemento só, que desliza (e muda de largura) até a aba escolhida.
function moveIndicador(){
  const nav = document.getElementById("abas"); if (!nav || nav.hidden) return;
  let ind = nav.querySelector(".abas-indicador");
  if (!ind){ ind = document.createElement("span"); ind.className = "abas-indicador"; ind.setAttribute("aria-hidden", "true"); nav.prepend(ind); }
  const ativo = nav.querySelector('a[aria-current="page"]');
  if (!ativo){ ind.style.opacity = "0"; return; }
  const primeira = !ind.dataset.pronto;
  if (primeira) ind.style.transition = "none";
  ind.style.opacity = "1";
  // A pílula passa um pouco da aba (6px de cada lado, sem sair da barra), para o nome nunca encostar na borda.
  const folga = 6, l = Math.max(4, ativo.offsetLeft - folga), r = Math.min(nav.clientWidth - 4, ativo.offsetLeft + ativo.offsetWidth + folga);
  ind.style.width = (r - l) + "px";
  ind.style.transform = "translateX(" + l + "px)";
  if (primeira){ ind.offsetWidth; ind.style.transition = ""; ind.dataset.pronto = "1"; }
}
window.addEventListener("resize", moveIndicador);

// Folhas que sobem (padrão iOS): puxador, botão redondo ✕ no canto e arrastar para baixo para fechar.
// Fechar = tocar no véu da folha (cada folha já fecha por ele, do jeito dela).
function veuDa(f){ let v = f.previousElementSibling; while (v && !v.classList.contains("ui-veu")) v = v.previousElementSibling;
  return v || Array.prototype.filter.call(document.querySelectorAll(".ui-veu"), function(x){ return !x.hidden; }).pop(); }
function fechaFolha(f){ const v = veuDa(f); if (v) v.click(); }
function preparaFolha(f){
  if (f.dataset.folhaPronta) return; f.dataset.folhaPronta = "1";
  if (!f.querySelector(".puxador")) f.insertAdjacentHTML("afterbegin", '<span class="puxador"></span>');
  // ✕ só onde não há uma escolha de cancelar (confirmações e Salvar já têm "Cancelar").
  if (!f.querySelector('[data-r="0"], #cancelaSalvar, #cancela')){
    const x = document.createElement("button"); x.type = "button"; x.className = "ui-redondo folha-fechar"; x.setAttribute("aria-label", "Fechar");
    x.innerHTML = icone("fechar"); x.addEventListener("click", function(){ fechaFolha(f); }); f.appendChild(x);
  }
  let y0 = null, dy = 0;
  f.addEventListener("touchstart", function(ev){ if (f.scrollTop > 0 && !ev.target.closest(".puxador")) { y0 = null; return; } y0 = ev.touches[0].clientY; dy = 0; f.style.transition = "none"; }, {passive:true});
  f.addEventListener("touchmove", function(ev){ if (y0 == null) return; dy = Math.max(0, ev.touches[0].clientY - y0); f.style.transform = "translateY(" + dy + "px)"; }, {passive:true});
  f.addEventListener("touchend", function(){ if (y0 == null) return; y0 = null; f.style.transition = "transform .25s ease";
    if (dy > 110){ f.style.transform = "translateY(100%)"; setTimeout(function(){ fechaFolha(f); f.style.transform = ""; }, 200); } else f.style.transform = ""; });
}
// Seletores (filtros e opções): a pílula do escolhido desliza até a nova opção, como na barra de abas.
// Guarda a última posição de cada seletor (por tela + ordem) para animar mesmo quando a tela é redesenhada.
const posSeletor = {};
function chaveSeletor(c){ const todos = Array.prototype.slice.call(document.querySelectorAll(".ui-filtros, .ui-opcoes")); return location.hash.split("/")[1] + ":" + todos.indexOf(c) + ":" + c.children.length; }
function atualizaSeletor(c){
  const ativo = c.querySelector(':scope > [aria-pressed="true"]');
  let ind = c.querySelector(":scope > .seletor-ind");
  if (!ativo){ if (ind) ind.style.opacity = "0"; return; }
  if (!ind){
    ind = document.createElement("span"); ind.className = "seletor-ind"; ind.setAttribute("aria-hidden", "true");
    c.prepend(ind); c.classList.add("tem-ind");
    const ant = posSeletor[chaveSeletor(c)];
    ind.style.transition = "none";
    if (ant){ ind.style.width = ant.w + "px"; ind.style.height = ant.h + "px"; ind.style.transform = "translate(" + ant.x + "px," + ant.y + "px)"; }
    ind.offsetWidth; ind.style.transition = "";
  }
  const pos = {x:ativo.offsetLeft, y:ativo.offsetTop, w:ativo.offsetWidth, h:ativo.offsetHeight};
  ind.style.opacity = "1"; ind.style.width = pos.w + "px"; ind.style.height = pos.h + "px";
  ind.style.transform = "translate(" + pos.x + "px," + pos.y + "px)";
  posSeletor[chaveSeletor(c)] = pos;
}
function varreSeletores(){ document.querySelectorAll(".ui-filtros, .ui-opcoes").forEach(function(c){ if (c.offsetParent) atualizaSeletor(c); }); }
new MutationObserver(function(muts){
  document.querySelectorAll(".ui-folha").forEach(preparaFolha);
  if (muts.some(function(m){ return m.type === "childList" || (m.type === "attributes" && m.attributeName === "aria-pressed"); })) requestAnimationFrame(varreSeletores);
}).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:["aria-pressed"]});

let timerToast = null;
export function toast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg; el.hidden = false;
  clearTimeout(timerToast);
  timerToast = setTimeout(function(){ el.hidden = true; }, 3200);
}

carrega();
// Biblioteca de fotos: uma cópia de cada foto; capas apontam para ela ("foto:<id>").
(function(){
  const db = dados();
  if (!Array.isArray(db.fotos)) db.fotos = [];
  const guarda = function(dado){ const ja = db.fotos.find(function(x){ return x.dado === dado; }); if (ja) return ja.id;
    const x = {id:novoId(), dado:dado}; db.fotos.push(x); return x.id; };
  defineArmazemFotos({pega:function(id){ const x = db.fotos.find(function(f){ return f.id === id; }); return x && x.dado; },
    lista:function(){ return db.fotos.slice().reverse(); }, guarda:guarda});
  // Fotos antigas guardadas dentro de cada item passam para a biblioteca (iguais viram uma só).
  let mudou = false;
  const migra = function(obj, k){ if (obj && typeof obj[k] === "string" && obj[k].indexOf("data:") === 0){ obj[k] = "foto:" + guarda(obj[k]); mudou = true; } };
  ["receitas", "ideias", "ingredientes"].forEach(function(c){ (db[c] || []).forEach(function(x){ migra(x, "capa"); }); });
  ["home", "biblioteca"].forEach(function(c){ if (db[c]) Object.keys(db[c]).forEach(function(k){ migra(db[c], k); }); });
  if (mudou) salva();
})();
iniciaSync();
window.addEventListener("hashchange", rota);
rota();

if ("serviceWorker" in navigator && location.protocol !== "file:"){
  navigator.serviceWorker.register("sw.js").catch(function(){});
}
