// Navegação do hub: cada área é uma "tela" escolhida pelo endereço (#/calculadora etc.).
import { carrega } from "./dados.js";
import * as inicio from "./telas/inicio.js";
import * as calculadora from "./telas/calculadora.js";
import * as ingredientes from "./telas/ingredientes.js";
import * as embreve from "./telas/embreve.js";

const TELAS = {
  "": inicio,
  "calculadora": calculadora,
  "ingredientes": ingredientes,
  "ideias": embreve, "testes": embreve, "receitas": embreve, "estudo": embreve
};

const elTela = document.getElementById("tela");
const elTitulo = document.getElementById("titulo");
const elVoltar = document.getElementById("voltar");
let limpa = null;

function rota(){
  const partes = location.hash.replace(/^#\/?/, "").split("/");
  const nome = partes[0] || "";
  const tela = TELAS[nome] || inicio;
  if (typeof limpa === "function") limpa();
  elTela.innerHTML = "";
  window.scrollTo(0, 0);
  const res = tela.render(elTela, {area:nome, args:partes.slice(1)}) || {};
  elTitulo.textContent = res.titulo || "Ice Cream Lab";
  document.title = res.titulo ? res.titulo + " · Ice Cream Lab" : "Ice Cream Lab";
  elVoltar.hidden = !nome;
  elVoltar.href = res.voltar || "#/";
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
window.addEventListener("hashchange", rota);
rota();

if ("serviceWorker" in navigator && location.protocol !== "file:"){
  navigator.serviceWorker.register("sw.js").catch(function(){});
}
