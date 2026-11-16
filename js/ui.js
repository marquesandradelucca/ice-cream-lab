// Confirmação própria do app, no lugar do confirm() do sistema (que alguns navegadores
// bloqueiam e que quebra a imersão). Uso: if (await confirma("Excluir?", "Excluir")) …
export function confirma(mensagem, rotuloSim, perigo){
  return new Promise(function(resolve){
    const fundo = document.createElement("div");
    fundo.className = "confirma-fundo";
    fundo.innerHTML =
      '<div class="confirma-caixa" role="alertdialog" aria-modal="true">' +
        '<p class="confirma-texto"></p>' +
        '<div class="confirma-acoes">' +
          '<button type="button" class="botao secundario" data-r="0">Cancelar</button>' +
          '<button type="button" class="botao' + (perigo ? ' perigo-cheio' : '') + '" data-r="1"></button>' +
        '</div></div>';
    fundo.querySelector(".confirma-texto").textContent = mensagem;
    fundo.querySelector('[data-r="1"]').textContent = rotuloSim || "Confirmar";
    function fecha(r){
      document.removeEventListener("keydown", tecla);
      fundo.remove(); resolve(r);
    }
    function tecla(ev){ if (ev.key === "Escape") fecha(false); }
    fundo.addEventListener("click", function(ev){
      const b = ev.target.closest("[data-r]");
      if (b) fecha(b.dataset.r === "1");
      else if (ev.target === fundo) fecha(false);
    });
    document.addEventListener("keydown", tecla);
    document.body.appendChild(fundo);
    fundo.querySelector('[data-r="1"]').focus();
  });
}
