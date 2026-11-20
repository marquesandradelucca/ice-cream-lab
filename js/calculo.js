// Regras de cálculo da calculadora de mistura.
// Copiadas sem alteração de legado/calculadora-v1.html (v1.1), que é a fonte da verdade.
// Não mude fórmulas, coeficientes nem faixas sem confirmar com o Lucca.

// POD = poder adoçante, PAC = poder anticongelante (sacarose = 100)
export const COEF = {
  sacarose:   {pod:100, pac:100},
  dextrose:   {pod:70,  pac:190},
  frutose:    {pod:170, pac:190},
  invertido:  {pod:125, pac:190},
  glucose:    {pod:23,  pac:70},
  malto:      {pod:12,  pac:33},
  lactose:    {pod:16,  pac:100}
};

export const ALVOS = {
  gelato:   {gord:[4,9],   slng:[7,11],  ac:[16,22], sol:[36,42], pod:[160,210], pac:[240,280]},
  icecream: {gord:[10,16], slng:[9,12],  ac:[14,18], sol:[36,42], pod:[150,200], pac:[240,280]},
  sorbet:   {gord:[0,1],   slng:[0,1],   ac:[25,32], sol:[28,35], pod:[230,280], pac:[300,360]}
};

export const NOMES_ESTILO = {gelato:"Gelato", icecream:"Sorvete tradicional", sorbet:"Sorbet"};

export const ESCALA = {
  gord:[0,20], slng:[0,14], ac:[0,36], sol:[20,50], pod:[80,320], pac:[120,420],
  fp:[-4.5,-1], wf:[55,95]
};

export const ALVO_FP = [-3.0, -2.75];
export const ALVO_ESTAB = [0.1, 0.5];   // faixa do Estudo (Fundamentos), confirmada pelo Lucca em 16/11/2026

// Ponto de congelamento de soluções de sacarose (Leighton/Pickering), curva ajustada:
// erro de até 0,08 °C até 180 g/100 g, daí para cima segue reta.
// c = gramas de equivalente-sacarose por 100 g de água.
const K = [0.0587289852, 1.09367e-5, 1.9583e-6, -8.3e-9];

function quedaSE(c){
  if (c <= 180){
    return K[0]*c + K[1]*c*c + K[2]*c*c*c + K[3]*c*c*c*c;
  }
  const fim = K[0]*180 + K[1]*32400 + K[2]*5832000 + K[3]*1049760000;
  const incl = K[0] + 2*K[1]*180 + 3*K[2]*32400 + 4*K[3]*5832000;
  return fim + incl * (c - 180);
}

// Queda total: equivalentes de sacarose mais os sais do leite.
function queda(se, sais, agua){
  return quedaSE(se * 100 / agua) + sais * 2.37 / agua;
}

export function pontoCongelamento(r){
  if (!r.peso || r.agua <= 0) return null;
  return -queda(r.pac / 10, r.slng + r.soro, r.agua);
}

export const PRESETS = {
  gelato: {estilo:"gelato", preparo:"1. Pese tudo. Misture os pós (leite em pó, açúcares, estabilizante) a seco, para não empelotar.\n2. Aqueça o leite e o creme a uns 40 °C e junte os pós aos poucos, batendo com mixer.\n3. Pasteurize: leve a 85 °C por 1 minuto (ou 65 °C por 30 min), mexendo sempre.\n4. Resfrie rápido em banho de gelo até abaixo de 10 °C.\n5. Matura na geladeira (4 °C) por 4 a 12 h, coberto.\n6. Bata com mixer de novo por 1 minuto e leve à máquina.\n7. Gelato: tire mais mole (−6 a −8 °C) e sirva entre −11 e −14 °C.", nome:"Base branca de gelato", linhas:[
    {id:"leite", g:597},{id:"creme35", g:160},{id:"lpdesn", g:40},
    {id:"sacarose", g:150},{id:"dextrose", g:20},{id:"glucose", g:30},{id:"estab", g:3}
  ]},
  icecream: {estilo:"icecream", preparo:"1. Pese tudo. Misture os pós (leite em pó, açúcares, estabilizante) a seco, para não empelotar.\n2. Aqueça o leite e o creme a uns 40 °C e junte os pós aos poucos, batendo com mixer.\n3. Pasteurize: leve a 85 °C por 1 minuto (ou 65 °C por 30 min), mexendo sempre.\n4. Resfrie rápido em banho de gelo até abaixo de 10 °C.\n5. Matura na geladeira (4 °C) por 4 a 12 h, coberto.\n6. Bata com mixer de novo por 1 minuto e leve à máquina.\n7. Sorvete: bata até ficar firme e com bastante ar; endureça no freezer (−18 °C) por algumas horas antes de servir.", nome:"Base branca de sorvete", linhas:[
    {id:"leite", g:477},{id:"creme35", g:295},{id:"lpdesn", g:50},
    {id:"sacarose", g:115},{id:"dextrose", g:34},{id:"glucose", g:26},{id:"estab", g:3}
  ]},
  sorbet: {estilo:"sorbet", preparo:"1. Pese tudo. Misture os pós (açúcares e estabilizante) a seco, para não empelotar.\n2. Aqueça a água a uns 80 °C e dissolva os pós, batendo com mixer. Deixe esfriar.\n3. Junte a fruta só com a calda fria (não cozinhe a fruta, para manter o sabor fresco).\n4. Bata com mixer e leve à geladeira (4 °C) por 1 a 4 h.\n5. Prove: se a fruta for muito ácida, ajuste com um pouco de açúcar ou limão.\n6. Bata de novo por 1 minuto e leve à máquina. Sirva entre −11 e −14 °C.", nome:"Sorbet de fruta", linhas:[
    {id:"pureDoce", g:580},{id:"agua", g:187},{id:"sacarose", g:140},
    {id:"dextrose", g:20},{id:"glucose", g:70},{id:"estab", g:3}
  ]}
};

// linhas: [{id, g}]; comp(id) devolve a composição do ingrediente (por 100 g) ou null.
// Ingrediente atual (registrado pelo app): a marcação "por unidade" vale mesmo para versões antigas.
let ingAtual = null;
export function registraIngredientes(fn){ ingAtual = fn; }

export function calcula(linhas, comp){
  const t = {peso:0, gord:0, slng:0, soro:0, ac:0, outros:0, pod:0, pac:0, estab:0};
  linhas.forEach(function(l){
    const ing = comp(l.id); if (!ing) return;
    if (porUnidade((ingAtual && ingAtual(l.id)) || ing)) return;   // contado por unidade (fava etc.): não entra no peso nem na composição
    const g = Number(l.g) || 0;
    t.peso += g;
    if (ing.estab && ing.contaTotal !== false) t.estab += g;
    t.gord += g * (ing.gord || 0) / 100;
    t.slng += g * (ing.slng || 0) / 100;
    t.soro += g * (ing.soro || 0) / 100;
    t.outros += g * (ing.outros || 0) / 100;
    if (ing.ac){
      Object.keys(ing.ac).forEach(function(tipo){
        if (!COEF[tipo]) return;
        const gr = g * (Number(ing.ac[tipo]) || 0) / 100;
        t.ac += gr;
        t.pod += gr * COEF[tipo].pod / 100;
        t.pac += gr * COEF[tipo].pac / 100;
      });
    }
    // 54,5% dos sólidos lácteos e 76,5% dos sólidos de soro são lactose
    const lactose = g * (ing.slng || 0) / 100 * 0.545 + g * (ing.soro || 0) / 100 * 0.765;
    t.pod += lactose * COEF.lactose.pod / 100;
    t.pac += lactose * COEF.lactose.pac / 100;
  });
  t.sol = t.gord + t.slng + t.soro + t.ac + t.outros;
  t.agua = t.peso - t.sol;
  const p = t.peso || 1;
  return {
    peso: t.peso,
    gord: t.gord / p * 100,
    estab: t.estab / p * 100,
    slng: t.slng / p * 100,
    soro: t.soro / p * 100,
    ac: t.ac / p * 100,
    outros: t.outros / p * 100,
    sol: t.sol / p * 100,
    agua: t.agua / p * 100,
    pod: t.pod / p * 1000,
    pac: t.pac / p * 1000
  };
}

export function n(v, casas){
  let txt = v.toFixed(casas === undefined ? 1 : casas);
  txt = txt.replace(/\.0+$/, "").replace(/(\.\d*?[1-9])0+$/, "$1");
  return txt.replace(".", ",").replace("-", "−");
}

export function faixa(a, b, casas){
  const inteiros = (casas === 0) || (a === Math.round(a) && b === Math.round(b));
  const ca = inteiros ? 0 : casas;
  return n(a, ca) + (a < 0 || b < 0 ? " a " : "–") + n(b, ca);
}

// 20% da largura do intervalo é um limiar de interface, não um limite técnico.
export function nivelFaixa(valor, alvo){
  if (valor >= alvo[0] && valor <= alvo[1]) return "ok";
  const distancia = valor < alvo[0] ? alvo[0] - valor : valor - alvo[1];
  const largura = alvo[1] - alvo[0];
  return largura > 0 && distancia / largura >= 0.2 ? "critico" : "atencao";
}

export function avisos(r, estilo){
  const alvos = ALVOS[estilo];
  const fp = pontoCongelamento(r);
  const itens = [
    {nome:"Gordura", valor:r.gord, alvo:alvos.gord, unidade:"%", casas:1,
     baixo:"Pode reduzir a cremosidade; considere aumentar a gordura.",
     alto:"Pode deixar a textura amanteigada e abafar o sabor."},
    {nome:"Sólidos lácteos (SLNG)", valor:r.slng+r.soro, alvo:alvos.slng, unidade:"%", casas:1,
     baixo:"Considere ajustar a quantidade de sólidos lácteos.",
     alto:"O excesso de lactose pode favorecer uma textura arenosa; revise os sólidos lácteos."},
    {nome:"Açúcares", valor:r.ac, alvo:alvos.ac, unidade:"%", casas:1,
     baixo:"Revise a proporção de açúcares da receita.",
     alto:"Revise a proporção de açúcares da receita."},
    {nome:"Sólidos totais", valor:r.sol, alvo:alvos.sol, unidade:"%", casas:1,
     baixo:"Pode favorecer cristais de gelo; considere aumentar os sólidos.",
     alto:"A mistura pode ficar pesada e pastosa; considere reduzir os sólidos."},
    {nome:"POD (doçura)", valor:r.pod, alvo:alvos.pod, unidade:"", casas:0,
     baixo:"A doçura pode ficar abaixo do esperado para o estilo.",
     alto:"Pode ficar doce demais; considere substituir parte do açúcar por glucose em pó."},
    {nome:"Ponto de congelamento", valor:fp || 0, alvo:ALVO_FP, unidade:" °C", casas:2,
     baixo:"Tende a ficar mole na temperatura de servir; considere reduzir o PAC.",
     alto:"Tende a sair firme demais do freezer; considere subir o PAC."},
    {nome:"PAC (maciez)", valor:r.pac, alvo:alvos.pac, unidade:"", casas:0,
     baixo:"Pode ficar firme demais; considere substituir parte da sacarose por dextrose.",
     alto:"Pode ficar mole demais; considere substituir parte da dextrose por sacarose."}
  ];
  if (r.estab > 0){
    itens.push({nome:"Estabilizantes", valor:r.estab, alvo:ALVO_ESTAB, unidade:"%", casas:2,
      baixo:"Pouco estabilizante: os cristais de gelo crescem com mais facilidade durante o armazenamento.",
      alto:"Excesso de estabilizante dá sensação de goma: o sorvete derrete devagar demais na boca."});
  }
  // PAC alto e ponto de congelamento baixo (ou o contrário) são o mesmo problema.
  const pacAlto = r.pac > alvos.pac[1], pacBaixo = r.pac < alvos.pac[0];
  const fpAbaixo = fp !== null && fp < ALVO_FP[0];
  const fpAcima = fp !== null && fp > ALVO_FP[1];
  const mesmoProblema = (pacAlto && fpAbaixo) || (pacBaixo && fpAcima);

  const out = [];
  itens.forEach(function(item){
    if (item.nome === "Ponto de congelamento" && mesmoProblema) return;
    const abaixo = item.valor < item.alvo[0];
    const acima = item.valor > item.alvo[1];
    if (!abaixo && !acima) return;
    out.push({nivel:nivelFaixa(item.valor, item.alvo), txt:item.nome + " " + (abaixo ? "abaixo" : "acima") + " da faixa (" +
      n(item.valor, item.casas) + item.unidade + "; referência " +
      faixa(item.alvo[0], item.alvo[1], item.casas) + item.unidade + "). " +
      (abaixo ? item.baixo : item.alto) +
      (item.nome.indexOf("PAC") === 0 && mesmoProblema ?
        " O ponto de congelamento também saiu da faixa, pelo mesmo motivo." : "")});
  });
  if (!out.length && r.peso > 0) out.push({nivel:"ok", txt:"Todos os parâmetros dentro das faixas de referência."});
  return out;
}

// Ingredientes contados por unidade (ex.: fava de baunilha): i.un = nome da unidade, i.gUn = peso de 1 unidade.
// A conta continua em gramas; só a quantidade mostrada vira unidades, de ½ em ½.
export function porUnidade(i){ return !!(i && i.un && Number(i.gUn) > 0); }
// Passo da contagem: ¼, ½ ou 1 unidade (padrão ½).
export function passoUn(i){ const p = Number(i && i.passoUn); return p === 0.25 || p === 1 ? p : 0.5; }
export function unidades(i, g){ const p = passoUn(i); return Math.round((Number(g) || 0) / Number(i.gUn) / p) * p; }
export function textoUnidades(i, u){
  const int = Math.floor(u + 1e-9), fr = Math.round((u - int) * 4) / 4;
  const num = (int ? String(int) : "") + ({0.25:"¼", 0.5:"½", 0.75:"¾"}[fr] || "") || "0";
  return num + " " + i.un + (u > 1 ? "s" : "");
}
// Quantidade pronta para mostrar: "597 g" ou "1½ fava".
export function qtdTexto(i, g){
  if (porUnidade(i)) return textoUnidades(i, unidades(i, g));
  return ((g < 10 ? n(g, 1) : n(Math.round(g), 0))) + " g";
}
