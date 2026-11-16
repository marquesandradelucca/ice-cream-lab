// Ingredientes: lista editável. O que é editado aqui aparece no seletor da calculadora.
import { dados, salva, ingrediente, ingredienteUsado, novoId } from "../dados.js";
import { TIPOS_ACUCAR } from "../ingredientes-base.js";
import { n } from "../calculo.js";

function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

function totalAcucar(i){
  return Object.keys(i.ac || {}).reduce(function(s, k){ return s + (Number(i.ac[k]) || 0); }, 0);
}
function agua(i){
  return 100 - ((i.gord || 0) + (i.slng || 0) + (i.soro || 0) + totalAcucar(i) + (i.outros || 0));
}
function resumo(i){
  const p = [];
  if (i.gord) p.push("gord. " + n(i.gord, 1) + "%");
  if (i.slng) p.push("SLNG " + n(i.slng, 1) + "%");
  if (i.soro) p.push("soro " + n(i.soro, 1) + "%");
  const ac = totalAcucar(i); if (ac) p.push("açúc. " + n(ac, 1) + "%");
  if (i.outros) p.push("outros " + n(i.outros, 1) + "%");
  return p.length ? p.join(" · ") : "água";
}

export function render(el, rota){
  const id = rota.args[0];
  if (id) return editor(el, decodeURIComponent(id));
  return lista(el);
}

function lista(el){
  const db = dados();
  const comuns = db.ingredientes.filter(function(i){ return !i.estab; });
  const est = db.ingredientes.filter(function(i){ return i.estab; });
  function item(i){
    return '<a class="item-lista" href="#/ingredientes/' + encodeURIComponent(i.id) + '">' +
      '<span class="item-nome">' + esc(i.nome) + '</span><span class="item-desc muted">' + resumo(i) + '</span></a>';
  }
  el.innerHTML =
    '<a class="botao" href="#/ingredientes/novo">+ novo ingrediente</a>' +
    '<p class="muted pequeno">Toque num ingrediente para corrigir a composição. A calculadora usa esta lista.</p>' +
    '<section class="lista">' + comuns.map(item).join("") + '</section>' +
    '<h2 class="subtitulo">Estabilizantes</h2><section class="lista">' + est.map(item).join("") + '</section>';
  return {titulo:"Ingredientes"};
}

function editor(el, id){
  const db = dados();
  let ing = id === "novo" ? null : ingrediente(id);
  if (id !== "novo" && !ing){
    el.innerHTML = '<p class="muted">Ingrediente não encontrado.</p><a class="botao" href="#/ingredientes">Voltar à lista</a>';
    return {titulo:"Ingrediente", voltar:"#/ingredientes"};
  }
  if (!ing){
    // O novo ingrediente entra na lista no primeiro toque, e já fica salvo.
    ing = {id:novoId(), nome:"", gord:0, slng:0, ac:{}, outros:0};
    db.ingredientes.push(ing); salva();
    history.replaceState(null, "", "#/ingredientes/" + encodeURIComponent(ing.id));
  }
  ing.ac = ing.ac || {};

  function campo(chave, rotulo, valor){
    return '<label class="campo"><span>' + rotulo + '</span>' +
      '<input type="number" inputmode="decimal" min="0" max="100" step="0.1" data-k="' + chave + '" value="' + (valor || "") + '" placeholder="0"></label>';
  }

  el.innerHTML =
    '<section class="cartao form">' +
      '<label class="campo largo"><span>Nome</span><input type="text" class="campo-texto" data-k="nome" maxlength="60" value="' + esc(ing.nome) + '" placeholder="Ex.: Leite Piracanjuba integral"></label>' +
      '<label class="campo largo"><span>Nome completo (opcional)</span><input type="text" class="campo-texto" data-k="longo" maxlength="90" value="' + esc(ing.longo) + '"></label>' +
      '<p class="muted pequeno">Valores em gramas por 100 g (como no rótulo). O que faltar para 100 é água.</p>' +
      '<div class="campos">' +
        campo("gord", "Gordura", ing.gord) + campo("slng", "SLNG (sólidos lácteos)", ing.slng) +
        campo("soro", "Sólidos de soro", ing.soro) + campo("outros", "Outros sólidos", ing.outros) +
      '</div>' +
      '<h3>Açúcares</h3><p class="muted pequeno">Só a parte que é açúcar, por tipo. A lactose do leite entra sozinha pelo SLNG e pelo soro.</p>' +
      '<div class="campos">' + TIPOS_ACUCAR.map(function(t){ return campo("ac." + t[0], t[1], ing.ac[t[0]]); }).join("") + '</div>' +
      '<p class="agua" id="agua"></p>' +
      '<label class="check"><input type="checkbox" data-k="estab"' + (ing.estab ? " checked" : "") + '> É estabilizante</label>' +
      '<label class="check" id="cxSoma"' + (ing.estab ? "" : " hidden") + '><input type="checkbox" data-k="contaTotal"' + (ing.contaTotal === false ? "" : " checked") + '> Entra na soma de estabilizantes</label>' +
      '<label class="campo largo"><span>Nota (aparece na calculadora)</span><textarea class="campo-texto" data-k="nota" rows="3">' + esc(ing.nota) + '</textarea></label>' +
      '<p class="muted pequeno">“Outros” são sólidos que não são gordura, SLNG nem açúcar: proteínas, fibras, cacau etc.</p>' +
    '</section>' +
    '<div class="acoes-linha"><a class="botao" href="#/ingredientes">Pronto</a>' +
    '<button type="button" class="botao perigo" id="excluir">Excluir</button></div>' +
    '<p class="muted pequeno">As mudanças são salvas sozinhas.</p>';

  function mostraAgua(){
    const a = agua(ing), elA = el.querySelector("#agua");
    elA.textContent = "Água: " + n(Math.max(0, a), 1) + "%" + (a < -0.5 ? " — a soma passou de 100" : "");
    elA.classList.toggle("erro", a < -0.5);
  }
  mostraAgua();

  el.querySelectorAll("[data-k]").forEach(function(c){
    c.addEventListener(c.type === "checkbox" ? "change" : "input", function(){
      const k = c.dataset.k;
      if (c.type === "checkbox"){
        if (k === "contaTotal"){ if (c.checked) delete ing.contaTotal; else ing.contaTotal = false; }
        else { if (c.checked) ing.estab = true; else delete ing.estab; el.querySelector("#cxSoma").hidden = !c.checked; }
      } else if (k.indexOf("ac.") === 0){
        const t = k.slice(3), v = Number(c.value) || 0;
        if (v) ing.ac[t] = v; else delete ing.ac[t];
      } else if (c.type === "number"){
        const v = Number(c.value) || 0;
        if (v) ing[k] = v; else delete ing[k];
      } else {
        const v = c.value.trim() ? c.value : "";
        if (v) ing[k] = v; else delete ing[k];
      }
      if (!ing.nome) ing.nome = "";
      mostraAgua(); salva();
    });
  });

  el.querySelector("#excluir").addEventListener("click", function(){
    const aviso = ingredienteUsado(ing.id) ?
      "Este ingrediente está no rascunho da calculadora. Excluir mesmo assim? A linha fica marcada como “ingrediente removido”." :
      "Excluir “" + (ing.nome || "sem nome") + "”?";
    if (!confirm(aviso)) return;
    db.ingredientes = db.ingredientes.filter(function(x){ return x !== ing; });
    salva(); location.hash = "#/ingredientes";
  });

  // Ao sair, um ingrediente novo deixado sem nome ganha um nome provisório.
  return {titulo:id === "novo" ? "Novo ingrediente" : "Ingrediente", voltar:"#/ingredientes",
    limpa:function(){ if (!ing.nome.trim()){ ing.nome = "Ingrediente sem nome"; salva(); } }};
}
