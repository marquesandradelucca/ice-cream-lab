// Entrada: tela obrigatória enquanto não há login. Entrar ou criar conta (Supabase, e-mail e senha).
import { situacao, entrar, criarConta } from "../sync.js?v=20261123113658";

function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

export function render(el){
  let modo = "entrar";
  const desenha = function(){
    const s = situacao(), criar = modo === "criar";
    el.innerHTML =
      '<div class="ui-tela entrada-tela">' +
        '<img class="entrada-icone" src="icons/icon-192.png?v=5" alt="" width="96" height="96">' +
        '<h1 class="entrada-titulo">Ice Cream Lab</h1>' +
        '<p class="ui-sec entrada-sub">' + (criar ? 'Crie sua conta para começar.' : 'Entre na sua conta para continuar.') + '</p>' +
        '<form class="ui-cartao ui-vidro entrada-cartao" novalidate>' +
          '<input id="email" class="ui-campo campo-branco" type="email" autocomplete="username" inputmode="email" autocapitalize="off" placeholder="E-mail" aria-label="E-mail" required>' +
          '<input id="senha" class="ui-campo campo-branco" type="password" autocomplete="' + (criar ? 'new-password' : 'current-password') + '" minlength="6" placeholder="Senha' + (criar ? ' (mínimo 6 caracteres)' : '') + '" aria-label="Senha" required>' +
          '<span class="ui-sec ajustes-erro" id="erro"' + (s.erro ? '' : ' hidden') + '>' + esc(s.erro || "") + '</span>' +
          '<button type="submit" class="ui-botao preto entrada-botao">' + (criar ? 'Criar conta' : 'Entrar') + '</button>' +
        '</form>' +
        '<button type="button" class="ui-botao vidro entrada-troca" id="troca">' + (criar ? 'Já tenho conta' : 'Criar conta') + '</button>' +
      '</div>';
    const f = el.querySelector("form"), elE = el.querySelector("#email"), elS = el.querySelector("#senha"), elErro = el.querySelector("#erro");
    const mostra = function(t){ elErro.textContent = t; elErro.hidden = false; };
    f.addEventListener("submit", async function(ev){
      ev.preventDefault();
      const email = elE.value.trim(), senha = elS.value;
      if (!email){ elE.focus(); return; }
      if (senha.length < 6){ mostra("A senha precisa ter pelo menos 6 caracteres."); elS.focus(); return; }
      const b = f.querySelector("button"); b.disabled = true;
      try { await (criar ? criarConta : entrar)(email, senha); }
      catch (e) { mostra(e.message); b.disabled = false; }
    });
    el.querySelector("#troca").addEventListener("click", function(){ modo = criar ? "entrar" : "criar"; desenha(); });
  };
  desenha();
  return {titulo:""};
}
