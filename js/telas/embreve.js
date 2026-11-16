const INFO = {
  ideias:   {titulo:"Ideias",           etapa:4, txt:"Lista de ideias com “Começar receita”, que abre a calculadora com um rascunho no estilo escolhido."},
  testes:   {titulo:"Testes",           etapa:3, txt:"Diário de todos os lotes, com o modo lote guiado na bancada."},
  receitas: {titulo:"Receitas prontas", etapa:2, txt:"Receitas finais com quantidades, modo de preparo e escala por tamanho de lote."},
  estudo:   {titulo:"Estudo",           etapa:4, txt:"Fundamentos, bases e técnicas, trazidos do seu Ice Cream Lab no Notion."}
};

export function render(el, rota){
  const i = INFO[rota.area];
  el.innerHTML = '<section class="cartao embreve"><p class="etiqueta">Etapa ' + i.etapa + '</p>' +
    '<p>' + i.txt + '</p><p class="muted">Esta área ainda vai ser construída.</p>' +
    '<a class="botao" href="#/">Voltar ao início</a></section>';
  return {titulo:i.titulo};
}
