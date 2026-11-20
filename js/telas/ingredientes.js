// Ingredientes: lista editável. O que é editado aqui aparece no seletor da calculadora.
import { dados, salva, ingrediente, ingredienteUsado, novoId } from "../dados.js?v=20261120183752";
import { confirma } from "../ui.js?v=20261120183752";
import { icone, capa, aplicaTom, escolheCapa } from "../visual.js?v=20261120183752";
import { TIPOS_ACUCAR } from "../ingredientes-base.js?v=20261120183752";
import { n } from "../calculo.js?v=20261120183752";

function limpaUi(){ document.body.classList.remove("ui", "rec"); document.querySelectorAll(".ui-veu,.ui-folha").forEach(function(x){ x.remove(); }); }
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

// Partes da composição, na ordem da barra (cores tiradas dos degradês).
const PARTES = [
  {k:"gord", nome:"Gordura", cor:"#FFBE3C"},
  {k:"slng", nome:"SLNG", cor:"#FFFFFF"},
  {k:"soro", nome:"Soro", cor:"#A2D8EB"},
  {k:"ac", nome:"Açúcares", cor:"#F6A4B1"},
  {k:"outros", nome:"Outros", cor:"#A5A0CE"},
  {k:"agua", nome:"Água", cor:"rgba(255,255,255,.22)"}
];
function partes(i){
  return PARTES.map(function(p){
    const v = p.k === "ac" ? totalAcucar(i) : p.k === "agua" ? Math.max(0, agua(i)) : (i[p.k] || 0);
    return {k:p.k, nome:p.nome, cor:p.cor, v:v};
  });
}
function barra(i, pequena){
  return '<span class="ing-barra' + (pequena ? ' pequena' : '') + '" aria-hidden="true">' + partes(i).filter(function(p){ return p.v > 0; }).map(function(p){
    return '<span style="flex:' + p.v + ';background:' + p.cor + '"></span>'; }).join("") + '</span>';
}

let buscaIng = "", catIng = "";
// Categoria deduzida da composição (não precisa marcar nada no ingrediente).
const CATEGORIAS = [["", "Todos"], ["lacteos", "Lácteos"], ["acucares", "Açúcares"], ["frutas", "Frutas"], ["cacau", "Cacau"], ["castanhas", "Castanhas"], ["aromas", "Aromas"], ["estab", "Estabilizantes"], ["outros", "Outros"]];
function categoria(i){
  if (i.estab) return "estab";
  if (/^(ess|hortela|casca)/.test(i.id) || /\b(essência|extrato|aroma|hortelã|raspas?)\b/i.test(i.nome || "")) return "aromas";
  if (/^(cacau|choco|callebaut)/.test(i.id) || /(cacau|chocolate|callebaut)/i.test(i.nome || "")) return "cacau";
  if (/^pasta$/.test(i.id) || /(castanha|amêndoa|amendoa|avelã|avela|pistache|nozes|amendoim)/i.test(i.nome || "")) return "castanhas";
  if (/^(polpa|suco|casca)/.test(i.id) || /^(coco|leiteCoco|pureDoce|pureAcida)$/.test(i.id) ||
      /\b(polpa|suco|purê|fruta|coco)\b/i.test(i.nome || "")) return "frutas";
  if ((i.slng || 0) > 0 || (i.soro || 0) > 0) return "lacteos";
  if (totalAcucar(i) >= 40) return "acucares";
  return "outros";
}

// Categorias escolhidas no ingrediente (i.cats); sem escolha, vale a deduzida.
function categorias(i){
  if (Array.isArray(i.cats) && i.cats.length) return i.estab ? ["estab"].concat(i.cats) : i.cats;
  return [categoria(i)];
}
const nomeCat = function(c){ const x = CATEGORIAS.find(function(k){ return k[0] === c; }); return x ? x[1] : c; };

export function render(el, rota){
  const id = rota.args[0] ? decodeURIComponent(rota.args[0]) : "";
  if (id) return editor(el, id);
  return lista(el);
}

// Lista (redesign): grade de blocos com degradê pelo nome e a barra de composição.
function lista(el){
  document.body.classList.add("ui");
  const db = dados();
  el.innerHTML =
    '<div class="ui-app">' +
    '<header class="ui-cabecalho nav"><a class="ui-redondo" href="#/biblioteca" aria-label="Voltar para a Biblioteca">' + icone("voltar") + '</a><h1>Ingredientes</h1>' +
      '<a class="ui-redondo" href="#/ingredientes/novo" aria-label="Novo ingrediente">' + icone("mais") + '</a></header>' +
    '<div class="ui-tela">' +
      '<input id="buscaIng" class="ui-campo" type="search" placeholder="Buscar ingrediente" aria-label="Buscar ingrediente" value="' + esc(buscaIng) + '">' +
      '<div class="ui-filtros estudo-filtros" id="cats">' + CATEGORIAS.map(function(c){ return '<button type="button" class="ui-filtro" data-cat="' + c[0] + '" aria-pressed="' + (catIng === c[0]) + '">' + c[1] + '</button>'; }).join("") + '</div>' +
      '<div id="grade"></div>' +
    '</div></div>';
  const norm = function(t){ return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
  function bloco(i){
    return '<a class="ui-bloco pequeno ing-bloco" href="#/ingredientes/' + encodeURIComponent(i.id) + '" style="--capa:' + capa(i.nome, i.capa) + '">' +
      '<span class="titulo">' + esc(i.nome) + '</span></a>';
  }
  function desenha(){
    const q = norm(buscaIng.trim());
    const ok = function(i){ return !q || norm(i.nome).indexOf(q) >= 0 || norm(i.longo).indexOf(q) >= 0; };
    const itens = db.ingredientes.filter(function(i){ return ok(i) && (!catIng || categorias(i).indexOf(catIng) >= 0); });
    itens.sort(function(a, b){ return String(a.nome).localeCompare(String(b.nome), "pt", {sensitivity:"base"}); });   // ordem alfabética
    el.querySelector("#grade").innerHTML = itens.length ? '<div class="ing-grade tres">' + itens.map(bloco).join("") + '</div>' :
      '<p class="ui-sec ideias-vazio">' + (buscaIng.trim() ? 'Nada encontrado para “' + esc(buscaIng.trim()) + '”.' : 'Nenhum ingrediente nesta categoria.') + '</p>';
  }
  el.querySelectorAll("#cats [data-cat]").forEach(function(b){ b.addEventListener("click", function(){
    catIng = b.dataset.cat; el.querySelectorAll("#cats [data-cat]").forEach(function(o){ o.setAttribute("aria-pressed", String(o === b)); }); desenha();
  }); });
  el.querySelector("#buscaIng").addEventListener("input", function(ev){ buscaIng = ev.target.value; desenha(); });
  desenha();
  return {titulo:"Ingredientes", voltar:"#/biblioteca", voltarRotulo:"Biblioteca", limpa:limpaUi};
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

  function mostra(){
    document.body.classList.add("ui", "rec");
    const ac = ing.ac || {};
    const acucares = TIPOS_ACUCAR.filter(function(t){ return ac[t[0]]; });
    const linha = function(cor, rotulo, valor){ return '<div class="ui-linha"><span class="ing-legenda">' + (cor ? '<i style="background:' + cor + '"></i>' : '') + rotulo + '</span><b class="ui-num">' + valor + '</b></div>'; };
    el.innerHTML =
      '<div class="rec-fundo" style="--capa:' + capa(ing.nome, ing.capa) + '"></div>' +
      '<div class="ui-app">' +
      '<header class="ui-cabecalho nav"><a class="ui-redondo escuro" href="#/ingredientes" aria-label="Voltar para Ingredientes">' + icone("voltar") + '</a>' +
        '<span style="flex:1"></span><button class="ui-redondo escuro" type="button" id="opcoes" aria-label="Mais opções">' + icone("opcoes") + '</button></header>' +
      '<div class="ui-tela rec-tela">' +
        '<section class="ui-cartao ui-vidro-escuro rec-painel">' +
          '<div class="rec-etiquetas">' + categorias(ing).map(function(c){ return '<span class="ui-etiqueta">' + nomeCat(c) + (c === "estab" && ing.contaTotal === false ? ' · fora da soma' : '') + '</span>'; }).join("") + '</div>' +
          '<h1 class="rec-nome">' + esc(ing.nome || "Ingrediente sem nome") + '</h1>' +
          (ing.longo ? '<p class="ui-sec">' + esc(ing.longo) + '</p>' : '') +
        '</section>' +
        '<section class="ui-cartao ui-vidro-escuro rec-painel">' +
          '<div class="rec-cab"><h2>Composição</h2><span class="ui-sec">g por 100 g</span></div>' +
          barra(ing) +
          '<div class="ui-linhas">' + partes(ing).map(function(p){
            if (p.k === "ac") return acucares.length ? acucares.map(function(t, j){ return linha(j ? '' : p.cor, (j ? '' : '') + 'Açúcar · ' + t[1].toLowerCase(), n(ac[t[0]], 1) + ' g'); }).join("") : linha(p.cor, 'Açúcares', '0 g');
            const nomes = {gord:"Gordura", slng:"SLNG (sólidos lácteos)", soro:"Sólidos de soro", outros:"Outros sólidos", agua:"Água"};
            return linha(p.cor, nomes[p.k], n(p.v, 1) + ' g');
          }).join("") + '</div>' +
          (ing.nota ? '<p class="ui-sec">' + esc(ing.nota) + '</p>' : '') +
        '</section>' +
      '</div></div>';
    aplicaTom(el, ing.nome, ing.capa);
    el.querySelector("#opcoes").addEventListener("click", function(){
      const veu = document.createElement("div"); veu.className = "ui-veu";
      const f = document.createElement("div"); f.className = "ui-folha"; f.setAttribute("role", "dialog"); f.setAttribute("aria-label", "Opções do ingrediente");
      f.innerHTML = '<span class="puxador"></span><h2>' + esc(ing.nome) + '</h2>' +
        '<div class="ideia-acoes"><button type="button" class="ui-botao vidro" id="editar">Editar composição</button>' +
          '<button type="button" class="ui-botao vidro ideia-capa-bt" id="trocaCapa" aria-label="Trocar capa">' + icone("imagem") + '</button></div>' +
        '<button type="button" class="ui-botao vidro largo perigo" id="excluir">Excluir ingrediente</button>' +
        '<button type="button" class="ui-botao preto largo" id="fechar">Fechar</button>';
      document.body.append(veu, f);
      const fecha = function(){ veu.remove(); f.remove(); };
      veu.addEventListener("click", fecha); f.querySelector("#fechar").addEventListener("click", fecha);
      f.querySelector("#editar").addEventListener("click", function(){ fecha(); edita(JSON.parse(JSON.stringify(ing))); });
      f.querySelector("#excluir").addEventListener("click", function(){ fecha(); exclui(); });
      f.querySelector("#trocaCapa").addEventListener("click", function(){
        fecha();
        const antes = ing.capa;
        escolheCapa({titulo:"Capa", semente:ing.nome, atual:ing.capa || "", foto:true, aoEscolher:function(valor){
          if (valor) ing.capa = valor; else delete ing.capa;
          if (!salva()){ if (antes) ing.capa = antes; else delete ing.capa; alert("A foto é grande demais para guardar. Tente outra."); }
          mostra();
        }});
      });
    });
  }

  async function exclui(){
    const aviso = ingredienteUsado(ing.id) ?
      "Este ingrediente está no rascunho da calculadora. Excluir mesmo assim? A linha fica marcada como “ingrediente removido”." :
      "Excluir “" + (ing.nome || "sem nome") + "”?";
    if (!(await confirma(aviso, "Excluir", true))) return;
    db.ingredientes = db.ingredientes.filter(function(x){ return x !== ing; });
    salva(); location.hash = "#/ingredientes";
  }

  function edita(rasc){
    rasc.ac = rasc.ac || {};
    document.body.classList.remove("rec"); document.body.classList.add("ui");
    const selCats = Array.isArray(rasc.cats) ? rasc.cats.slice() : (novo ? [] : categorias(rasc).filter(function(c){ return c !== "estab"; }));
    function campo(chave, rotulo, valor){
      return '<label class="ui-linha ing-campo"><span>' + rotulo + '</span><span class="ing-num"><input type="number" inputmode="decimal" min="0" max="100" step="0.1" data-k="' + chave + '" value="' + (valor || "") + '" placeholder="0"><span>g</span></span></label>';
    }
    el.innerHTML =
      '<div class="ui-app">' +
      '<header class="ui-cabecalho nav"><button class="ui-redondo" type="button" id="fecharEd" aria-label="Cancelar">' + icone("fechar") + '</button><h1>' + (novo ? 'Novo ingrediente' : 'Editar ingrediente') + '</h1></header>' +
      '<div class="ui-tela">' +
        '<section class="ui-cartao ui-vidro ideia-form-claro">' +
          '<label class="ui-rotulo" for="nomeIng">Nome</label><input id="nomeIng" type="text" class="ui-campo campo-branco" data-k="nome" maxlength="60" value="' + esc(rasc.nome) + '" placeholder="Ex.: Leite Piracanjuba integral">' +
          '<label class="ui-rotulo" for="longoIng">Nome completo (opcional)</label><input id="longoIng" type="text" class="ui-campo campo-branco" data-k="longo" maxlength="90" value="' + esc(rasc.longo) + '">' +
        '</section>' +
        '<section class="ui-cartao ui-vidro"><div class="estudo-cab"><h2>Categorias</h2><span class="ui-sec">uma ou mais</span></div>' +
          '<div class="ui-filtros ing-cats" id="catsEd">' + CATEGORIAS.filter(function(c){ return c[0] && c[0] !== "estab"; }).map(function(c){
            return '<button type="button" class="ui-filtro" data-catEd="' + c[0] + '" aria-pressed="' + (selCats.indexOf(c[0]) >= 0) + '">' + c[1] + '</button>'; }).join("") + '</div>' +
          '<p class="ui-sec">Sem escolha, o app deduz pela composição e pelo nome. Estabilizante se marca mais abaixo.</p></section>' +
        '<section class="ui-cartao ui-vidro"><div class="estudo-cab"><h2>Medida</h2></div>' +
          '<div class="ui-opcoes ing-medida" id="medida" role="group" aria-label="Medida"><button type="button" data-m="g" aria-pressed="' + !rasc.un + '">Gramas</button><button type="button" data-m="un" aria-pressed="' + !!rasc.un + '">Unidade</button></div>' +
          '<div id="camposUn"' + (rasc.un ? '' : ' hidden') + '>' +
            '<label class="ui-rotulo" for="unIng">Nome da unidade</label><input id="unIng" type="text" class="ui-campo campo-branco" maxlength="20" value="' + esc(rasc.un || "") + '" placeholder="fava, unidade, folha…">' +
          '</div>' +
          '<p class="ui-sec" id="txtMedida">' + (rasc.un ? 'Contado de ½ em ½. Não entra no peso nem na composição da mistura e fica sempre no fim da lista.' : 'Pesado em gramas; entra no peso e na composição.') + '</p></section>' +
        '<div id="blocoComp"' + (rasc.un ? ' hidden' : '') + '>' +
        '<section class="ui-cartao ui-vidro"><div class="estudo-cab"><h2>Composição</h2><span class="ui-sec">g por 100 g</span></div>' +
          '<div class="ui-linhas">' + campo("gord", "Gordura", rasc.gord) + campo("slng", "SLNG (sólidos lácteos)", rasc.slng) +
            campo("soro", "Sólidos de soro", rasc.soro) + campo("outros", "Outros sólidos", rasc.outros) + '</div>' +
          '<p class="ui-sec">“Outros sólidos” é tudo que não é gordura, SLNG nem açúcar: proteínas, fibras, cacau etc.</p></section>' +
        '<section class="ui-cartao ui-vidro"><div class="estudo-cab"><h2>Açúcares</h2></div>' +
          '<p class="ui-sec">Só a parte que é açúcar, por tipo. A lactose do leite entra sozinha pelo SLNG e pelo soro.</p>' +
          '<div class="ui-linhas">' + TIPOS_ACUCAR.map(function(t){ return campo("ac." + t[0], t[1], rasc.ac[t[0]]); }).join("") + '</div>' +
          '<p class="agua ing-agua" id="agua"></p></section></div>' +
        '<section class="ui-cartao ui-vidro ideia-form-claro">' +

          '<label class="ing-check"><input type="checkbox" data-k="estab"' + (rasc.estab ? " checked" : "") + '> É estabilizante</label>' +
          '<label class="ing-check" id="cxSoma"' + (rasc.estab ? "" : " hidden") + '><input type="checkbox" data-k="contaTotal"' + (rasc.contaTotal === false ? "" : " checked") + '> Entra na soma de estabilizantes</label>' +
          '<label class="ui-rotulo" for="notaIng">Nota (aparece na calculadora)</label><textarea id="notaIng" class="ui-campo campo-branco ideia-texto" data-k="nota" rows="3">' + esc(rasc.nota) + '</textarea>' +
        '</section>' +
        '<div class="rec-acoes"><button type="button" class="ui-botao vidro" id="cancelar">Cancelar</button>' +
          '<button type="button" class="ui-botao preto" id="salvarIng">Salvar</button></div>' +
      '</div></div>';
    window.scrollTo(0, 0);

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

    el.querySelectorAll("[data-catEd]").forEach(function(b){
      b.addEventListener("click", function(){
        const c = b.getAttribute("data-catEd"), k = selCats.indexOf(c);
        if (k >= 0) selCats.splice(k, 1); else selCats.push(c);
        b.setAttribute("aria-pressed", String(k < 0));
        if (selCats.length) rasc.cats = CATEGORIAS.map(function(x){ return x[0]; }).filter(function(x){ return selCats.indexOf(x) >= 0; });
        else delete rasc.cats;
      });
    });

    // Medida: gramas ou unidade. Por unidade, a quantidade é contada (de ½ em ½) e fica fora da conta.
    const elUn = el.querySelector("#unIng");
    function poeUn(un){
      if (un){ rasc.un = elUn.value.trim() || "unidade"; if (!(rasc.gUn > 0)) rasc.gUn = 1; }
      else { delete rasc.un; delete rasc.gUn; }
      el.querySelector("#camposUn").hidden = !un; el.querySelector("#blocoComp").hidden = !!un;
      el.querySelector("#txtMedida").textContent = un ? "Contado de ½ em ½. Não entra no peso nem na composição da mistura e fica sempre no fim da lista." : "Pesado em gramas; entra no peso e na composição.";
    }
    el.querySelectorAll("#medida [data-m]").forEach(function(b){ b.addEventListener("click", function(){
      el.querySelectorAll("#medida [data-m]").forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); });
      poeUn(b.dataset.m === "un");
    }); });
    elUn.addEventListener("input", function(){ if (rasc.un) rasc.un = elUn.value.trim() || "unidade"; });

    const cancela = function(){ if (novo) location.hash = "#/ingredientes"; else mostra(); };
    el.querySelector("#cancelar").addEventListener("click", cancela);
    el.querySelector("#fecharEd").addEventListener("click", cancela);
    el.querySelector("#salvarIng").addEventListener("click", function(){
      if (!rasc.nome){ el.querySelector('[data-k="nome"]').focus(); return; }
      if (!rasc.un && agua(rasc) < -0.5){ el.querySelector("#agua").scrollIntoView({block:"center"}); return; }
      delete rasc.prot; delete rasc.fibra;
      if (novo){ db.ingredientes.push(rasc); salva(); location.hash = "#/ingredientes/" + encodeURIComponent(rasc.id); return; }
      Object.keys(ing).forEach(function(k){ delete ing[k]; });
      Object.assign(ing, rasc);
      salva(); mostra();
    });
  }

  return {titulo:novo ? "Novo ingrediente" : "Ingrediente", voltar:"#/ingredientes", voltarRotulo:"Ingredientes", limpa:limpaUi};
}
