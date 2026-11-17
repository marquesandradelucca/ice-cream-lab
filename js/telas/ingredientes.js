// Ingredientes: lista editável. O que é editado aqui aparece no seletor da calculadora.
import { dados, salva, ingrediente, ingredienteUsado, novoId } from "../dados.js?v=20261116211245";
import { confirma } from "../ui.js?v=20261116211245";
import { TIPOS_ACUCAR } from "../ingredientes-base.js?v=20261116211245";
import { n } from "../calculo.js?v=20261116211245";

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
    '<a class="botao largo" href="#/ingredientes/novo">+ novo ingrediente</a>' +
    '<p class="dica-lista">Toque num ingrediente para ver ou corrigir a composição. A calculadora usa esta lista.</p>' +
    '<section class="lista-cards">' + comuns.map(item).join("") + '</section>' +
    '<h2 class="subtitulo">Estabilizantes</h2><section class="lista-cards">' + est.map(item).join("") + '</section>';
  return {titulo:"Ingredientes"};
}

// Página de um ingrediente: abre só para ver. "Editar" libera os campos numa cópia;
// nada muda de verdade até tocar em "Salvar" ("Cancelar" descarta).
function editor(el, id){
  const db = dados();
  const novo = id === "novo";
  const ing = novo ? null : ingrediente(id);
  if (!novo && !ing){
    el.innerHTML = '<p class="muted">Ingrediente não encontrado.</p><a class="botao" href="#/ingredientes">Voltar à lista</a>';
    return {titulo:"Ingrediente", voltar:"#/ingredientes", voltarRotulo:"Ingredientes"};
  }
  if (novo) edita({id:novoId(), nome:"", ac:{}});
  else mostra();

  function linha(rotulo, valor){
    return '<div class="campo"><span>' + rotulo + '</span><span class="valor-campo num">' + valor + '</span></div>';
  }

  function mostra(){
    const ac = ing.ac || {};
    const acucares = TIPOS_ACUCAR.filter(function(t){ return ac[t[0]]; });
    el.innerHTML =
      '<div class="cabeca-receita"><h2 class="titulo-receita">' + esc(ing.nome || "Ingrediente sem nome") + '</h2>' +
      (ing.longo ? '<span class="muted pequeno">' + esc(ing.longo) + '</span>' : '') + '</div>' +
      '<section class="cartao form">' +
        '<p class="muted pequeno">Gramas por 100 g.</p>' +
        '<div class="campos">' +
          linha("Gordura", n(ing.gord || 0, 1) + " g") + linha("SLNG (sólidos lácteos)", n(ing.slng || 0, 1) + " g") +
          linha("Sólidos de soro", n(ing.soro || 0, 1) + " g") + linha("Outros sólidos", n(ing.outros || 0, 1) + " g") +
          (acucares.length ? acucares.map(function(t){ return linha("Açúcar: " + t[1].toLowerCase(), n(ac[t[0]], 1) + " g"); }).join("")
            : linha("Açúcares", "0 g")) +
          linha("Água", n(Math.max(0, agua(ing)), 1) + " g") +
        '</div>' +
        (ing.estab ? '<p class="pequeno">Estabilizante' + (ing.contaTotal === false ? ' (fora da soma de estabilizantes)' : '') + '.</p>' : '') +
        (ing.nota ? '<p class="muted pequeno">' + esc(ing.nota) + '</p>' : '') +
      '</section>' +
      '<button type="button" class="botao largo" id="editar">Editar</button>';
    el.querySelector("#editar").addEventListener("click", function(){ edita(JSON.parse(JSON.stringify(ing))); });
  }

  function edita(rasc){
    rasc.ac = rasc.ac || {};
    function campo(chave, rotulo, valor){
      return '<label class="campo"><span>' + rotulo + '</span>' +
        '<input type="number" inputmode="decimal" min="0" max="100" step="0.1" data-k="' + chave + '" value="' + (valor || "") + '" placeholder="0"></label>';
    }
    el.innerHTML =
      '<div class="cabeca-receita"><h2 class="titulo-receita">' + (novo ? 'Novo ingrediente' : 'Editar ingrediente') + '</h2></div>' +
      '<section class="cartao form">' +
        '<label class="campo largo"><span>Nome</span><input type="text" class="campo-texto" data-k="nome" maxlength="60" value="' + esc(rasc.nome) + '" placeholder="Ex.: Leite Piracanjuba integral"></label>' +
        '<label class="campo largo"><span>Nome completo (opcional)</span><input type="text" class="campo-texto" data-k="longo" maxlength="90" value="' + esc(rasc.longo) + '"></label>' +
        '<p class="muted pequeno">Valores em gramas por 100 g (como no rótulo). O que faltar para 100 é água.</p>' +
        '<div class="campos">' +
          campo("gord", "Gordura", rasc.gord) + campo("slng", "SLNG (sólidos lácteos)", rasc.slng) +
          campo("soro", "Sólidos de soro", rasc.soro) + campo("outros", "Outros sólidos", rasc.outros) +
        '</div>' +
        '<p class="muted pequeno">“Outros sólidos” é tudo que não é gordura, SLNG nem açúcar: proteínas, fibras, cacau etc.</p>' +
        '<h3>Açúcares</h3><p class="muted pequeno">Só a parte que é açúcar, por tipo. A lactose do leite entra sozinha pelo SLNG e pelo soro.</p>' +
        '<div class="campos">' + TIPOS_ACUCAR.map(function(t){ return campo("ac." + t[0], t[1], rasc.ac[t[0]]); }).join("") + '</div>' +
        '<p class="agua" id="agua"></p>' +
        '<label class="check"><input type="checkbox" data-k="estab"' + (rasc.estab ? " checked" : "") + '> É estabilizante</label>' +
        '<label class="check" id="cxSoma"' + (rasc.estab ? "" : " hidden") + '><input type="checkbox" data-k="contaTotal"' + (rasc.contaTotal === false ? "" : " checked") + '> Entra na soma de estabilizantes</label>' +
        '<label class="campo largo"><span>Nota (aparece na calculadora)</span><textarea class="campo-texto" data-k="nota" rows="3">' + esc(rasc.nota) + '</textarea></label>' +
      '</section>' +
      '<div class="acoes-ing">' +
        '<button type="button" class="pilula-cinza" id="cancelar">Cancelar</button>' +
        '<button type="button" class="pilula-preta" id="salvarIng">Salvar</button>' +
      '</div>' +
      (novo ? '' : '<div class="acoes-linha"><button type="button" class="botao perigo" id="excluir">Excluir ingrediente</button></div>');

    function mostraAgua(){
      const a = agua(rasc), elA = el.querySelector("#agua");
      elA.textContent = "Água: " + n(Math.max(0, a), 1) + "%" + (a < -0.5 ? " — a soma passou de 100" : "");
      elA.classList.toggle("erro", a < -0.5);
    }
    mostraAgua();

    el.querySelectorAll("[data-k]").forEach(function(c){
      c.addEventListener(c.type === "checkbox" ? "change" : "input", function(){
        const k = c.dataset.k;
        if (c.type === "checkbox"){
          if (k === "contaTotal"){ if (c.checked) delete rasc.contaTotal; else rasc.contaTotal = false; }
          else { if (c.checked) rasc.estab = true; else delete rasc.estab; el.querySelector("#cxSoma").hidden = !c.checked; }
        } else if (k.indexOf("ac.") === 0){
          const t = k.slice(3), v = Number(c.value) || 0;
          if (v) rasc.ac[t] = v; else delete rasc.ac[t];
        } else if (c.type === "number"){
          const v = Number(c.value) || 0;
          if (v) rasc[k] = v; else delete rasc[k];
        } else {
          const v = c.value.trim() ? c.value.trim() : "";
          if (v) rasc[k] = v; else delete rasc[k];
        }
        mostraAgua();
      });
    });

    el.querySelector("#cancelar").addEventListener("click", function(){
      if (novo) location.hash = "#/ingredientes"; else mostra();
    });
    el.querySelector("#salvarIng").addEventListener("click", function(){
      if (!rasc.nome){ el.querySelector('[data-k="nome"]').focus(); return; }
      if (agua(rasc) < -0.5){ el.querySelector("#agua").scrollIntoView({block:"center"}); return; }
      delete rasc.prot; delete rasc.fibra;
      if (novo){ db.ingredientes.push(rasc); salva(); location.hash = "#/ingredientes/" + encodeURIComponent(rasc.id); return; }
      Object.keys(ing).forEach(function(k){ delete ing[k]; });
      Object.assign(ing, rasc);
      salva(); mostra();
    });
    const exc = el.querySelector("#excluir");
    if (exc) exc.addEventListener("click", async function(){
      const aviso = ingredienteUsado(ing.id) ?
        "Este ingrediente está no rascunho da calculadora. Excluir mesmo assim? A linha fica marcada como “ingrediente removido”." :
        "Excluir “" + (ing.nome || "sem nome") + "”?";
      if (!(await confirma(aviso, "Excluir", true))) return;
      db.ingredientes = db.ingredientes.filter(function(x){ return x !== ing; });
      salva(); location.hash = "#/ingredientes";
    });
  }

  return {titulo:novo ? "Novo ingrediente" : "Ingrediente", voltar:"#/ingredientes", voltarRotulo:"Ingredientes"};
}
