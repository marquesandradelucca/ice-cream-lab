// Entrada: tela obrigatória enquanto não há login. Entrar ou criar conta (Supabase, e-mail e senha).
import { situacao, entrar, criarConta } from "../sync.js?v=20261125150235";

function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

export function render(el){
  document.body.classList.add("ui"); // fonte e cores do app (alguma tela anterior pode ter tirado a classe ao sair)
  let modo = "entrar";
  const desenha = function(){
    const s = situacao(), criar = modo === "criar";
    // Só o aviso de sessão expirada interessa aqui; erros de sincronização de uma conta anterior não.
    const aviso = s.erro && /sessão expirou/i.test(s.erro) ? s.erro : "";
    el.innerHTML =
      '<div class="ui-tela entrada-tela">' +
        '<img class="entrada-icone" src="icons/logo.png?v=2" alt="" width="84" height="84">' +
        '<h1 class="entrada-titulo">Ice Cream Lab</h1>' +
        '<p class="ui-sec entrada-sub">' + (criar ? 'Crie sua conta para começar.' : 'Entre na sua conta para continuar.') + '</p>' +
        '<form class="ui-cartao ui-vidro entrada-cartao" novalidate>' +
          (criar ? '<input id="nome" class="ui-campo campo-branco" type="text" autocomplete="name" autocapitalize="words" placeholder="Seu nome" aria-label="Seu nome" required>' : '') +
          '<input id="email" class="ui-campo campo-branco" type="email" autocomplete="username" inputmode="email" autocapitalize="off" placeholder="E-mail" aria-label="E-mail" required>' +
          '<input id="senha" class="ui-campo campo-branco" type="password" autocomplete="' + (criar ? 'new-password' : 'current-password') + '" minlength="6" placeholder="Senha' + (criar ? ' (mínimo 6 caracteres)' : '') + '" aria-label="Senha" required>' +
          (criar ? '<input id="senha2" class="ui-campo campo-branco" type="password" autocomplete="new-password" minlength="6" placeholder="Repita a senha" aria-label="Repita a senha" required>' : '') +
          '<span class="ui-sec ajustes-erro" id="erro"' + (aviso ? '' : ' hidden') + '>' + esc(aviso) + '</span>' +
          '<button type="submit" class="ui-botao preto entrada-botao">' + (criar ? 'Criar conta' : 'Login') + '</button>' +
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
      const elN = el.querySelector("#nome"), nome = elN ? elN.value.trim() : "";
      if (criar && !nome){ mostra("Digite seu nome."); elN.focus(); return; }
      const elS2 = el.querySelector("#senha2");
      if (criar && elS2.value !== senha){ mostra("As senhas não são iguais. Digite de novo."); elS2.value = ""; elS2.focus(); return; }
      const b = f.querySelector("button"); b.disabled = true;
      try { if (criar) await criarConta(email, senha, nome); else await entrar(email, senha); }
      catch (e) { mostra(e.message); b.disabled = false; }
    });
    el.querySelector("#troca").addEventListener("click", function(){ modo = criar ? "entrar" : "criar"; desenha(); });
  };
  desenha();
  return {titulo:""};
}
