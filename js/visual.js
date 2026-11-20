// Peças visuais do redesign (Fase 1): ícones de traço fino, capa automática em degradê e estrelas.
// Usado pelas telas novas junto com css/app.css.

// Ícones 24×24, traço 1.8, cor = currentColor.
const PATHS = {
  home:'<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
  ideia:'<path d="M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0012 3z"/>',
  calculadora:'<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8.5 7.5h7M8.5 12h1M12 12h1M15.5 12h0M8.5 16h1M12 16h1"/>',
  receitas:'<path d="M6 4h9a3 3 0 013 3v13H9a3 3 0 01-3-3z"/><path d="M6 17a3 3 0 013-3h9"/>',
  biblioteca:'<path d="M3 6.5C5 5.5 8 5.3 12 7c4-1.7 7-1.5 9-.5v12c-2-1-5-1.2-9 .5-4-1.7-7-1.5-9-.5z"/><path d="M12 7v12"/>',
  ajustes:'<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  voltar:'<path d="M15 6l-6 6 6 6"/>',
  fechar:'<path d="M6 6l12 12M18 6L6 18"/>',
  mais:'<path d="M12 5v14M5 12h14"/>',
  buscar:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  abrir:'<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
  editar:'<path d="M4 20h4L18.5 9.5a2.1 2.1 0 00-4-4L4 16z"/>',
  opcoes:'<circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/>',
  favorito:'<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
  imagem:'<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',
  ok:'<path d="M5 12l5 5L20 7"/>'
};
import { ICONES_ARQ } from "./icones.js?v=20261120174522";
export function icone(nome, extra){
  // Ícone da pasta icons/ (preenchido), quando existir; senão o de traço.
  const arq = ICONES_ARQ[nome];
  if (arq) return '<svg viewBox="' + arq.vb + '" fill="currentColor" aria-hidden="true"' + (extra ? ' ' + extra : '') + '>' +
    arq.d.map(function(d){ return '<path d="' + d + '"/>'; }).join("") + '</svg>';
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
    (extra ? ' ' + extra : '') + '>' + (PATHS[nome] || '') + '</svg>';
}

const ESTRELA = '<path d="M12 3.5l2.6 5.5 6 .7-4.4 4.1 1.2 6-5.4-3-5.4 3 1.2-6L3.4 9.7l6-.7z"/>';
// Estrelas pequenas (só leitura). n = 0 a 5.
export function estrelas(n){
  let h = '<span class="ui-estrelas" role="img" aria-label="Nota ' + (n || 0) + ' de 5">';
  for (let i = 1; i <= 5; i++) h += '<svg viewBox="0 0 24 24" class="' + (i <= n ? '' : 'vazia') + '" aria-hidden="true">' + ESTRELA + '</svg>';
  return h + '</span>';
}
// Estrelas grandes para escolher a nota (botões).
export function estrelasEscolha(n){
  let h = '<div class="ui-estrelas grandes" role="group" aria-label="Nota de 1 a 5">';
  for (let i = 1; i <= 5; i++) h += '<button type="button" data-nota="' + i + '" class="' + (i <= n ? '' : 'vazia') + '" aria-label="' + i + (i === 1 ? ' estrela' : ' estrelas') + '" aria-pressed="' + (n === i) + '">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true">' + ESTRELA + '</svg></button>';
  return h + '</div>';
}

// Capa automática: degradê com a cor do sabor (pelo nome) ou, sem pista, uma cor estável pelo nome.
// Ordem importa: a primeira palavra-chave encontrada vence (ex.: "chocomenta" antes de "chocolate" e "menta").
// Tons clareados pela luminosidade (mais nos escuros) com saturação reforçada, para não lavar a cor sob o escurecimento.
export const PALETAS = [
  {nome:"Chocomenta", chaves:["chocomenta"], cores:["#5C5947","#72986F","#B6E8C5"]},
  {nome:"Chocolate", chaves:["chocolate"], cores:["#62361F","#8B4A26","#C7885A"]},
  {nome:"Cacau", chaves:["cacau"], cores:["#3B2117","#5A3626","#86593D"]},
  {nome:"Café", chaves:["cafe"], cores:["#4E2C1B","#7D432C","#B68E6D"]},
  {nome:"Caramelo", chaves:["caramelo"], cores:["#AC5A10","#CA7B21","#EBB87B"]},
  {nome:"Avelã", chaves:["avela"], cores:["#713A17","#9A5E31","#CEA680"]},
  {nome:"Amendoim", chaves:["amendoim"], cores:["#A96F39","#CF9C67","#EFCC9E"]},
  {nome:"Pistache", chaves:["pistache"], cores:["#748026","#A29D4B","#DAD0A2"]},
  {nome:"Menta", chaves:["menta", "hortela"], cores:["#6CBA96","#AADEBD","#DDF3E4"]},
  {nome:"Manjericão", chaves:["manjericao"], cores:["#308428","#56AF38","#BEE0A1"]},
  {nome:"Limão", chaves:["limao"], cores:["#93BE2B","#C5DC59","#F2F5B1"]},
  {nome:"Maçã", chaves:["maca"], cores:["#AF3629","#D65C54","#EED98B"]},
  {nome:"Banana", chaves:["banana"], cores:["#E9C951","#FAEBBB","#FFFBE8"]},
  {nome:"Maracujá", chaves:["maracuja"], cores:["#F0950F","#FFBE3C","#FFE5B5"]},
  {nome:"Manga", chaves:["manga"], cores:["#E56538","#FD9444","#FFCA71"]},
  {nome:"Melancia", chaves:["melancia"], cores:["#C0293A","#F38687","#BCDFA1"]},
  {nome:"Morango", chaves:["morango"], cores:["#C62041","#DE566B","#F8A4AF"]},
  {nome:"Sensação", chaves:["sensacao"], cores:["#8A373E","#C05469","#F6A4B1"]},
  {nome:"Framboesa", chaves:["framboesa"], cores:["#A62256","#CE3F71","#F290B2"]},
  {nome:"Chiclete", chaves:["chiclete"], cores:["#DB5F84","#FA90CB","#FFDCDD"]},
  {nome:"Uva", chaves:["uva"], cores:["#561339","#781F54","#B5719A"]},
  {nome:"Figo", chaves:["figo"], cores:["#6B315C","#884370","#B57D9E"]},
  {nome:"Blueberry", chaves:["blueberry", "mirtilo"], cores:["#3B3468","#664F8C","#A5A0CE"]},
  {nome:"Blue ice", chaves:["blue ice"], cores:["#66ABD3","#A2D8EB","#DDF3FA"]},
  {nome:"Baunilha", chaves:["baunilha"], cores:["#D2B992","#EADCC3","#FAF3E7"]},
  {nome:"Fior di latte", chaves:["fior di latte", "fior de latte", "fiordilatte", "fior"], cores:["#E0D9CB","#F5F0E6","#FBFAF7"]},
  {nome:"Flocos", chaves:["flocos", "stracciatella"], cores:["#694A37","#DCCFBE","#F9F5EB"]},
  {nome:"Base branca", chaves:["base", "branca"], cores:["#BAA481","#D1BFA1","#EBE1D0"]},
  {nome:"Creme", chaves:["creme"], cores:["#CBA16F","#E9CFA7","#F5E8D4"]},
  {nome:"Coco", chaves:["coco"], cores:["#D4CEC6","#EBE7E1","#FAF8F4"]},
];
export const NEUTRAS = [["#816E58", "#AF9D87", "#DBD1C4"], ["#5F6786", "#949AAE", "#CBCED8"], ["#9B553F", "#C18B74", "#E6CAB9"], ["#6A983E", "#9BB676", "#CBDAB6"]];
// Neutros também escolhíveis no seletor de capa (sem palavra-chave: não entram na escolha automática).
NEUTRAS.forEach(function(c, i){ PALETAS.push({nome:"Neutro " + (i + 1), chaves:[], cores:c}); });
function semAcento(s){ return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
// Procura cada palavra-chave como palavra inteira ("uva" não pega "suave").
export function paletaDe(nome){
  const n = " " + semAcento(nome).replace(/[^a-z0-9]+/g, " ") + " ";
  for (const p of PALETAS) for (const k of p.chaves) if (n.indexOf(" " + k + " ") >= 0) return p.cores;
  let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return NEUTRAS[h % NEUTRAS.length];
}
// Capa automática: a paleta vem do sabor; ângulo, ponto do meio e manchas variam por nome
// (sempre iguais para o mesmo nome, diferentes entre receitas).
function sorteio(texto){
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++){ h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return function(min, max){ h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9E3779B9) >>> 0; return Math.round(min + (h / 4294967296) * (max - min)); };
}
// Biblioteca de fotos: o app registra aqui como ler/guardar (as capas usam "foto:<id>").
let armazem = null;
export function defineArmazemFotos(a){ armazem = a; }
function resolveFoto(v){ if (v && v.indexOf("foto:") === 0){ const f = armazem && armazem.pega(v.slice(5)); return f || null; } return v; }

export function capa(nome, foto){
  if (foto && foto.indexOf("foto:") === 0) foto = resolveFoto(foto);
  // foto pode ser uma imagem ou um degradê escolhido à mão ("paleta:Menta").
  const escolhida = foto && foto.indexOf("paleta:") === 0 ? PALETAS.find(function(x){ return x.nome === foto.slice(7); }) : null;
  // Aspas simples: a capa vai dentro de style="..." no HTML; aspas duplas fechariam o atributo.
  if (foto && !escolhida) return "url('" + String(foto).replace(/'/g, "%27") + "')";
  const p = escolhida ? escolhida.cores : paletaDe(nome), r = sorteio(String(nome || ""));
  const ang = r(100, 260), meio = r(35, 68);
  const luz = 'radial-gradient(circle at ' + r(10, 90) + '% ' + r(0, 35) + '%, ' + p[2] + 'aa 0%, transparent ' + r(40, 65) + '%)';
  const sombra = 'radial-gradient(circle at ' + r(0, 100) + '% ' + r(55, 100) + '%, ' + p[0] + '99 0%, transparent ' + r(35, 60) + '%)';
  return luz + ', ' + sombra + ', linear-gradient(' + ang + 'deg, ' + p[0] + ' 0%, ' + p[1] + ' ' + meio + '%, ' + p[2] + ' 100%)';
}

// Escalas de avaliação (5 níveis). Lotes antigos de 3 níveis são convertidos.
export const DUREZA = [["mole","Mole"],["macia","Macia"],["ideal","Ideal"],["firme","Firme"],["dura","Dura"]];
export const DOCURA = [["pouco","Pouco"],["media","Média"],["ideal","Ideal"],["doce","Doce"],["enjoativa","Enjoativa"]];
export function docuraAtual(v){ return v === "muito" ? "doce" : v; }

// Degradês na ordem por cor (a mesma da paleta no Figma).
export const ORDEM_CAPAS = ["Cacau","Café","Chocolate","Avelã","Caramelo","Amendoim","Manga","Maracujá","Banana","Limão","Pistache","Manjericão","Chocomenta","Menta","Blue ice","Blueberry","Uva","Figo","Sensação","Framboesa","Chiclete","Morango","Melancia","Maçã","Creme","Base branca","Baunilha","Flocos","Coco","Fior di latte","Neutro 1","Neutro 2","Neutro 3","Neutro 4"];

function escHtml(t){ return String(t == null ? "" : t).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

// Reduz a foto no aparelho (lado maior até 1200 px, JPEG) e devolve como data URL.
function reduzFoto(arquivo){
  return new Promise(function(ok, falha){
    const img = new Image(), url = URL.createObjectURL(arquivo);
    img.onload = function(){
      const k = Math.min(1, 1200 / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      ok(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = function(){ URL.revokeObjectURL(url); falha(new Error("Não foi possível abrir a imagem.")); };
    img.src = url;
  });
}

// Folha para escolher capa: "Automática" (ou o padrão), os degradês por cor e, se permitido, uma foto.
// opts: {titulo, semente, atual, rotuloPadrao, foto:true|false, aoEscolher(valor)}  valor "" = padrão.
export function escolheCapa(opts){
  // Seletor único de capa/fundo: Upload · Fotos (todas as já enviadas, reaproveitáveis) · Automática · degradês.
  const atual = opts.atual || "";
  const legado = atual && atual.indexOf("data:") === 0;   // foto antiga guardada dentro do item
  const fotos = armazem ? armazem.lista() : [];
  const veu = document.createElement("div"); veu.className = "ui-veu";
  const f = document.createElement("div"); f.className = "ui-folha"; f.setAttribute("role", "dialog"); f.setAttribute("aria-label", opts.titulo || "Capa");
  const op = function(valor, rotulo){ return '<button type="button" class="capa-op" data-capa="' + escHtml(valor) + '" aria-pressed="' + (valor === atual) + '" style="--capa:' + capa(opts.semente, valor || opts.padrao || null) + '">' + (rotulo ? '<span>' + rotulo + '</span>' : '') + '</button>'; };
  f.innerHTML = '<span class="puxador"></span><h2>' + escHtml(opts.titulo || "Capa") + '</h2>' +
    '<div class="capa-grade">' +
      '<button type="button" class="capa-op capa-enviar" id="capaFoto">' + icone("imagem") + '<span>Upload</span></button>' +
      (legado ? op(atual, "Atual") : '') +
      fotos.map(function(x){ return op("foto:" + x.id, ""); }).join("") +
      '<span class="capa-sec">Degradês</span>' +
      op("", escHtml(opts.rotuloPadrao || "Automática")) +
      ORDEM_CAPAS.map(function(n){ return op("paleta:" + n, escHtml(n)); }).join("") + '</div>' +
    '<input type="file" id="capaArquivo" accept="image/*" hidden>';
  if (fotos.length || legado) f.querySelector(".capa-grade").insertAdjacentHTML("afterbegin", '<span class="capa-sec">Fotos</span>');
  document.body.append(veu, f);
  const fecha = function(){ veu.remove(); f.remove(); };
  veu.addEventListener("click", fecha);
  f.querySelectorAll(".capa-op[data-capa]").forEach(function(b){ b.addEventListener("click", function(){ fecha(); opts.aoEscolher(b.dataset.capa); }); });
  const arq = f.querySelector("#capaArquivo");
  f.querySelector("#capaFoto").addEventListener("click", function(){ arq.click(); });
  arq.addEventListener("change", async function(){
    const a = arq.files && arq.files[0]; if (!a) return;
    try { const dado = await reduzFoto(a); fecha(); opts.aoEscolher(armazem ? "foto:" + armazem.guarda(dado) : dado); } catch (e) { alert(e.message); }
  });
}

// Vidro dos controles sobre capa: tom claro da própria capa (translúcido), em vez de branco (que acinzenta).
// Degradê: usa o tom claro da paleta. Foto: cor média da imagem, clareada (calculada no aparelho).
function rgba(hex, a){ const n = parseInt(hex.slice(1), 16); return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; }
const TOM_ALFA = 0.42;
export function tomVidro(nome, foto){
  if (foto && foto.indexOf("foto:") === 0) foto = resolveFoto(foto);
  const esc = foto && foto.indexOf("paleta:") === 0 ? PALETAS.find(function(x){ return x.nome === foto.slice(7); }) : null;
  if (foto && !esc) return null;   // foto: calcular à parte
  return rgba((esc ? esc.cores : paletaDe(nome))[2], TOM_ALFA);
}
const cacheTom = {};
export function aplicaTom(alvo, nome, foto){
  if (foto && foto.indexOf("foto:") === 0) foto = resolveFoto(foto);
  const t = tomVidro(nome, foto);
  if (t){ alvo.style.setProperty("--ui-tom", t); return; }
  alvo.style.setProperty("--ui-tom", "rgba(255,255,255,.24)");
  if (cacheTom[foto]){ alvo.style.setProperty("--ui-tom", cacheTom[foto]); return; }
  const img = new Image();
  img.onload = function(){
    try {
      const c = document.createElement("canvas"); c.width = c.height = 16;
      const g = c.getContext("2d"); g.drawImage(img, 0, 0, 16, 16);
      const d = g.getImageData(0, 0, 16, 16).data; let r = 0, gg = 0, b = 0;
      for (let i = 0; i < d.length; i += 4){ r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
      const k = d.length / 4, mix = function(v){ return Math.round(v / k + (255 - v / k) * 0.45); };
      cacheTom[foto] = "rgba(" + mix(r) + "," + mix(gg) + "," + mix(b) + "," + TOM_ALFA + ")";
      alvo.style.setProperty("--ui-tom", cacheTom[foto]);
    } catch (e) {}
  };
  img.src = foto;
}
