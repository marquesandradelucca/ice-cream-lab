// Modo lote, em dois momentos:
//   1. Preparar (na bancada): pesar, com as sugestões de preparo à mão. Termina em "Pronto, avaliar depois".
//   2. Avaliar (horas depois, após maturar e endurecer): textura, dureza, doçura e nota, por toques.
// Situações do lote: "em andamento" (preparando) → "aguardando" (falta avaliar) → "concluido".
// Tudo é salvo a cada toque; se o app fechar, o lote volta onde parou. Tela acesa enquanto aberto.
import { dados, salva, lote, receita, versao, versoesDe, ingrediente, excluiLote, passosPreparo } from "../dados.js?v=20261120185106";
import { n, porUnidade, unidades, textoUnidades, qtdTexto } from "../calculo.js?v=20261120185106";
import { confirma } from "../ui.js?v=20261120185106";
import { atualizaVoltar } from "../app.js?v=20261120185106";
import { icone, capa, aplicaTom, estrelasEscolha, DUREZA, DOCURA, docuraAtual, larguraOutro } from "../visual.js?v=20261120185106";

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
// Escalas de 5 níveis (redesign). Lotes antigos: doçura "muito" vira "doce" (docuraAtual).
const AVALIACAO = [
  {k:"dureza", nome:"Dureza", op:DUREZA},
  {k:"docura", nome:"Doçura", op:DOCURA}
];
const FRASES = {
  textura:{cristais:"cristais de gelo", arenosa:"textura arenosa", gomosa:"textura gomosa"},
  dureza:{mole:"ficou mole", macia:"um pouco mole", firme:"um pouco dura", dura:"ficou dura"},
  docura:{pouco:"pouco doce", media:"faltou um pouco de doce", doce:"um pouco doce demais", enjoativa:"doce demais"}
};
function valor(a, k){ return k === "docura" ? docuraAtual(a[k]) : a[k]; }

export function aberto(l){ return l.status !== "concluido"; }

function texturas(a){ return Array.isArray(a.textura) ? a.textura : []; }
function frases(l){
  const a = l.avaliacao || {}, partes = [];
  texturas(a).forEach(function(t){ if (FRASES.textura[t]) partes.push(FRASES.textura[t]); });
  ["dureza", "docura"].forEach(function(k){ const x = valor(a, k); if (FRASES[k][x]) partes.push(FRASES[k][x]); });
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

// Lote completo para mostrar dentro da versão: data, nota em estrelas, o que foi marcado e as observações.
const ESTRELA_P = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3.1-5.4 3.1 1.2-6L3.3 9.5l6.1-.7z"/></svg>';
export function cartaoLote(l){
  const a = l.avaliacao || {}, concluido = l.status === "concluido";
  const rot = function(lista, v){ const o = lista.find(function(x){ return x[0] === v; }); return o ? o[1].toLowerCase() : ""; };
  const marcas = [];
  const tx = texturas(a).map(function(t){ return rot(TEXTURA, t); }).filter(Boolean);
  if (tx.length) marcas.push("Textura " + tx.join(", "));
  AVALIACAO.forEach(function(g){ if (a[g.k]) marcas.push(g.nome + " " + rot(g.op, valor(a, g.k))); });
  // A observação automática ("Lote de…: nota 4/5") repete o que já está acima; só mostra o que foi escrito.
  const obs = l.proximoEditado && l.proximo ? l.proximo : "";
  const destino = "#/lote/" + encodeURIComponent(l.id) + (l.status === "aguardando" ? "/avaliar" : "");
  return '<a class="lote-cartao" href="' + destino + '">' +
    '<span class="lote-topo"><span class="lote-data">Lote de ' + dataCurta(l.inicio) + '</span>' +
      (concluido ? (a.nota ? '<span class="lote-nota" aria-label="Nota ' + a.nota + ' de 5">' +
        [1, 2, 3, 4, 5].map(function(x){ return '<span class="mini-estrela' + (a.nota >= x ? ' cheia' : '') + '">' + ESTRELA_P + '</span>'; }).join("") + '</span>' :
        '<span class="muted pequeno">sem nota</span>') :
        '<span class="muted pequeno">' + (l.status === "aguardando" ? "aguardando avaliação" : "preparando") + '</span>') +
    '</span>' +
    (marcas.length ? '<span class="lote-marcas">' + esc(marcas.join(" · ")) + '</span>' : '') +
    (obs ? '<span class="lote-obs">' + esc(obs).replace(/\n/g, "<br>") + '</span>' : '') +
  '</a>';
}

// Ingredientes pesados diferente da receita (meio grama de tolerância).
export function diferencasPesagem(l, nomeIng){
  return l.pesado.filter(function(x){
    return x.real != null && Math.abs(x.real - x.previsto * l.escala) >= 0.5;
  }).map(function(x){ return nomeIng(x.id) + " " + gramas(x.previsto * l.escala) + " → " + gramas(x.real) + " g"; });
}

// Tela do lote (redesign): sobre a capa da receita, com painéis de vidro escuro e sem abas.
// Preparar = bancada, um ingrediente por vez (com a lista toda logo abaixo); Avaliar = escolhas por toque.
export function render(el, rota){
  const db = dados();
  const l = lote(decodeURIComponent(rota.args[0] || ""));
  if (!l){
    el.innerHTML = '<p class="muted">Lote não encontrado.</p>';
    return {titulo:"Lote", voltar:"#/receitas/teste", voltarRotulo:"Receitas"};
  }
  document.body.classList.add("ui", "rec", "loteui");
  // Lotes do formato antigo (seis passos): quem já passou do preparo vai para Avaliar.
  if (l.passo > PASSOS.length - 1) l.passo = PASSOS.length - 1;
  if (l.status === "em andamento" && l.passo === 1) l.status = "aguardando";
  const r = receita(l.receitaId), v = versao(l.versaoId);
  // Lote da versão final de uma receita final: não tem avaliação, só o preparo.
  const semAval = !!(r && v && r.status === "final" && r.versaoFinal === v.id);
  if (semAval){ l.passo = 0; if (l.status === "aguardando") l.status = "em andamento"; }
  // Só dá para avaliar depois de concluir o preparo; a tela abre direto no momento certo.
  else l.passo = (rota.args[1] === "avaliar" && l.status !== "em andamento") ? 1 : (l.status === "em andamento" ? 0 : l.passo);
  const compIng = function(id){ return (v && v.snapshot && v.snapshot[id]) || ingrediente(id); };
  const nomeIng = function(id){ const i = (v && v.snapshot && v.snapshot[id]) || ingrediente(id); return i ? i.nome : "(ingrediente removido)"; };
  const voltarHref = r ? "#/receita/" + encodeURIComponent(r.id) : "#/receitas/teste";
  // Bancada: começa no primeiro ingrediente ainda não pesado.
  // Passo a passo: primeiro os ingredientes (pesar), depois as etapas do modo de preparo.
  const etapas = passosPreparo(r && r.preparo);
  l.etapasOk = Array.isArray(l.etapasOk) ? l.etapasOk : [];
  const P = l.pesado.length, N = P + etapas.length;
  function okDe(i){ return i < P ? !!l.pesado[i].ok : !!l.etapasOk[i - P]; }
  function marca(i, v){
    if (i < P){ const y = l.pesado[i]; y.ok = v; if (v && y.real == null) y.real = Math.round(y.previsto * l.escala * 10) / 10; }
    else l.etapasOk[i - P] = v;
  }
  // Receita final: depois da última etapa, um passo a mais com "Concluir preparo".
  const NF = N + (N ? 1 : 0);
  let atual = 0; while (atual < N - 1 && okDe(atual)) atual++;
  if (N && okDe(N - 1)) atual = N;
  let entrada = 0;   // direção da última troca, para animar a entrada do próximo ingrediente
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
    const situacao = l.status === "concluido" ? "Concluído" : l.status === "aguardando" ? "Para avaliar" : "Preparando";
    el.innerHTML =
      '<div class="rec-fundo" style="--capa:' + capa(r ? r.nome : "", r && r.capa) + '"></div>' +
      '<div class="ui-app">' +
      '<header class="ui-cabecalho nav"><a class="ui-redondo escuro" href="' + voltarHref + '" aria-label="Voltar para a receita">' + icone("voltar") + '</a>' +
        '<span style="flex:1"></span>' + (semAval ? '' : '<button class="ui-redondo escuro" type="button" id="opcoes" aria-label="Mais opções">' + icone("opcoes") + '</button>') + '</header>' +
      '<div class="ui-tela rec-tela">' +
        '<section class="ui-cartao ui-vidro-escuro rec-painel">' +
          // Receita final: é só um preparo (sem versão nem "lote").
          (semAval ? '' : '<div class="rec-etiquetas"><span class="ui-etiqueta">' + situacao + '</span>' + (v ? '<span class="ui-etiqueta">v' + v.numero + '</span>' : '') +
            '<span class="ui-etiqueta">Lote de ' + dataCurta(l.inicio) + '</span></div>') +
          '<h1 class="rec-nome">' + esc(r ? r.nome : "Receita") + '</h1>' +
        '</section>' +
        '<div id="conteudo" class="lote-conteudo"></div>' +
      '</div></div>';
    aplicaTom(el, r ? r.nome : "", r && r.capa);
    el.querySelectorAll(".lote-abas [data-i]").forEach(function(b){ b.addEventListener("click", function(){
      const i = Number(b.dataset.i);
      if (i === 1 && l.status === "em andamento") l.status = "aguardando";
      vai(i);
    }); });
    const bOp = el.querySelector("#opcoes"); if (bOp) bOp.addEventListener("click", opcoes);
    ({preparar:preparar, avaliar:avaliar})[PASSOS[l.passo].id](el.querySelector("#conteudo"));
  }

  // Mais opções: Excluir lote (vermelho, regra de ação destrutiva) e Fechar.
  function opcoes(){
    const veu = document.createElement("div"); veu.className = "ui-veu";
    const f = document.createElement("div"); f.className = "ui-folha"; f.setAttribute("role", "dialog"); f.setAttribute("aria-label", "Opções do lote");
    f.innerHTML = '<span class="puxador"></span><h2>Lote de ' + dataCurta(l.inicio) + '</h2>' +
      '<button type="button" class="ui-botao vidro largo perigo" id="excluirLote">Excluir lote</button>' +
      '<button type="button" class="ui-botao preto largo" id="fechar">Fechar</button>';
    document.body.append(veu, f);
    const fecha = function(){ veu.remove(); f.remove(); };
    veu.addEventListener("click", fecha); f.querySelector("#fechar").addEventListener("click", fecha);
    f.querySelector("#excluirLote").addEventListener("click", function(){ fecha(); excluir(); });
  }

  async function excluir(){
    if (!(await confirma("Excluir este lote e tudo o que foi registrado nele?", "Excluir", true))) return;
    excluiLote(l.id); grava(); location.hash = voltarHref;
  }

  // ----- 1. Preparar: bancada + lista + tamanho + preparo -----
  function preparar(alvo){
    const base = l.pesado.reduce(function(s, x){ return s + (porUnidade(ingrediente(x.id)) ? 0 : x.previsto); }, 0) || 1;   // fava (por unidade) fora do peso
    const total = base * l.escala;
    const feitos = l.pesado.filter(function(x){ return x.ok; }).length;
    if (atual >= NF) atual = NF - 1;
    const fim = atual === N;
    const x = atual >= 0 && atual < P ? l.pesado[atual] : null;
    const et = atual >= P ? etapas[atual - P] : null;
    const tamanhos = [250, 500, 1000];
    const alvoG = Math.round(total);
    const tudo = feitos === l.pesado.length;

    alvo.innerHTML =
      // Bancada: o ingrediente da vez em destaque.
      (N ? '<section class="ui-cartao ui-vidro-escuro rec-painel lote-bancada" id="bancada">' +
        // Progresso: um traço por ingrediente (cheio = pesado, contorno = o da vez).
        '<div class="lote-progresso" aria-hidden="true">' + Array.apply(null, Array(N)).map(function(_, i){
          return '<span class="' + (okDe(i) ? 'ok' : '') + (i === atual ? ' atual' : '') + '"></span>'; }).join("") + '</div>' +
        (fim ? '<div class="lote-palco lote-fim"><button type="button" class="ui-redondo escuro" id="anterior" aria-label="Voltar à última etapa">' + icone("voltar") + '</button>' +
          '<div class="lote-instrucao"><span class="lote-etapa">Tudo pronto!</span>' +
          (semAval ? (l.status === "concluido" ? '<span class="ui-sec">Preparo concluído</span>' : '<button type="button" class="ui-botao preto" id="concluirFinal">Concluir preparo</button>') :
            '<div class="lote-fim-acoes">' + (l.status === "em andamento" ? '<button type="button" class="ui-botao preto" id="avaliarDepois">Concluir</button>' : '') +
              '<button type="button" class="ui-botao ' + (l.status === "em andamento" ? 'vidro-escuro' : 'preto') + '" id="avaliarAgora">' + (l.status === "em andamento" ? 'Avaliar agora' : 'Avaliar') + '</button></div>') + '</div>' +
          '<span class="lote-fim-vazio"></span></div>' : '') +
        (fim ? '' : '<div class="lote-palco">' +
          '<button type="button" class="ui-redondo escuro" id="anterior" aria-label="Ingrediente anterior"' + (atual === 0 ? ' disabled' : '') + '>' + icone("voltar") + '</button>' +
          (x ? '<div class="lote-instrucao"><span class="ui-sec">' + (atual + 1) + ' de ' + P + '</span>' +
            (porUnidade(ingrediente(x.id)) ? '<b class="ui-num lote-g">' + textoUnidades(ingrediente(x.id), unidades(ingrediente(x.id), x.previsto * l.escala)) + '</b>' :
            '<b class="ui-num lote-g">' + gramas(x.previsto * l.escala) + '<small> g</small></b>') +
            '<span class="lote-ing">' + esc(nomeIng(x.id)) + '</span></div>' :
            '<div class="lote-instrucao"><span class="ui-sec">Etapa ' + (atual - P + 1) + ' de ' + etapas.length + '</span>' +
            '<span class="lote-etapa">' + esc(et) + '</span></div>') +
          '<button type="button" class="ui-redondo escuro seta-dir" id="proximo" aria-label="Próximo passo"' + (atual === NF - 1 && okDe(atual) ? ' disabled' : '') + '>' + icone("direita") + '</button>' +
        '</div>') +
      '</section>' : '') +
      // Lista completa: tocar leva o ingrediente para a bancada.
      '<section class="ui-cartao ui-vidro-escuro rec-painel">' +
        '<div class="rec-cab"><h2>Ingredientes</h2><span class="ui-sec">para ' + (alvoG >= 1000 && alvoG % 1000 === 0 ? alvoG / 1000 + ' kg' : alvoG + ' g') + '</span></div>' +
        '<div class="ui-linhas">' + l.pesado.map(function(y, i){
          return '<button type="button" class="ui-linha lote-linha' + (y.ok ? ' ok' : '') + (i === atual ? ' atual' : '') + '" data-i="' + i + '">' +
            '<span class="lote-check" role="checkbox" aria-checked="' + y.ok + '" aria-label="Pesado">' + (y.ok ? icone("ok") : '') + '</span>' +
            '<span class="lote-linha-nome">' + esc(nomeIng(y.id)) + '</span>' +
            '<b class="ui-num">' + qtdTexto(ingrediente(y.id) || compIng(y.id), y.real != null && y.ok ? y.real : y.previsto * l.escala) + '</b></button>';
        }).join("") +
        '<div class="ui-linha rec-total"><span>Peso total</span><b class="ui-num">' + gramas(total) + ' g</b></div></div>' +
        '<div class="rec-tamanhos" role="group" aria-label="Tamanho do lote">' + tamanhos.map(function(g){
          return '<button type="button" data-g="' + g + '" aria-pressed="' + (alvoG === g) + '">' + (g < 1000 ? g + ' g' : g / 1000 + ' kg') + '</button>'; }).join("") +
          '<label class="rec-outro' + (tamanhos.indexOf(alvoG) < 0 ? ' ativo' : '') + '"><input type="number" id="loteTotal" inputmode="decimal" min="50" step="50" value="' + (tamanhos.indexOf(alvoG) < 0 ? alvoG : '') + '" placeholder="Outro" aria-label="Outro tamanho em gramas"><span>g</span></label></div>' +
      '</section>' +
      // Preparo da receita e sugestões, recolhíveis.
      // Na bancada o modo de preparo já vem aberto.
      (r && r.preparo ? '<section class="ui-cartao ui-vidro-escuro rec-painel"><details class="rec-dobra" open>' +
        '<summary><h2>Modo de preparo</h2><span class="rec-seta" aria-hidden="true">' + icone("baixo") + '</span></summary>' +
        '<ol class="rec-passos">' + etapas.map(function(t, j){ return '<li class="' + (l.etapasOk[j] ? 'ok' : '') + '">' + esc(t) + '</li>'; }).join("") + '</ol></details></section>' : '') +
      '<section class="ui-cartao ui-vidro-escuro rec-painel"><details class="rec-dobra">' +
        '<summary><h2>Sugestões de preparo</h2><span class="rec-seta" aria-hidden="true">' + icone("baixo") + '</span></summary>' +
        '<div class="ui-linhas">' + SUGESTOES.map(function(s){
          return '<div class="lote-sugestao"><b>' + s[0] + '</b><span class="ui-sec">' + s[1] + '</span></div>'; }).join("") + '</div></details></section>' +
      '';

    function escala(novo){ if (novo > 0){ l.escala = novo / base; l.pesado.forEach(function(y){ if (!y.ok) y.real = null; }); grava(); desenha(); } }
    alvo.querySelectorAll(".rec-tamanhos [data-g]").forEach(function(b){ b.addEventListener("click", function(){ escala(Number(b.dataset.g)); }); });
    const elTotal = alvo.querySelector("#loteTotal");
    larguraOutro(elTotal); elTotal.addEventListener("input", function(){ larguraOutro(elTotal); });
    elTotal.addEventListener("change", function(){ escala(Number(elTotal.value)); });
    // Lista: o círculo marca/desmarca como pesado; o resto da linha leva o ingrediente para a bancada.
    alvo.querySelectorAll(".lote-linha").forEach(function(b){ b.addEventListener("click", function(ev){
      const i = Number(b.dataset.i);
      if (ev.target.closest(".lote-check")){
        const y = l.pesado[i]; y.ok = !y.ok;
        if (y.ok && y.real == null) y.real = Math.round(y.previsto * l.escala * 10) / 10;
        if (y.ok && i === atual){ const prox = l.pesado.findIndex(function(z, j){ return j > i && !z.ok; }); if (prox >= 0) atual = prox; }
        grava();
      } else atual = i;
      desenha();
    }); });
    if (N){
      // Navegar: setas ou deslizar com o dedo. O conteúdo acompanha o dedo, sai para o lado e o próximo entra pelo outro.
      const card = alvo.querySelector("#bancada"), palco = card.querySelector(".lote-instrucao");
      if (entrada){ palco.classList.add(entrada < 0 ? "entra-esq" : "entra-dir"); entrada = 0; }
      const passa = function(d){
        // Avançar marca o ingrediente da vez como pesado; voltar desmarca o ingrediente para onde se volta.
        // No último, avançar só marca e, já marcado, voltar primeiro desmarca ele mesmo.
        if (d > 0 && atual < N && !okDe(atual)){ marca(atual, true); grava(); }
        if (d < 0 && atual === NF - 1 && atual < N && okDe(atual)){ marca(atual, false); grava(); desenha(); return; }
        const i = atual + d;
        if (d < 0 && i >= 0 && i < N && okDe(i)){ marca(i, false); grava(); }
        if (i < 0 || i >= NF){ palco.style.transition = "transform .2s ease, opacity .2s ease"; palco.style.transform = ""; palco.style.opacity = ""; if (d > 0) desenha(); return; }
        palco.style.transition = "transform .16s ease-in, opacity .16s ease-in";
        palco.style.transform = "translateX(" + (d > 0 ? -60 : 60) + "%)"; palco.style.opacity = "0";
        setTimeout(function(){ atual = i; entrada = d; desenha(); }, 150);
      };
      alvo.querySelector("#anterior").addEventListener("click", function(){ passa(-1); });
      const bProx = alvo.querySelector("#proximo"); if (bProx) bProx.addEventListener("click", function(){ passa(1); });
      let x0 = null, y0 = 0, lado = false;
      card.addEventListener("touchstart", function(ev){ x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; lado = false; palco.style.transition = "none"; }, {passive:true});
      card.addEventListener("touchmove", function(ev){ if (x0 == null) return;
        const dx = ev.touches[0].clientX - x0, dy = ev.touches[0].clientY - y0;
        if (!lado && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) lado = true;
        if (!lado) return;
        // Nas pontas a lista resiste (anda menos).
        const ponta = (dx > 0 && atual === 0) || (dx < 0 && atual === NF - 1);
        palco.style.transform = "translateX(" + (ponta ? dx * 0.25 : dx) + "px)";
        palco.style.opacity = String(Math.max(0.3, 1 - Math.abs(dx) / 400));
      }, {passive:true});
      card.addEventListener("touchend", function(ev){ if (x0 == null) return;
        const dx = ev.changedTouches[0].clientX - x0; x0 = null;
        if (lado && Math.abs(dx) > 60) return passa(dx < 0 ? 1 : -1);
        palco.style.transition = "transform .2s ease, opacity .2s ease"; palco.style.transform = ""; palco.style.opacity = "";
      });
    }
    const depois = alvo.querySelector("#avaliarDepois");
    if (depois) depois.addEventListener("click", function(){ l.status = "aguardando"; grava(); location.hash = voltarHref; });
    const cf = alvo.querySelector("#concluirFinal");
    if (cf) cf.addEventListener("click", function(){ l.status = "concluido"; l.fim = new Date().toISOString(); grava(); location.hash = voltarHref; });
    const agora = alvo.querySelector("#avaliarAgora");
    if (agora) agora.addEventListener("click", function(){ if (l.status === "em andamento") l.status = "aguardando"; vai(1); });
  }

  // ----- 2. Avaliar -----
  function avaliar(alvo){
    const a = l.avaliacao;
    if (!Array.isArray(a.textura)) a.textura = [];
    if (a.docura === "muito") a.docura = "doce";
    // Observações e "próxima versão" são um campo só: começa com o resumo do que foi marcado
    // e vira a nota da próxima versão. Textos do formato antigo são juntados aqui.
    if (l.obs){ l.proximo = [l.proximo, l.obs].filter(Boolean).join("\n"); l.proximoEditado = true; delete l.obs; }
    if (!l.proximoEditado) l.proximo = notaDoLote(l);
    const travado = l.status === "concluido" && !l.editando;
    const dis = travado ? " disabled" : "";
    const difs = diferencasPesagem(l, nomeIng);

    alvo.innerHTML =
      (difs.length ? '<section class="ui-cartao ui-vidro-escuro rec-painel"><h2>Pesado diferente da receita</h2>' +
        '<div class="ui-linhas">' + difs.map(function(d){ return '<div class="ui-linha"><span>' + esc(d) + '</span></div>'; }).join("") + '</div></section>' : '') +
      '<section class="ui-cartao ui-vidro-escuro rec-painel' + (travado ? ' travado' : '') + '">' +
        '<h2>Nota</h2>' + estrelasEscolha(a.nota || 0).replace(/<button /g, '<button' + dis + ' ') +
        '<h2>Textura</h2><div class="lote-chips" role="group" aria-label="Textura">' + TEXTURA.map(function(o){
          return '<button type="button" data-t="' + o[0] + '" aria-pressed="' + (a.textura.indexOf(o[0]) >= 0) + '"' + dis + '>' + o[1] + '</button>'; }).join("") + '</div>' +
        AVALIACAO.map(function(g){
          return '<h2>' + g.nome + '</h2><div class="ui-opcoes lote-escala" role="group" aria-label="' + g.nome + '">' + g.op.map(function(o){
            return '<button type="button" data-k="' + g.k + '" data-v="' + o[0] + '" aria-pressed="' + (a[g.k] === o[0]) + '"' + dis + '>' + o[1] + '</button>'; }).join("") + '</div>';
        }).join("") +
      '</section>' +
      '<section class="ui-cartao ui-vidro-escuro rec-painel"><h2>Observações</h2>' +
        '<textarea class="lote-obs-campo" id="proximo" rows="4" placeholder="Como ficou? O que mudar na próxima versão?"' + dis + '>' + esc(l.proximo) + '</textarea></section>' +
      (l.status !== "concluido" ? '<button type="button" class="ui-botao preto largo" id="concluir">Concluir lote</button>' :
        '<p class="lote-estado">Lote concluído' + (l.fim ? ' · ' + dataCurta(l.fim) + ', ' + hora(l.fim) : '') + '</p>' +
        (travado ? '<button type="button" class="ui-botao vidro-escuro largo" id="editarAval">Editar avaliação</button>' :
          '<button type="button" class="ui-botao preto largo" id="travarAval">Pronto</button>')) +
      // Depois de concluir: decidir o próximo passo (só em receita que ainda está em teste).
      (v && r && l.status === "concluido" && r.status !== "final" ? (function(){
        const proxima = 'v' + (Math.max.apply(null, versoesDe(r.id).map(function(x){ return x.numero; })) + 1);
        const finalPrimeiro = (a.nota || 0) >= 4;
        const bFinal = '<button type="button" class="ui-botao ' + (finalPrimeiro ? 'preto' : 'vidro-escuro') + ' largo" id="marcaFinal">Marcar como final</button>';
        const bNova = '<button type="button" class="ui-botao ' + (finalPrimeiro ? 'vidro-escuro' : 'preto') + ' largo" id="proximaVersao">Criar ' + proxima + ' com ajustes</button>';
        return '<section class="ui-cartao ui-vidro-escuro rec-painel lote-decisao"><h2>E agora?</h2>' +
          '<p class="ui-sec">' + (finalPrimeiro ? 'Ficou bom: dá para marcar esta versão como a receita final.' : 'Ajuste a mistura numa nova versão; as observações viram a nota dela.') + '</p>' +
          (finalPrimeiro ? bFinal + bNova : bNova + bFinal) +
          (difs.length ? '<button type="button" class="ui-botao vidro-escuro largo" id="proximaPesada">Criar ' + proxima + ' com o que pesei</button>' : '') + '</section>';
      })() : '');

    alvo.querySelectorAll("[data-t]").forEach(function(b){
      b.addEventListener("click", function(){
        const t = b.dataset.t, i = a.textura.indexOf(t);
        if (i >= 0) a.textura.splice(i, 1);
        else if (t === "lisa") a.textura = ["lisa"];
        else { a.textura = a.textura.filter(function(y){ return y !== "lisa"; }); a.textura.push(t); }
        grava(); desenha();
      });
    });
    alvo.querySelectorAll("[data-nota]").forEach(function(b){
      b.addEventListener("click", function(){
        const y = Number(b.dataset.nota);
        a.nota = a.nota === y ? null : y;   // tocar de novo na mesma estrela apaga a nota
        grava(); desenha();
      });
    });
    alvo.querySelectorAll(".lote-escala [data-k]").forEach(function(b){
      b.addEventListener("click", function(){
        const k = b.dataset.k, val = b.dataset.v;
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
        calc.linhasPesadas = l.pesado.map(function(y){ return {id:y.id, g:y.real != null ? y.real : Math.round(y.previsto * l.escala * 10) / 10}; });
      } else delete calc.linhasPesadas;
      grava();
      location.hash = "#/calculadora/v/" + encodeURIComponent(v.id);
    }
    const pv = alvo.querySelector("#proximaVersao");
    if (pv) pv.addEventListener("click", function(){ abreProxima(false); });
    const mf = alvo.querySelector("#marcaFinal");
    if (mf) mf.addEventListener("click", async function(){
      if (!(await confirma("Marcar a v" + v.numero + " como versão final? Ela vira a receita final.", "Confirmar"))) return;
      r.versaoFinal = v.id; r.status = "final"; grava();
      location.hash = "#/receita/" + encodeURIComponent(r.id);
    });
    const pp = alvo.querySelector("#proximaPesada");
    if (pp) pp.addEventListener("click", function(){ abreProxima(true); });
  }

  desenha();
  atualizaVoltar(voltarHref, "Receita");
  return {titulo:"Lote", voltar:voltarHref, voltarRotulo:"Receita", limpa:function(){
    document.removeEventListener("visibilitychange", aoVoltar);
    try { if (trava) trava.release(); } catch (e) {}
    delete l.editando;
    document.body.classList.remove("ui", "rec", "loteui");
    document.querySelectorAll(".ui-veu,.ui-folha").forEach(function(x){ x.remove(); });
    salva();
  }};
}
