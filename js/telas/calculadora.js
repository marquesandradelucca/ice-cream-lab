// Calculadora: editor de mistura com balanço ao vivo.
// Funciona sozinha: o rascunho aberto é salvo automaticamente a cada toque, sem precisar "salvar receita".
import { calcula, ALVOS, ESCALA, ALVO_FP, ALVO_ESTAB, PRESETS, NOMES_ESTILO,
         pontoCongelamento, avisos, n, nivelFaixa, porUnidade, unidades, passoUn } from "../calculo.js?v=20261123121715";
import { icone, capa, aplicaTom } from "../visual.js?v=20261123121715";
import { confirma, LAPIS } from "../ui.js?v=20261123121715";
import { dados, salva, ingrediente, receita, versao, versoesDe, criaReceita, novaVersao, ingredientesMudados, snapshotDe } from "../dados.js?v=20261123121715";

function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

// Fundo do rascunho (sem receita): degradê Neutro 2 (azul-acinzentado) da paleta.
const FUNDO_RASCUNHO = "radial-gradient(circle at 80% 10%, #CBCED8aa 0%, transparent 55%), radial-gradient(circle at 10% 92%, #5F678699 0%, transparent 50%), linear-gradient(160deg, #5F6786 0%, #949AAE 55%, #CBCED8 100%)";

function barra(valor, alvo, escala, texto, casas, estilo){
  const min = escala[0], span = escala[1] - escala[0];
  function pos(v){ return Math.max(0, Math.min(100, (v - min) / span * 100)); }
  const a = pos(alvo[0]), b = pos(alvo[1]), p = pos(valor);
  const borda = p < 12 ? " inicio" : p > 88 ? " fim" : "";
  const nivel = nivelFaixa(valor, alvo);
  const ocultarZero = estilo === "sorbet" && alvo[0] === 0;
  const compact = b - a < 18 && !ocultarZero ? " compact" : "";
  // --a/--b: onde começa e termina a faixa ideal; o trilho usa para o degradê (rosa nas pontas, laranja perto do ideal).
  return '<div class="bar" style="--a:' + a + '%;--b:' + b + '%"><span class="band" style="left:' + a + '%;width:' + Math.max(b - a, 1) + '%"></span>' +
    '<span class="range-label min num' + compact + (a < 7 && !compact ? ' edge-start' : '') + '" style="left:' + a + '%">' + (ocultarZero ? '' : n(alvo[0], casas)) + '</span>' +
    '<span class="range-label max num' + compact + (b > 93 && !compact ? ' edge-end' : '') + '" style="left:' + b + '%">' + n(alvo[1], casas) + '</span>' +
    '<span class="mark status-' + nivel + borda + '" style="left:calc(' + p + '% - 1.5px)"></span></div>';
}

// Cada gráfico leva ao tema de Estudo que explica o número.
const TEMA_ESTUDO = {"Gordura":"balanceamento", "Sólidos lácteos (SLNG)":"balanceamento", "Açúcares":"balanceamento",
  "Sólidos totais":"balanceamento", "POD (doçura)":"pac-pod", "PAC (maciez)":"pac-pod",
  "Estabilizantes":"estabilizantes", "Ponto de congelamento":"dureza", "Água na mistura":"balanceamento"};
function metrica(nome, valor, alvo, escala, sufixo, casas, estilo){
  const tema = TEMA_ESTUDO[nome];
  const rotulo = tema ? '<a class="name metric-ajuda" href="#/estudo/' + tema + '/calculadora">' + nome + '<span class="info" aria-hidden="true">i</span></a>' :
    '<span class="name">' + nome + '</span>';
  return '<div class="metric"><div class="metric-topo">' + rotulo +
    '<span class="metric-valor num status-' + nivelFaixa(valor, alvo) + '">' + n(valor, casas) + sufixo + '</span></div>' +
    barra(valor, alvo, escala, n(valor, casas) + sufixo, casas, estilo) + '</div>';
}

function passoDe(v){ return v < 10 ? 0.5 : v < 50 ? 1 : 5; }

export function render(el, rota){
  const db = dados();
  const calc = db.calc;

  // Com uma versão antiga aberta e "manter valores", a conta usa a composição guardada nela.
  function comp(id){ return (calc.snapshot && calc.snapshot[id]) || ingrediente(id); }
  function nomeIng(id){ const i = comp(id); return i ? i.nome : "(ingrediente removido)"; }

  function carregaVersao(v){
    const r = receita(v.receitaId); if (!r) return;
    calc.receitaId = r.id; calc.versaoId = v.id; calc.nome = r.nome;
    calc.estilo = ALVOS[v.estilo] ? v.estilo : r.estilo;
    calc.linhas = JSON.parse(JSON.stringify(v.linhas));
    delete calc.snapshot;
    // Se algum ingrediente mudou desde a versão, abre com os números dela e pergunta.
    if (ingredientesMudados(v.snapshot).some(function(id){ return v.linhas.some(function(l){ return l.id === id; }); })){
      calc.snapshot = JSON.parse(JSON.stringify(v.snapshot));
    }
  }
  // Atalho vindo da página da receita: #/calculadora/v/<id da versão>
  let daReceita = null;   // aberta a partir de uma receita: o voltar leva de volta a ela
  let padraoCorrige = false;   // "Editar versão": o Salvar já abre em "Corrigir vN"
  if (rota && rota.args[0] === "v" && rota.args[1]){
    const v = versao(decodeURIComponent(rota.args[1]));
    // Editar mistura: abre a Calculadora normal (cabeçalho, Abrir e aba Calculadora), com a receita carregada.
    if (v){
      carregaVersao(v);
      // "Criar próxima versão com o que pesei": as quantidades da balança substituem as da versão.
      if (calc.linhasPesadas){ calc.linhas = calc.linhasPesadas; delete calc.linhasPesadas; delete calc.snapshot; }
      if (rota.args[2] === "corrigir") padraoCorrige = true;
      // "Usar mistura em nova receita": a mistura vira rascunho solto, salvar cria outra receita.
      if (rota.args[2] === "nova"){
        const rr = receita(v.receitaId);
        delete calc.receitaId; delete calc.versaoId; delete calc.snapshot; daReceita = null;
        calc.nome = (rr ? rr.nome : "Receita") + " (variação)";
        if (rr && rr.preparo) calc.preparo = rr.preparo;
      }
    }
    history.replaceState(null, "", "#/calculadora");
  }

  // Há mudanças desde a versão aberta?
  function mudou(){
    const v = calc.versaoId && versao(calc.versaoId);
    if (!v) return calc.linhas.length > 0;
    if (v.estilo !== calc.estilo || v.linhas.length !== calc.linhas.length) return true;
    return v.linhas.some(function(l, i){ return l.id !== calc.linhas[i].id || Number(l.g) !== Number(calc.linhas[i].g); });
  }

  function registraUltima(){
    db.ultima = {rota:"#/calculadora", rotulo:"Calculadora · " + (calc.nome || "receita sem nome")};
  }
  function persiste(){ registraUltima(); salva(); if (typeof desenhaEstado === "function" && elEstadoPronto) desenhaEstado(); }
  let elEstadoPronto = false;

  document.body.classList.add("ui", "calcui");
  const rOrigem = daReceita && receita(daReceita);
  el.innerHTML =
    // Fundo da página: a capa da receita aberta; rascunho sem receita = degradê branco/cinza bem claro.
    '<div class="rec-fundo calc-fundo" id="calcFundo"></div>' +
    '<div class="ui-app">' +
    (rOrigem ?
      '<header class="ui-cabecalho nav"><a class="ui-redondo" href="#/receita/' + encodeURIComponent(rOrigem.id) + '" aria-label="Voltar para a receita">' + icone("voltar") + '</a><h1>' + esc(rOrigem.nome) + '</h1></header>' :
      '<header class="ui-cabecalho"><h1>Calculadora</h1>' +
        '<div class="menu-abrir" id="menuAbrir"><button type="button" class="ui-botao vidro calc-abrir" id="abrir" aria-haspopup="listbox" aria-expanded="false" aria-label="Abrir receita ou exemplo">' + icone("abrir") + 'Abrir</button>' +
        '<div class="menu-lista" role="listbox" aria-label="Abrir receita"><div class="menu-rolagem"></div></div></div></header>') +
    '<div class="ui-tela">' +
    // Cartão do nome: nome editável, estado e Salvar.
    '<section class="ui-cartao ui-vidro calc-nome">' +
      '<div class="calc-nome-linha"><div class="calc-nome-texto">' +
        '<div class="calc-nome-edita">' + '<textarea id="nome" class="calc-nome-campo" rows="1" placeholder="Receita sem nome" maxlength="60" enterkeyhint="done" aria-label="Nome da receita"></textarea>' +
          '<button type="button" class="calc-lapis" id="lapisNome" aria-label="Editar nome">' + icone("editar") + '</button></div>' +
        '<div class="ui-sec" id="estadoReceita"></div></div>' +
        '<button type="button" class="ui-botao preto" id="salvar">Salvar</button></div>' +
      '<a class="ui-botao vidro largo" id="irReceita" hidden>Ver versões e lotes</a>' +
    '</section>' +
    '<section class="ui-cartao ui-vidro" id="avisoSnap" hidden></section>' +
    // Ingredientes
    '<section class="ui-cartao ui-vidro" id="ingredientes">' +
      '<div class="calc-cab"><h2>Ingredientes</h2></div>' +
      '<div id="linhas"></div>' +
      '<p class="ui-sec" id="vazio" hidden>Nenhum ingrediente ainda. Adicione o primeiro ou abra uma base.</p>' +
      '<div class="linha-total">' +
        '<span class="rotulo-mistura">Mistura total</span>' +
        '<div class="qtd"><button type="button" class="passo" data-dir="-1" aria-label="Diminuir o peso total">−</button>' +
        '<label class="campo-g"><input type="number" id="peso" inputmode="decimal" min="0" step="10" aria-label="Mistura total em gramas (reescala a receita)"><span aria-hidden="true">g</span></label>' +
        '<button type="button" class="passo" data-dir="1" aria-label="Aumentar o peso total">+</button></div>' +
      '</div>' +
      '<div class="acoes-ing">' +
        '<button type="button" class="ui-botao preto" id="adicionar">+ ingrediente</button>' +
        '<button type="button" class="ui-botao vidro perigo" id="modoExcluir">Excluir</button>' +
      '</div>' +
    '</section>' +
    // Faixas de referência
    '<div class="ui-filtros dividir" id="estilo" role="group" aria-label="Faixas de referência dos gráficos">' +
      Object.keys(NOMES_ESTILO).map(function(k){
        return '<button type="button" class="ui-filtro" data-estilo="' + k + '">' + (k === "icecream" ? "Sorvete" : NOMES_ESTILO[k]) + '</button>';
      }).join("") + '</div>' +
    // Composição: avisos e gráficos de intervalo
    '<section class="ui-cartao ui-vidro resultado">' +
      '<div class="calc-cab"><h2>Composição</h2><span class="ui-sec">faixas de referência</span></div>' +
      '<div id="metricas"></div>' +
      // Feedback depois dos gráficos.
      '<ul class="notes" id="avisos" aria-live="polite"></ul>' +
      '<p class="ui-sec" id="avisoEstab" hidden>O intervalo dos estabilizantes é uma estimativa para as gomas clássicas. A quantidade deve ser testada.</p>' +
    '</section>' +
    // Notas sobre o cálculo (recolhível)
    '<section class="ui-cartao ui-vidro"><details class="calc-dobra"><summary><h2>Notas sobre o cálculo</h2><span class="calc-seta" aria-hidden="true">' + icone("baixo") + '</span></summary>' +
      '<div class="calc-notas">' +
      '<p>As faixas de balanceamento vêm das referências do Ice Cream Lab e valem como ponto de partida: autores e escolas divergem um pouco.</p>' +
      '<p>PAC e POD aparecem por quilo de mistura. A lactose entra na conta automaticamente, como 54,5% dos sólidos lácteos e 76,5% dos sólidos de soro. Os coeficientes valem só para a parte do ingrediente que é açúcar, e a dextrose em pó já entra com os 92% de sólidos da forma mono-hidratada.</p>' +
      '<p>Na glucose em pó e na maltodextrina, todos os sólidos entram como açúcar, com um coeficiente baixo que já embute a mistura de sacarídeos.</p>' +
      '<p>O ponto de congelamento soma os equivalentes de sacarose, lidos na curva de soluções de sacarose de Leighton, e os sais do leite, que valem (sólidos lácteos + soro) × 2,37 ÷ água. A faixa de −3,0 a −2,75 °C é a de um creme que serve bem entre −10 e −14 °C. Num freezer doméstico a −18 °C nenhuma receita comum cai nessa faixa; tire o pote alguns minutos antes de servir.</p>' +
      '<p>Ficam de fora os sólidos de chocolate e de castanhas, que endurecem ao congelar, e o overrun. Use os números para comparar receitas, não como medida absoluta.</p>' +
      '<p>A barra de estabilizantes soma os gramas das gomas como se valessem o mesmo; a faixa de 0,1 a 0,5% é a dose total de referência do Estudo. O amido fica fora da soma.</p>' +
      '<p>Esta calculadora avalia o equilíbrio da formulação, não a segurança alimentar.</p>' +
      '<p><b>Fontes</b><br>Goff, H. D.; Hartel, R. W. <i>Ice Cream</i>, 7ª ed. Springer, 2013.<br>Gelatologist, série de artigos sobre PAC, dureza e produção de gelato (Medium).<br>Clarke, C.; Cox, A. <i>The Science of Ice Cream</i>; Caviezel, L. <i>Scienza e tecnologia del gelato artigianale</i>.</p>' +
      '</div></details></section>' +
    '</div></div>' +
    // Folha de salvar (sobe de baixo)
    '<div class="ui-veu" id="veuSalvar" hidden></div>' +
    '<div class="ui-folha" id="painelSalvar" role="dialog" aria-label="Salvar receita" hidden>' +
      '<span class="puxador"></span>' +
      '<div class="acoes"><button type="button" class="ui-botao vidro" id="cancelaSalvar">Cancelar</button><button type="button" class="ui-botao preto" id="confirmaSalvar">Salvar</button></div>' +
      '<h2>Salvar receita</h2>' +
      // Com uma receita aberta: escolher entre nova versão e nova receita; um botão Salvar só.
      '<div class="ui-opcoes salvar-modo" id="modoSalvar" role="group" aria-label="Como salvar"><button type="button" data-m="versao" id="optVersao"></button><button type="button" data-m="corrige" id="optCorrige"></button><button type="button" data-m="nova">Nova receita</button></div>' +
      '<div id="campoNomeNova" hidden><label class="ui-sec" for="nomeNova" id="rotuloNomeNova">Nome da nova receita</label>' +
        '<input id="nomeNova" class="ui-campo" type="text" maxlength="60" enterkeyhint="next"></div>' +
      '<label class="ui-sec" for="notaVersao" id="rotuloNota">O que mudou? (opcional)</label>' +
      '<input id="notaVersao" class="ui-campo" type="text" maxlength="140" enterkeyhint="done" placeholder="Ex.: menos dextrose, mais creme">' +
      '<p class="ui-sec" id="avisoNome" hidden></p>' +

    '</div>';

  const elLinhas = el.querySelector("#linhas");
  let inputs = [];
  const elPeso = el.querySelector("#peso");
  const elNome = el.querySelector("#nome");
  const elAbrir = el.querySelector("#abrir") || document.createElement("button");

  // ----- Abrir: exemplos e receitas da calculadora antiga -----
  // Menu próprio (como na v1.1), no lugar do seletor do sistema.
  const elMenu = el.querySelector("#menuAbrir") || (function(){ const d = document.createElement("div"); d.innerHTML = '<div class="menu-lista"><div class="menu-rolagem"></div></div>'; return d; })();
  function desenhaAbrir(){
    function op(v, t){ return '<button type="button" class="menu-opcao" role="option" data-v="' + esc(v) + '">' + esc(t) + '</button>'; }
    let h = op("novo", "Rascunho vazio") + '<div class="menu-grupo">Exemplos</div>';
    Object.keys(PRESETS).forEach(function(k){ h += op("preset:" + k, PRESETS[k].nome); });
    if (db.receitas.length){
      h += '<div class="menu-grupo">Minhas receitas</div>';
      db.receitas.slice().sort(function(a, b){ return a.nome.localeCompare(b.nome); }).forEach(function(r){
        h += op("rec:" + r.id, r.nome + (r.status === "final" ? " ✓" : ""));
      });
    }
    elMenu.querySelector(".menu-rolagem").innerHTML = h;
  }
  function fechaMenu(){ elMenu.classList.remove("aberto"); elAbrir.setAttribute("aria-expanded", "false"); }
  elAbrir.addEventListener("click", function(){
    const ab = elMenu.classList.toggle("aberto");
    elAbrir.setAttribute("aria-expanded", String(ab));
  });
  function foraDoMenu(ev){ if (!elMenu.contains(ev.target)) fechaMenu(); }
  function escMenu(ev){ if (ev.key === "Escape") fechaMenu(); }
  document.addEventListener("pointerdown", foraDoMenu);
  document.addEventListener("keydown", escMenu);
  elMenu.querySelector(".menu-lista").addEventListener("click", async function(ev){
    const b = ev.target.closest(".menu-opcao"); if (!b) return;
    fechaMenu();
    const v = b.dataset.v;
    if (mudou() && !(await confirma("Há mudanças não salvas neste rascunho. Abrir outro mesmo assim?", "Abrir"))) return;
    if (v.indexOf("rec:") === 0){
      const vs = versoesDe(v.slice(4));
      if (vs.length) carregaVersao(vs[vs.length - 1]);
    } else {
      delete calc.receitaId; delete calc.versaoId; delete calc.snapshot; delete calc.preparo;
      if (v === "novo"){ calc.linhas = []; calc.nome = ""; }
      else {
        const p = PRESETS[v.slice(7)];
        calc.estilo = p.estilo; calc.nome = p.nome; calc.linhas = JSON.parse(JSON.stringify(p.linhas));
        if (p.preparo) calc.preparo = p.preparo;   // vai para a receita quando ela for criada
      }
    }
    persiste(); desenhaTudo();
  });

  // O nome aqui é o do rascunho. Ele só renomeia algo quando vira uma receita nova;
  // para renomear uma receita existente, use a página dela.
  // Nome em várias linhas (nome longo não corta): cresce com o texto; Enter só confirma.
  // Largura do campo = largura do texto (o lápis fica logo depois do nome); quebra linha se passar do espaço.
  const medida = document.createElement("span"); medida.className = "calc-nome-medida"; elNome.parentNode.appendChild(medida);
  function alturaNome(){
    medida.textContent = elNome.value || elNome.placeholder;
    const max = elNome.parentNode.clientWidth - 30;
    elNome.style.width = Math.min(max, Math.ceil(medida.getBoundingClientRect().width) + 4) + "px";
    elNome.style.height = "auto"; elNome.style.height = elNome.scrollHeight + "px";
  }
  elNome.addEventListener("input", function(){ elNome.value = elNome.value.replace(/\n/g, " "); calc.nome = elNome.value; alturaNome(); persiste(); });
  elNome.addEventListener("keydown", function(ev){ if (ev.key === "Enter"){ ev.preventDefault(); elNome.blur(); } });

  // ----- Salvar: cria a receita (v1) ou uma nova versão -----
  const elPainel = el.querySelector("#painelSalvar"), elNota = el.querySelector("#notaVersao");
  function proximoNumero(){
    const vs = calc.receitaId ? versoesDe(calc.receitaId) : [];
    return vs.length ? vs[vs.length - 1].numero + 1 : 1;
  }
  // Painel de salvar. Com uma receita aberta, há dois caminhos:
  //   "Salvar vN" (nova versão da mesma receita) ou "Salvar como nova receita" (com outro nome, v1).
  const elNomeNova = el.querySelector("#nomeNova"), elCampoNova = el.querySelector("#campoNomeNova");
  const elConfirma = el.querySelector("#confirmaSalvar");
  const elAvisoNome = el.querySelector("#avisoNome");
  let modoNova = false, modoCorrige = false;
  function abrePainel(nova, corrige){
    const r = calc.receitaId && receita(calc.receitaId);
    const vAberta = r && calc.versaoId && versao(calc.versaoId);
    modoNova = nova || !r;
    const eraCorrige = modoCorrige;
    modoCorrige = !modoNova && !!corrige && !!vAberta;
    // Nome sempre editável na folha quando cria receita (rascunho ou variação).
    elCampoNova.hidden = !modoNova;
    el.querySelector("#rotuloNomeNova").textContent = r ? "Nome da nova receita" : "Nome da receita";
    if (modoNova && r){
      const nome = calc.nome.trim();
      elNomeNova.value = nome && nome !== r.nome ? nome : r.nome + " (variação)";
    } else if (modoNova && elPainel.hidden) elNomeNova.value = calc.nome.trim();
    if (elPainel.hidden) elNota.value = calc.notaSugerida || "";
    if (modoCorrige && !eraCorrige) elNota.value = vAberta.nota || "";
    else if (!modoCorrige && eraCorrige) elNota.value = calc.notaSugerida || "";
    el.querySelector("#rotuloNota").textContent = modoNova ? "Nota da v1 (opcional)" : modoCorrige ? "Nota da v" + vAberta.numero + " (opcional)" : "O que mudou? (opcional)";
    elConfirma.textContent = "Salvar";
    elConfirma.hidden = false;
    const elModo = el.querySelector("#modoSalvar");
    elModo.hidden = !r;
    if (r){
      el.querySelector("#optVersao").textContent = "Nova v" + proximoNumero();
      const oc = el.querySelector("#optCorrige"); oc.hidden = !vAberta; if (vAberta) oc.textContent = "Corrigir v" + vAberta.numero;
      const atual = modoNova ? "nova" : modoCorrige ? "corrige" : "versao";
      elModo.querySelectorAll("[data-m]").forEach(function(b){ b.setAttribute("aria-pressed", String(b.dataset.m === atual)); });
    }
    elAvisoNome.hidden = true;
    elPainel.hidden = false; el.querySelector("#veuSalvar").hidden = false;
    if (modoNova && r){ elNomeNova.focus(); elNomeNova.select(); }
  }
  el.querySelector("#lapisNome").addEventListener("click", function(){ elNome.focus(); const t = elNome.value.length; elNome.setSelectionRange(t, t); });
  el.querySelector("#salvar").addEventListener("click", function(){
    if (!calc.linhas.length) return;
    // Se o nome foi trocado (ex.: abriu "Gelato de baunilha" e escreveu "Gelato de menta"),
    // o Salvar já propõe criar a receita nova com esse nome.
    const r = calc.receitaId && receita(calc.receitaId);
    abrePainel(!!(r && calc.nome.trim() && calc.nome.trim() !== r.nome), padraoCorrige);
  });
  el.querySelectorAll("#modoSalvar [data-m]").forEach(function(b){ b.addEventListener("click", function(){ abrePainel(b.dataset.m === "nova", b.dataset.m === "corrige"); }); });
  function fechaPainel(){ elPainel.hidden = true; el.querySelector("#veuSalvar").hidden = true; }
  el.querySelector("#cancelaSalvar").addEventListener("click", fechaPainel);
  el.querySelector("#veuSalvar").addEventListener("click", fechaPainel);
  elNota.addEventListener("keydown", function(ev){ if (ev.key === "Enter"){ ev.preventDefault(); elConfirma.click(); } });
  elNomeNova.addEventListener("keydown", function(ev){ if (ev.key === "Enter"){ ev.preventDefault(); elNota.focus(); } });
  elConfirma.addEventListener("click", function(){
    let r = calc.receitaId && receita(calc.receitaId);
    // Corrigir: reescreve a versão aberta no lugar, sem criar outra.
    const vc = modoCorrige && calc.versaoId && versao(calc.versaoId);
    if (vc){
      vc.linhas = calc.linhas.map(function(l){ return {id:l.id, g:Number(l.g) || 0}; });
      vc.estilo = calc.estilo; vc.nota = elNota.value.trim();
      vc.snapshot = snapshotDe(vc.linhas, calc.snapshot);
      vc.editada = new Date().toISOString();
      r.estilo = calc.estilo;
      delete calc.snapshot; delete calc.notaSugerida;
      modoCorrige = false; fechaPainel(); persiste(); desenhaTudo();
      desenhaEstado("v" + vc.numero + " corrigida.");
      return;
    }
    if (modoNova){
      const nome = elNomeNova.value.trim() || calc.nome.trim() || "Receita sem nome";
      if (r && !elNomeNova.value.trim()){ elNomeNova.focus(); return; }
      r = criaReceita(nome, calc.estilo, calc.ideiaId || null);
      if (calc.preparo && !r.preparo) r.preparo = calc.preparo;
      delete calc.preparo;
      // Se o rascunho começou numa ideia, a ideia passa a apontar para a receita.
      const id = calc.ideiaId && db.ideias.find(function(x){ return x.id === calc.ideiaId; });
      if (id) id.receitaId = r.id;
      delete calc.ideiaId;
    }
    calc.nome = r.nome;   // versão da base mantém o nome da base; receita nova usa o nome escolhido
    const v = novaVersao(r.id, calc.linhas, calc.estilo, elNota.value.trim(), calc.snapshot);
    calc.receitaId = r.id; calc.versaoId = v.id; delete calc.snapshot; delete calc.notaSugerida;
    fechaPainel();
    persiste(); desenhaTudo();
    desenhaEstado(modoNova ? "Receita “" + r.nome + "” criada (v1)." : "Salvo como v" + v.numero + ".");
  });

  // Linha de estado: versão aberta, status e atalho para a página da receita.
  const elEstado = el.querySelector("#estadoReceita");
  function desenhaEstado(msg){
    const r = calc.receitaId && receita(calc.receitaId), v = calc.versaoId && versao(calc.versaoId);
    let h = "";
    if (r && v){
      h = mudou() ? 'a partir da v' + v.numero + ' · <span class="nao-salvo">salvar cria a v' + proximoNumero() + '</span>' : 'v' + v.numero + ' · ' + r.status;
    } else if (calc.linhas.length){
      h = 'Rascunho não salvo como receita';
    }
    if (msg) h = '<b>' + esc(msg) + '</b> ' + h;
    elEstado.innerHTML = h;
    // Atalho para a página da receita (versões e lotes), como pílula ao lado de Salvar e Abrir.
    const ir = el.querySelector("#irReceita");
    ir.hidden = !(r && v) || !!daReceita;   // vindo da receita, o voltar já leva até ela
    if (r) ir.href = "#/receita/" + encodeURIComponent(r.id);
    // Receita existente: o cartão do nome ganha a capa dela (degradê ou foto), com texto branco.
    // Receita existente: a capa vira o fundo da página; o cartão do nome fica em vidro escuro (texto branco)
    // e os outros cartões em vidro branco, para o texto escuro continuar legível sobre a cor.
    const card = el.querySelector(".calc-nome"), fundo = el.querySelector("#calcFundo");
    // Rascunho também fica sobre um degradê (grafite neutro), para a tela ter o mesmo visual da receita.
    card.classList.add("com-capa", "ui-vidro-escuro"); card.classList.remove("ui-vidro");
    fundo.style.setProperty("--capa", r ? capa(r.nome, r.capa) : FUNDO_RASCUNHO);
    if (r) aplicaTom(el, r.nome, r.capa); else el.style.setProperty("--ui-tom", "rgba(203,206,216,.42)");   // rascunho: tom claro do Neutro 2
    document.body.classList.add("calc-capa");
    el.querySelector("#lapisNome").hidden = !!r;   // lápis só no rascunho
    el.querySelector("#salvar").textContent = r ? "Atualizar" : "Salvar";   // receita aberta: atualizar (nova versão)
    ir.classList.add("vidro-escuro"); ir.classList.remove("vidro");
  }

  // Aviso de ingrediente atualizado depois da versão.
  const elSnap = el.querySelector("#avisoSnap");
  function desenhaSnap(){
    const v = calc.versaoId && versao(calc.versaoId);
    if (!calc.snapshot || !v){ elSnap.hidden = true; return; }
    const ids = ingredientesMudados(calc.snapshot).filter(function(id){ return calc.linhas.some(function(l){ return l.id === id; }); });
    if (!ids.length){ delete calc.snapshot; elSnap.hidden = true; return; }
    const nomes = ids.map(function(id){ return (ingrediente(id) || calc.snapshot[id]).nome; });
    elSnap.innerHTML = '<p><b>' + (ids.length > 1 ? "Estes ingredientes foram atualizados" : "Este ingrediente foi atualizado") +
      ' depois da v' + v.numero + ':</b> ' + esc(nomes.join(", ")) + '.</p>' +
      '<p class="ui-sec">Os números abaixo usam a composição de quando a versão foi salva.</p>' +
      '<button type="button" class="ui-botao preto largo" id="recalcular">Recalcular com os valores atuais</button>';
    elSnap.hidden = false;
    elSnap.querySelector("#recalcular").addEventListener("click", function(){
      delete calc.snapshot; persiste(); desenhaTudo();
    });
  }

  // ----- Estilo -----
  el.querySelector("#estilo").addEventListener("click", function(ev){
    const b = ev.target.closest("button"); if (!b) return;
    calc.estilo = b.dataset.estilo; persiste(); desenhaEstilo(); atualiza();
  });
  function desenhaEstilo(){
    el.querySelectorAll("#estilo button").forEach(function(b){
      b.setAttribute("aria-pressed", String(b.dataset.estilo === calc.estilo));
    });
  }

  // ----- Linhas de ingrediente -----
  function desenhaLinhas(){
    // Contados por unidade (fava) ficam no fim da lista: não fazem parte do peso da mistura.
    const unid = function(l){ return porUnidade(ingrediente(l.id)) ? 1 : 0; };
    calc.linhas.sort(function(a, b){ return unid(a) - unid(b); });
    elLinhas.innerHTML = ""; inputs = [];
    calc.linhas.forEach(function(l, idx){
      const ing = comp(l.id);
      const row = document.createElement("div");
      row.className = "linha";
      row.innerHTML =
        (ing && ing.nota ? '<button type="button" class="nome-ing com-nota" aria-expanded="false">' + esc(nomeIng(l.id)) + '<span class="info" aria-hidden="true">i</span></button>' :
          '<span class="nome-ing' + (ing ? '' : ' removido') + '">' + esc(nomeIng(l.id)) + '</span>') +
        '<div class="qtd"><button type="button" class="passo" data-dir="-1" aria-label="Diminuir">−</button>' +
        '<label class="campo-g"><input type="number" inputmode="decimal" min="0" step="' + (porUnidade(ingrediente(l.id)) ? passoUn(ingrediente(l.id)) : '1') + '" aria-label="Gramas"><span aria-hidden="true">' + (porUnidade(ingrediente(l.id)) ? 'un' : 'g') + '</span></label>' +
        '<button type="button" class="passo" data-dir="1" aria-label="Aumentar">+</button></div>' +
        '<button type="button" class="remover" aria-label="Remover ingrediente">×</button>' +
        (ing && ing.nota ? '<p class="nota-ing muted pequeno" hidden>' + esc(ing.nota) + '</p>' : "");
      const btNota = row.querySelector(".com-nota");
      if (btNota) btNota.addEventListener("click", function(){
        const nota = row.querySelector(".nota-ing"); nota.hidden = !nota.hidden;
        btNota.setAttribute("aria-expanded", String(!nota.hidden));
      });
      const inp = row.querySelector("input");
      const ingU = ingrediente(l.id) || ing;   // unidade vem do ingrediente atual (mesmo com versão antiga aberta)
      const un = porUnidade(ingU);   // contado por unidade: o campo mostra unidades (de ½ em ½), a conta segue em gramas
      inp.value = un ? unidades(ingU, l.g) : l.g;
      inp.setAttribute("aria-label", (un ? "Unidades de " : "Gramas de ") + (ing ? ing.nome : "ingrediente"));
      inp.addEventListener("input", function(){ const v = inp.value === "" ? 0 : Number(inp.value); l.g = un ? Math.round(v / passoUn(ingU)) * passoUn(ingU) * ingU.gUn : v; atualiza(); });
      row.querySelector(".remover").addEventListener("click", function(){ calc.linhas.splice(idx, 1); desenhaLinhas(); atualiza(); });
      row.querySelectorAll(".passo").forEach(function(b){
        b.addEventListener("click", function(){
          const dir = Number(b.dataset.dir), atual = Number(l.g) || 0;
          if (un){ const u = Math.max(0, unidades(ingU, atual) + dir * passoUn(ingU)); l.g = u * ingU.gUn; inp.value = u; atualiza(); return; }
          const passo = passoDe(dir > 0 ? atual + 0.01 : atual - 0.01);
          l.g = Math.max(0, Math.round((atual + dir * passo) * 10) / 10);
          inp.value = l.g; atualiza();
        });
      });
      inputs[idx] = inp;
      elLinhas.appendChild(row);
    });
    el.querySelector("#vazio").hidden = calc.linhas.length > 0;
  }

  // Ingrediente por unidade: ao escalar, arredonda para meia unidade.
  function arredondaUn(l){ const i = ingrediente(l.id); if (porUnidade(i)) l.g = unidades(i, l.g) * i.gUn; }
  function valorCampo(l){ const i = ingrediente(l.id); return porUnidade(i) ? unidades(i, l.g) : l.g; }

  // O × de remover só aparece quando se pede: "remover ingredientes" liga, "concluir" desliga.
  const elCartao = el.querySelector("#ingredientes");
  const elModo = el.querySelector("#modoExcluir");
  elModo.addEventListener("click", function(){
    const ligado = elCartao.classList.toggle("modo-excluir");
    elModo.textContent = ligado ? "Concluir" : "Excluir";
    elModo.classList.toggle("concluir", ligado);   // Concluir em destaque (branco)
  });

  // "+ ingrediente" abre uma lista para escolher, com busca. O escolhido entra com 0 g
  // e o campo de gramas já fica pronto para digitar.
  const elEscolha = document.createElement("div");
  elEscolha.className = "escolha"; elEscolha.hidden = true;
  elEscolha.setAttribute("role", "dialog"); elEscolha.setAttribute("aria-label", "Escolher ingrediente");
  elEscolha.innerHTML =
    '<div class="escolha-topo"><input type="search" class="ui-campo" placeholder="Buscar ingrediente" aria-label="Buscar ingrediente">' +
    '<button type="button" class="ui-botao vidro" data-fechar>Cancelar</button></div>' +
    '<div class="escolha-lista"></div>' +
    '<a class="ui-botao vidro escolha-novo" href="#/ingredientes/novo">+ novo ingrediente</a>';
  document.body.appendChild(elEscolha);
  const elBusca = elEscolha.querySelector("input");
  function semAcento(t){ return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
  function desenhaEscolha(){
    const q = semAcento(elBusca.value.trim());
    const usados = calc.linhas.map(function(l){ return l.id; });
    const lista = db.ingredientes.filter(function(i){ return !q || semAcento(i.nome + " " + (i.longo || "")).indexOf(q) >= 0; });
    function item(i){
      return '<button type="button" class="escolha-item" data-id="' + esc(i.id) + '">' + esc(i.nome) +
        (usados.indexOf(i.id) >= 0 ? '<span class="muted pequeno">na receita</span>' : '') + '</button>';
    }
    const comuns = lista.filter(function(i){ return !i.estab; }), est = lista.filter(function(i){ return i.estab; });
    elEscolha.querySelector(".escolha-lista").innerHTML =
      comuns.map(item).join("") +
      (est.length ? '<p class="escolha-grupo muted pequeno">Estabilizantes</p>' + est.map(item).join("") : "") +
      (lista.length ? "" : '<p class="muted">Nenhum ingrediente com esse nome.</p>');
  }
  function abreEscolha(){ elBusca.value = ""; desenhaEscolha(); elEscolha.hidden = false; document.body.classList.add("travado"); }
  function fechaEscolha(){ elEscolha.hidden = true; document.body.classList.remove("travado"); }
  elBusca.addEventListener("input", desenhaEscolha);
  elEscolha.addEventListener("click", function(ev){
    if (ev.target.closest("[data-fechar]")) return fechaEscolha();
    const b = ev.target.closest(".escolha-item"); if (!b) return;
    fechaEscolha();
    const nova = {id:b.dataset.id, g:0};
    calc.linhas.push(nova);
    desenhaLinhas(); atualiza();
    // A lista é reordenada (contados por unidade vão para o fim): foca o campo da linha nova, não o último.
    const ult = inputs[calc.linhas.indexOf(nova)];
    if (ult){ ult.focus(); ult.select(); }
  });
  el.querySelector("#adicionar").addEventListener("click", abreEscolha);

  // ----- Peso total: reescala a receita -----
  let base = null;
  elPeso.addEventListener("focus", function(){
    const total = calcula(calc.linhas, comp).peso;
    base = total > 0 ? {total:total, g:calc.linhas.map(function(l){ return l.g; })} : null;
  });
  elPeso.addEventListener("input", function(){
    if (!base) return;
    const alvo = Number(elPeso.value);
    if (!isFinite(alvo) || alvo <= 0 || elPeso.value === "") return;
    const fator = alvo / base.total;
    calc.linhas.forEach(function(l, i){ l.g = Math.round(base.g[i] * fator * 10) / 10; arredondaUn(l); if (inputs[i]) inputs[i].value = valorCampo(l); });
    atualiza();
  });
  elPeso.addEventListener("blur", function(){ base = null; atualiza(); });
  el.querySelectorAll(".linha-total .passo").forEach(function(b){
    b.addEventListener("click", function(){
      const total = calcula(calc.linhas, comp).peso; if (!total) return;
      const alvo = Math.max(0, Math.round((total + Number(b.dataset.dir) * 10) / 10) * 10);
      if (!alvo) return;
      const fator = alvo / total;
      calc.linhas.forEach(function(l, i){ l.g = Math.round((Number(l.g) || 0) * fator * 10) / 10; arredondaUn(l); if (inputs[i]) inputs[i].value = valorCampo(l); });
      atualiza();
    });
  });

  // Animações da v1.1: marcadores e faixas deslizam da posição anterior para a nova.
  function reduzMov(){ return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
  const CURVA = {duration:420, easing:"cubic-bezier(.22,1,.36,1)"};
  function capturaMarcadores(elM){
    return Array.prototype.map.call(elM.querySelectorAll(".bar .mark"), function(m){
      return parseFloat(m.style.left.replace("calc(", "")) || 0;
    });
  }
  function capturaFaixas(elM){
    return Array.prototype.map.call(elM.querySelectorAll(".bar .band"), function(b){
      return {left:parseFloat(b.style.left) || 0, width:parseFloat(b.style.width) || 0};
    });
  }
  function animaMarcadores(elM, ant){
    if (!ant || reduzMov()) return;
    Array.prototype.forEach.call(elM.querySelectorAll(".bar .mark"), function(m, i){
      const nova = parseFloat(m.style.left.replace("calc(", "")) || 0, antiga = ant[i];
      if (!Number.isFinite(antiga) || Math.abs(nova - antiga) < .02 || !m.animate) return;
      const largura = m.parentElement.getBoundingClientRect().width; if (!largura) return;
      const delta = (antiga - nova) / 100 * largura;
      m.animate([{transform:"translateX(" + delta + "px)"}, {transform:"translateX(0)"}], CURVA);
    });
  }
  function animaFaixas(elM, ant){
    if (!ant || reduzMov()) return;
    Array.prototype.forEach.call(elM.querySelectorAll(".bar .band"), function(b, i){
      const a = ant[i]; if (!a || !b.animate) return;
      const nl = parseFloat(b.style.left) || 0, nw = parseFloat(b.style.width) || 0;
      if (Math.abs(nl - a.left) < .02 && Math.abs(nw - a.width) < .02) return;
      b.animate([{left:a.left + "%", width:a.width + "%"}, {left:nl + "%", width:nw + "%"}], CURVA);
      Array.prototype.forEach.call(b.parentElement.querySelectorAll(".range-label"), function(lg, idx){
        if (!lg.animate) return;
        lg.animate([{left:(a.left + (idx ? a.width : 0)) + "%"}, {left:(nl + (idx ? nw : 0)) + "%"}], CURVA);
      });
    });
  }

  // ----- Resultado -----
  function atualiza(){
    const r = calcula(calc.linhas, comp);
    const alvo = ALVOS[calc.estilo], est = calc.estilo;
    if (document.activeElement !== elPeso) elPeso.value = Math.round(r.peso * 10) / 10;
    const elM = el.querySelector("#metricas"), elA = el.querySelector("#avisos");
    if (!r.peso){
      elM.innerHTML = '<p class="muted">A composição aparece aqui assim que a receita tiver algum ingrediente com quantidade.</p>';
      elA.innerHTML = ""; el.querySelector("#avisoEstab").hidden = true;
      persiste(); return;
    }
    const fp = pontoCongelamento(r);
    const antM = capturaMarcadores(elM), antF = capturaFaixas(elM);
    elM.innerHTML =
      metrica("Gordura", r.gord, alvo.gord, ESCALA.gord, "%", 1, est) +
      metrica("Sólidos lácteos (SLNG)", r.slng + r.soro, alvo.slng, ESCALA.slng, "%", 1, est) +
      metrica("Açúcares", r.ac, alvo.ac, ESCALA.ac, "%", 1, est) +
      metrica("Sólidos totais", r.sol, alvo.sol, ESCALA.sol, "%", 1, est) +
      metrica("POD (doçura)", r.pod, alvo.pod, ESCALA.pod, "", 0, est) +
      metrica("PAC (maciez)", r.pac, alvo.pac, ESCALA.pac, "", 0, est) +
      (r.estab > 0 ? metrica("Estabilizantes", r.estab, ALVO_ESTAB, [0, 1], "%", 2, est) : "") +
      (fp === null ? "" : metrica("Ponto de congelamento", fp, ALVO_FP, ESCALA.fp, " °C", 2, est)) +
      // Água = 100% − sólidos totais: a faixa ideal é o espelho da faixa de sólidos.
      metrica("Água na mistura", r.agua, [100 - alvo.sol[1], 100 - alvo.sol[0]], [100 - ESCALA.sol[1], 100 - ESCALA.sol[0]], "%", 1, est);
    animaMarcadores(elM, antM); animaFaixas(elM, antF);
    el.querySelector("#avisoEstab").hidden = !(r.estab > 0);
    elA.innerHTML = "";
    avisos(r, est).forEach(function(a){
      const li = document.createElement("li");
      li.className = "status-" + a.nivel; li.textContent = a.txt;
      elA.appendChild(li);
    });
    persiste();
  }

  elEstadoPronto = true;
  function desenhaTudo(){
    elNome.value = calc.nome || ""; alturaNome();
    desenhaAbrir(); desenhaEstilo(); desenhaLinhas(); desenhaSnap(); atualiza();
  }
  desenhaTudo();

  // A Calculadora também abre com a subida dos cartões (cada vidro aparece aos poucos enquanto o iPhone
  // termina de calcular o desfoque, escondendo o cinza dos primeiros quadros).
  const elTela = document.getElementById("tela");
  if (elTela && !elTela.classList.contains("prepara")){
    elTela.classList.remove("sobe"); void elTela.offsetWidth; elTela.classList.add("sobe");
    setTimeout(function(){ elTela.classList.remove("sobe"); }, 900);
  }
  return {titulo:"Calculadora", limpa:function(){ document.body.classList.remove("ui", "calcui", "calc-capa"); salva(); document.removeEventListener("pointerdown", foraDoMenu); document.removeEventListener("keydown", escMenu); elEscolha.remove(); document.body.classList.remove("travado"); }};
}
