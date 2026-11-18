// Testes virou o filtro "Em teste" da aba Receitas. Endereço antigo redireciona.
export function render(){
  location.replace("#/receitas/teste");
  return {titulo:"Receitas"};
}
