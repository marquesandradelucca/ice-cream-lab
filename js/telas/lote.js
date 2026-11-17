// Modo lote, em dois momentos:
//   1. Preparar (na bancada): pesar, com as sugestões de preparo à mão. Termina em "Pronto, avaliar depois".
//   2. Avaliar (horas depois, após maturar e endurecer): textura, dureza, doçura e nota, por toques.
// Situações do lote: "em andamento" (preparando) → "aguardando" (falta avaliar) → "concluido".
// Tudo é salvo a cada toque; se o app fechar, o lote volta onde parou. Tela acesa enquanto aberto.
import { dados, salva, lote, receita, versao, ingrediente, excluiLote } from "../dados.js?v=20261116211245";
import { n } from "../calculo.js?v=20261116211245";
import { confirma } from "../ui.js?v=20261116211245";
import { atualizaVoltar } from "../app.js?v=20261116211245";

function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function hora(iso){ try { return new Date(iso).toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"}); } catch (e) { return ""; } }
export function dataCurta(iso){ try { return new Date(iso).toLocaleDateString("pt-BR", {day:"2-digit", month:"short"}); } catch (e) { return ""; } }
function gramas(g){ return g < 10 ? n(g, 1) : n(Math.round(g), 0); }

const PASSOS = [
  {id:"preparar", nome:"Preparar"},
  {id:"avaliar", nome:"Avaliar"}
];

// Sugestões conferidas com o Estudo (tema Processo, trazido do Notion).
const SUGESTOES = [
  ["Pasteurizar", "65 °C por 30 min, 72 °C por 5 min ou 85 °C por 5 s."],
  ["Maturar", "Na geladeira: mínimo 1 h, ideal 12 h, nunca mais de 72 h."],
  ["Bater", "Até o creme sair da máquina entre −5 e −9 °C, conforme o equipamento."],
  ["Endurecer", "No freezer, antes de servir e avaliar."]
];

// Textura: "Lisa" é o ideal; os defeitos podem ser marcados juntos, e cada um aponta uma causa.
const TEXTURA = [["lisa", "Lisa"], ["cristais", "Cristais de gelo"], ["arenosa", "Arenosa"], ["gomosa", "Gomosa"]];
const AVALIACAO = [
  {k:"dureza", nome:"Dureza", op:[["mole", "Mole"], ["ideal", "Ideal"], ["dura", "Dura"]]},
  {k:"docura", nome:"Doçura", op:[["pouco", "Pouco"], ["ideal", "Ideal"], ["muito", "Muito"]]}
];
const FRASES = {
  textura:{cristais:"cristais de gelo", arenosa:"textura arenosa", gomosa:"textura gomosa"},
  dureza:{mole:"ficou mole", dura:"ficou dura"},
  docura:{pouco:"pouco doce", muito:"doce demais"}
};

export function aberto(l){ return l.status !== "concluido"; }

function texturas(a){ return Array.isArray(a.textura) ? a.textura : []; }
function frases(l){
  const a = l.avaliacao || {}, partes = [];
  texturas(a).forEach(function(t){ if (FRASES.textura[t]) partes.push(FRASES.textura[t]); });
  ["dureza", "docura"].forEach(function(k){ if (FRASES[k][a[k]]) partes.push(FRASES[k][a[k]]); });
  return partes;
}

// Nota pronta para a próxima versão, a partir do que foi marcado. Só descreve; não muda quantidades.
export function notaDoLote(l){
  const partes = frases(l), a = l.avaliacao || {};
  if (a.nota) partes.push("nota " + a.nota + "/5");
  return partes.length ? "Lote de " + dataCurta(l.inicio) + ": " + partes.join("; ") + "." : "";
}

export function resumoLote(l){
  if (l.status === "em andamento") return "preparando";
  if (l.status === "aguardando") return "aguardando avaliação";
  const a = l.avaliacao || {}, partes = [];
  if (a.nota) partes.push(a.nota + "/5");
  return partes.concat(frases(l)).join(" · ") || "concluído";
}

// Ingredientes pesados diferente da receita (meio grama de tolerância).
export function diferencasPesagem(l, nomeIng){
  return l.pesado.filter(function(x){
    return x.real != null && Math.abs(x.real - x.previsto * l.escala) >= 0.5;
  }).map(function(x){ return nomeIng(x.id) + " " + gramas(x.previsto * l.escala) + " → " + gramas(x.real) + " g"; });
}

export function render(el, rota){
  const db = dados();
  const l = lote(decodeURIComponent(rota.args[0] || ""));
  if (!l){
    el.innerHTML = '<p class="muted">Lote não encontrado.</p>';
    return {titulo:"Lote", voltar:"#/testes", voltarRotulo:"Testes"};
  }
  // Lotes do formato antigo (seis passos): quem já passou do preparo vai para Avaliar.
  if (l.passo > PASSOS.length - 1) l.passo = PASSOS.length - 1;
  if (l.status === "em andamento" && l.passo === 1) l.status = "aguardando";
  if (rota.args[1] === "avaliar") l.passo = 1;
  const r = receita(l.receitaId), v = versao(l.versaoId);
  const nomeIng = function(id){ const i = (v && v.snapshot && v.snapshot[id]) || ingrediente(id); return i ? i.nome : "(ingrediente removido)"; };
  let trava = null;

  async function pedeTela(){
    try { if ("wakeLock" in navigator && document.visibilityState === "visible") trava = await navigator.wakeLock.request("screen"); } catch (e) {}
  }
  function aoVoltar(){ if (document.visibilityState === "visible") pedeTela(); }
  pedeTela();
  document.addEventListener("visibilitychange", aoVoltar);

  function grava(){ salva(); }
  function vai(i){ l.passo = i; grava(); desenha(); window.scrollTo(0, 0); }

  function desenha(){
    const p = PASSOS[l.passo];
    const situacao = l.status === "concluido" ? " · concluído" : l.status === "aguardando" ? " · aguardando avaliação" : "";
    el.innerHTML =
      '<div class="cabeca-receita"><h2 class="titulo-receita">' + esc(r ? r.nome : "Receita") + '</h2>' +
        '<span class="muted pequeno">' + (v ? 'v' + v.numero + ' · ' : '') + 'lote de ' + dataCurta(l.inicio) + situacao + '</span></div>' +
      '<div class="passos" role="tablist" aria-label="Momentos do lote">' + PASSOS.map(function(x, i){
        return '<button type="button" class="passo-ind' + (i === l.passo ? ' atual' : i < l.passo ? ' feito' : '') + '" data-i="' + i + '" aria-label="' + x.nome + '"></button>';
      }).join("") + '</div>' +
      '<p class="passo-titulo"><span class="muted pequeno">' + (l.passo + 1) + ' de ' + PASSOS.length + '</span><span>' + p.nome + '</span></p>' +
      '<div id="conteudo"></div>';
    el.querySelectorAll(".passo-ind").forEach(function(b){ b.addEventListener("click", function(){ vai(Number(b.dataset.i)); }); });
    ({preparar:preparar, avaliar:avaliar})[p.id](el.querySelector("#conteudo"));
  }

  // ----- 1. Preparar: pesagem + sugestões recolhíveis -----
  function preparar(alvo){
    const base = l.pesado.reduce(function(s, x){ return s + x.previsto; }, 0) || 1;
    const total = base * l.escala;
    const feitos = l.pesado.filter(function(x){ return x.ok; }).length;
    const temPreparo = !!(r && r.preparo);
    alvo.innerHTML =
      '<section class="cartao" id="pesagem">' +
        '<div class="linha-total"><span class="rotulo-mistura">Tamanho do lote</span>' +
          '<div class="qtd"><button type="button" class="passo" data-dir="-1" aria-label="Diminuir o lote">−</button>' +
          '<label class="campo-g"><input type="number" id="loteTotal" inputmode="decimal" min="1" step="50" aria-label="Tamanho do lote em gramas"><span aria-hidden="true">g</span></label>' +
          '<button type="button" class="passo" data-dir="1" aria-label="Aumentar o lote">+</button></div></div>' +
        '<p class="muted pequeno contagem">' + feitos + ' de ' + l.pesado.length + ' pesados · toque no círculo ao pesar</p>' +
        l.pesado.map(function(x, i){
          const prev = x.previsto * l.escala;
          return '<div class="linha-peso' + (x.ok ? ' ok' : '') + '">' +
            '<button type="button" class="marcar" data-i="' + i + '" aria-pressed="' + x.ok + '" aria-label="Marcar ' + esc(nomeIng(x.id)) + ' como pesado"></button>' +
            '<span class="nome-peso">' + esc(nomeIng(x.id)) + '<span class="muted pequeno"> · receita ' + gramas(prev) + ' g</span></span>' +
            '<label class="campo-g"><input type="number" inputmode="decimal" min="0" step="0.1" data-i="' + i + '" value="' + (x.real != null ? x.real : gramas(prev).replace(",", ".")) + '" aria-label="Peso real de ' + esc(nomeIng(x.id)) + '"><span aria-hidden="true">g</span></label>' +
          '</div>';
        }).join("") +
      '</section>' +
      (temPreparo ? '<details class="cartao recolhivel" open><summary>Seu modo de preparo<span class="chevron" aria-hidden="true"></span></summary>' +
        '<div class="preparo">' + esc(r.preparo).replace(/\n/g, "<br>") + '</div></details>' : '') +
      '<details class="cartao recolhivel"' + (temPreparo ? '' : ' open') + '><summary>Sugestões de preparo<span class="chevron" aria-hidden="true"></span></summary>' +
        '<div class="lista-sugestoes">' + SUGESTOES.map(function(s){
          return '<div class="sugestao"><span class="sugestao-nome">' + s[0] + '</span><span class="muted">' + s[1] + '</span></div>';
        }).join("") + '<a class="pilula-cinza largo-pilula ver-estudo" href="#/estudo/processo">Ver o processo no Estudo</a></div></details>' +
      '<div class="acoes-final">' +
        (l.status === "em andamento" ?
          '<button type="button" class="botao largo" id="avaliarDepois">Pronto, avaliar depois</button>' +
          '<button type="button" class="pilula-cinza largo-pilula" id="avaliarAgora">Avaliar agora</button>' :
          '<button type="button" class="pilula-preta largo-pilula" id="avaliarAgora">Ir para a avaliação</button>') +
      '</div>' +
      '<div class="acoes-linha"><button type="button" class="botao perigo" id="excluirLote">Excluir lote</button></div>';

    const elTotal = alvo.querySelector("#loteTotal");
    elTotal.value = Math.round(total);
    function escala(novo){ if (novo > 0){ l.escala = novo / base; l.pesado.forEach(function(x){ if (!x.ok) x.real = null; }); grava(); desenha(); } }
    elTotal.addEventListener("change", function(){ escala(Number(elTotal.value)); });
    alvo.querySelectorAll(".linha-total .passo").forEach(function(b){
      b.addEventListener("click", function(){ escala(Math.max(50, Math.round((total + Number(b.dataset.dir) * 50) / 50) * 50)); });
    });
    alvo.querySelectorAll(".marcar").forEach(function(b){
      b.addEventListener("click", function(){
        const x = l.pesado[Number(b.dataset.i)];
        x.ok = !x.ok;
        if (x.ok && x.real == null) x.real = Math.round(x.previsto * l.escala * 10) / 10;
        grava(); desenha();
      });
    });
    alvo.querySelectorAll(".linha-peso input").forEach(function(inp){
      inp.addEventListener("input", function(){
        const x = l.pesado[Number(inp.dataset.i)];
        x.real = inp.value === "" ? null : Number(inp.value);
        grava();
      });
    });
    const depois = alvo.querySelector("#avaliarDepois");
    if (depois) depois.addEventListener("click", function(){ l.status = "aguardando"; grava(); location.hash = "#/testes"; });
    alvo.querySelector("#avaliarAgora").addEventListener("click", function(){ if (l.status === "em andamento") l.status = "aguardando"; vai(1); });
    alvo.querySelector("#excluirLote").addEventListener("click", excluir);
  }

  async function excluir(){
    if (!(await confirma("Excluir este lote e tudo o que foi registrado nele?", "Excluir", true))) return;
    excluiLote(l.id); grava(); location.hash = "#/testes";
  }

  // ----- 2. Avaliar -----
  function avaliar(alvo){
    const a = l.avaliacao;
    if (!Array.isArray(a.textura)) a.textura = [];
    // Observações e "próxima versão" são um campo só: começa com o resumo do que foi marcado
    // e vira a nota da próxima versão. Textos do formato antigo são juntados aqui.
    if (l.obs){ l.proximo = [l.proximo, l.obs].filter(Boolean).join("\n"); l.proximoEditado = true; delete l.obs; }
    if (!l.proximoEditado) l.proximo = notaDoLote(l);
    const travado = l.status === "concluido" && !l.editando;
    const dis = travado ? " disabled" : "";
    const difs = diferencasPesagem(l, nomeIng);
    alvo.innerHTML =
      (difs.length ? '<section class="cartao aviso-pesagem"><p class="pequeno muted">Pesado diferente da receita</p>' +
        difs.map(function(d){ return '<p>' + esc(d) + '</p>'; }).join("") + '</section>' : '') +
      '<p class="rotulo-aval">Textura</p>' +
      '<div class="seg seg-grade" role="group" aria-label="Textura">' + TEXTURA.map(function(o){
        return '<button type="button" data-t="' + o[0] + '" aria-pressed="' + (a.textura.indexOf(o[0]) >= 0) + '"' + dis + '>' + o[1] + '</button>';
      }).join("") + '</div>' +
      AVALIACAO.map(function(g){
        return '<p class="rotulo-aval">' + g.nome + '</p><div class="seg" role="group" aria-label="' + g.nome + '">' + g.op.map(function(o){
          return '<button type="button" data-k="' + g.k + '" data-v="' + o[0] + '" aria-pressed="' + (a[g.k] === o[0]) + '"' + dis + '>' + o[1] + '</button>';
        }).join("") + '</div>';
      }).join("") +
      '<p class="rotulo-aval">Nota</p><div class="estrelas" role="group" aria-label="Nota de 1 a 5">' + [1, 2, 3, 4, 5].map(function(x){
        return '<button type="button" class="estrela' + (a.nota >= x ? ' cheia' : '') + '" data-nota="' + x + '" aria-label="' + x + (x === 1 ? ' estrela' : ' estrelas') + '" aria-pressed="' + (a.nota === x) + '"' + dis + '>' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3.1-5.4 3.1 1.2-6L3.3 9.5l6.1-.7z"/></svg></button>';
      }).join("") + '</div>' +
      '<p class="rotulo-aval">Observações</p>' +
      '<textarea class="campo-texto campo-aval" id="proximo" rows="4" placeholder="Como ficou? O que mudar na próxima versão?"' + dis + '>' + esc(l.proximo) + '</textarea>' +
      '<div class="acoes-final">' +
        (l.status !== "concluido" ? '<button type="button" class="botao largo" id="concluir">Concluir lote</button>' :
          '<p class="estado-final">Lote concluído' + (l.fim ? ' · ' + dataCurta(l.fim) + ', ' + hora(l.fim) : '') + '</p>' +
          (travado ? '<button type="button" class="pilula-cinza largo-pilula" id="editarAval">Editar avaliação</button>' :
            '<button type="button" class="pilula-preta largo-pilula" id="travarAval">Pronto</button>')) +
        (v ? '<button type="button" class="pilula-cinza largo-pilula" id="proximaVersao">Criar próxima versão</button>' +
          (difs.length ? '<button type="button" class="pilula-cinza largo-pilula" id="proximaPesada">Criar próxima versão com o que pesei</button>' : '') : '') +
      '</div>' +
      '<div class="acoes-linha"><button type="button" class="botao perigo" id="excluirLote">Excluir lote</button></div>';

    alvo.querySelectorAll("[data-t]").forEach(function(b){
      b.addEventListener("click", function(){
        const t = b.dataset.t, i = a.textura.indexOf(t);
        if (i >= 0) a.textura.splice(i, 1);
        else if (t === "lisa") a.textura = ["lisa"];
        else { a.textura = a.textura.filter(function(x){ return x !== "lisa"; }); a.textura.push(t); }
        grava(); desenha();
      });
    });
    alvo.querySelectorAll("[data-nota]").forEach(function(b){
      b.addEventListener("click", function(){
        const x = Number(b.dataset.nota);
        a.nota = a.nota === x ? null : x;   // tocar de novo na mesma estrela apaga a nota
        grava(); desenha();
      });
    });
    alvo.querySelectorAll(".seg [data-k]").forEach(function(b){
      b.addEventListener("click", function(){
        const k = b.dataset.k, val = k === "nota" ? Number(b.dataset.v) : b.dataset.v;
        a[k] = a[k] === val ? null : val;
        grava(); desenha();
      });
    });
    alvo.querySelector("#proximo").addEventListener("input", function(ev){ l.proximo = ev.target.value; l.proximoEditado = true; grava(); });
    const conc = alvo.querySelector("#concluir");
    if (conc) conc.addEventListener("click", function(){ l.status = "concluido"; l.fim = new Date().toISOString(); delete l.editando; grava(); desenha(); });
    const ed = alvo.querySelector("#editarAval");
    if (ed) ed.addEventListener("click", function(){ l.editando = true; desenha(); });
    const tr = alvo.querySelector("#travarAval");
    if (tr) tr.addEventListener("click", function(){ delete l.editando; grava(); desenha(); });

    async function abreProxima(comPesado){
      const calc = db.calc;
      const temRascunho = calc.linhas.length && !calc.versaoId;
      if (temRascunho && !(await confirma("Abrir a v" + v.numero + " na calculadora substitui o rascunho que está aberto lá. Continuar?", "Abrir"))) return;
      calc.notaSugerida = l.proximo || "";
      if (comPesado){
        // As quantidades da balança viram o ponto de partida da próxima versão.
        calc.linhasPesadas = l.pesado.map(function(x){ return {id:x.id, g:x.real != null ? x.real : Math.round(x.previsto * l.escala * 10) / 10}; });
      } else delete calc.linhasPesadas;
      grava();
      location.hash = "#/calculadora/v/" + encodeURIComponent(v.id);
    }
    const pv = alvo.querySelector("#proximaVersao");
    if (pv) pv.addEventListener("click", function(){ abreProxima(false); });
    const pp = alvo.querySelector("#proximaPesada");
    if (pp) pp.addEventListener("click", function(){ abreProxima(true); });
    alvo.querySelector("#excluirLote").addEventListener("click", excluir);
  }

  desenha();
  atualizaVoltar("#/testes", "Testes");
  return {titulo:"Lote", voltar:"#/testes", voltarRotulo:"Testes", limpa:function(){
    document.removeEventListener("visibilitychange", aoVoltar);
    try { if (trava) trava.release(); } catch (e) {}
    delete l.editando;
    salva();
  }};
}
