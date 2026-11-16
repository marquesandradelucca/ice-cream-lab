// TEMPORÁRIO (só para testes durante o desenvolvimento): cria receitas fictícias.
// Abrir #/teste-dados no celular. Remover antes de publicar o app.
import { dados, salva, criaReceita, novaVersao } from "../dados.js?v=20261116175557";

const DIA = 86400000;

// Cada receita: nome, estilo, status, índice da versão final (se final) e as versões em ordem.
const DEMO = [
  {nome:"Gelato de chocolate (teste)", estilo:"gelato", status:"final", final:2, versoes:[
    {nota:"Primeira tentativa.", linhas:{leite:600, creme35:120, lpdesn:40, sacarose:160, dextrose:20, cacau:40, estab:3}},
    {nota:"Mais cacau, menos açúcar.", linhas:{leite:590, creme35:120, lpdesn:40, sacarose:150, dextrose:25, cacau:55, estab:3}},
    {nota:"Troquei parte do cacau por chocolate 70%.", linhas:{leite:580, creme35:110, lpdesn:40, sacarose:140, dextrose:25, cacau:35, choco70:50, estab:3}}
  ]},
  {nome:"Sorbet de morango (teste)", estilo:"sorbet", status:"final", final:1, versoes:[
    {nota:"Base com purê doce.", linhas:{pureDoce:600, agua:180, sacarose:150, dextrose:20, glucose:50, estab:3}},
    {nota:"Menos água, mais glucose.", linhas:{pureDoce:620, agua:150, sacarose:145, dextrose:25, glucose:60, estab:3}}
  ]},
  {nome:"Fior di latte (teste)", estilo:"gelato", status:"final", final:0, versoes:[
    {nota:"Leite, creme e açúcar.", linhas:{leite:650, creme35:150, lpdesn:35, sacarose:140, dextrose:25, estab:3}}
  ]},
  {nome:"Gelato de pistache (teste)", estilo:"gelato", status:"em teste", versoes:[
    {nota:"10% de pasta.", linhas:{leite:580, creme35:100, lpdesn:35, sacarose:150, dextrose:25, pasta:100, estab:3}},
    {nota:"Pasta subiu para 12%.", linhas:{leite:560, creme35:90, lpdesn:35, sacarose:150, dextrose:25, pasta:120, estab:3}}
  ]},
  {nome:"Sorvete de baunilha (teste)", estilo:"icecream", status:"em teste", versoes:[
    {nota:"Base com gemas.", linhas:{leite:480, creme35:280, lpdesn:40, sacarose:120, dextrose:30, gema:40, estab:3}},
    {nota:"Mais gema.", linhas:{leite:460, creme35:280, lpdesn:40, sacarose:120, dextrose:30, gema:60, estab:3}},
    {nota:"Menos creme, ficou pesado.", linhas:{leite:500, creme35:250, lpdesn:40, sacarose:120, dextrose:30, gema:60, estab:3}},
    {nota:"Glucose para dar corpo.", linhas:{leite:490, creme35:250, lpdesn:40, sacarose:110, dextrose:30, glucose:25, gema:60, estab:3}}
  ]},
  {nome:"Sorbet de limão (teste)", estilo:"sorbet", status:"em teste", versoes:[
    {nota:"Purê ácido e bastante açúcar.", linhas:{pureAcida:450, agua:330, sacarose:170, dextrose:30, glucose:40, estab:4}}
  ]}
];

export function render(el){
  const db = dados();
  let criadas = 0;
  DEMO.forEach(function(d, i){
    if (db.receitas.some(function(r){ return r.nome === d.nome; })) return;
    const r = criaReceita(d.nome, d.estilo);
    const ids = d.versoes.map(function(vd, j){
      const linhas = Object.keys(vd.linhas).map(function(id){ return {id:id, g:vd.linhas[id]}; });
      const v = novaVersao(r.id, linhas, d.estilo, vd.nota);
      // Datas espaçadas, para parecer um histórico real.
      v.data = new Date(Date.now() - ((d.versoes.length - j) * 4 + i) * DIA).toISOString();
      return v.id;
    });
    r.status = d.status;
    if (d.status === "final") r.versaoFinal = ids[d.final];
    criadas++;
  });
  salva();
  el.innerHTML = '<section class="cartao"><p>' + (criadas ? criadas + ' receitas de teste criadas.' : 'As receitas de teste já existiam.') + '</p>' +
    '<p class="muted pequeno">Todas têm “(teste)” no nome, para apagar depois.</p>' +
    '<div class="acoes-linha"><a class="botao" href="#/receitas">Ver receitas</a><a class="botao secundario" href="#/testes">Ver testes</a></div></section>';
  return {titulo:"Dados de teste"};
}
