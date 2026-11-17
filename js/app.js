// Navegação do hub: cada área é uma "tela" escolhida pelo endereço (#/calculadora etc.).
import { carrega } from "./dados.js?v=20261117042849";
import { iniciaSync } from "./sync.js?v=20261117042849";
import * as inicio from "./telas/inicio.js?v=20261117042849";
import * as calculadora from "./telas/calculadora.js?v=20261117042849";
import * as ingredientes from "./telas/ingredientes.js?v=20261117042849";
import * as embreve from "./telas/embreve.js?v=20261117042849";
import * as receitas from "./telas/receitas.js?v=20261117042849";
import * as receita from "./telas/receita.js?v=20261117042849";
import * as testes from "./telas/testes.js?v=20261117042849";
import * as loteTela from "./telas/lote.js?v=20261117042849";
import * as estudo from "./telas/estudo.js?v=20261117042849";
import * as ideias from "./telas/ideias.js?v=20261117042849";
import * as ajustes from "./telas/ajustes.js?v=20261117042849";

const TELAS = {
  "": inicio,
  "calculadora": calculadora,
  "ingredientes": ingredientes,
  "receitas": receitas, "receita": receita,
  "testes": testes, "lote": loteTela,
  "ideias": ideias, "estudo": estudo, "ajustes": ajustes
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
}

let timerToast = null;
export function toast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg; el.hidden = false;
  clearTimeout(timerToast);
  timerToast = setTimeout(function(){ el.hidden = true; }, 3200);
}

carrega();
iniciaSync();
window.addEventListener("hashchange", rota);
rota();

if ("serviceWorker" in navigator && location.protocol !== "file:"){
  navigator.serviceWorker.register("sw.js").catch(function(){});
}
