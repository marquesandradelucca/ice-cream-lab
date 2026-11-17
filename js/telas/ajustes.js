// Ajustes: conta (entrar/criar/sair), situação da sincronização e backup em arquivo.
import { exportaBackup, importaBackup } from "../dados.js?v=20261117022102";
import { situacao, aoMudar, entrar, criarConta, sair, sincroniza } from "../sync.js?v=20261117022102";
import { confirma } from "../ui.js?v=20261117022102";
import { toast } from "../app.js?v=20261117022102";

function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function hora(iso){ try { return new Date(iso).toLocaleString("pt-BR", {day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit"}); } catch (e) { return ""; } }

export function textoSituacao(s){
  if (!s.logado) return "Dados só neste aparelho";
  if (s.sincronizando) return "Sincronizando…";
  if (!s.online) return "Sem internet · envia quando voltar";
  if (s.erro) return s.erro;
  return s.ultima ? "Sincronizado · " + hora(s.ultima) : "Conectado";
}

export function render(el){
  let parar = null;
  function desenha(){
    const s = situacao();
    el.innerHTML =
      '<h2 class="subtitulo">Login</h2>' +
      (s.logado ?
        '<section class="cartao">' +
          '<p class="sem-margem">' + esc(s.email) + '</p>' +
          '<p class="muted pequeno estado-sync' + (s.erro ? ' txt-critico' : '') + '">' + esc(textoSituacao(s)) + '</p>' +
        '</section>' +
        '<div class="acoes-ing bloco-ajustes"><button type="button" class="pilula-cinza" id="sair">Sair</button>' +
          '<button type="button" class="pilula-preta" id="sincronizar"' + (s.sincronizando ? ' disabled' : '') + '>Sincronizar agora</button></div>' :
        (s.erro ? '<p class="pequeno txt-critico">' + esc(s.erro) + '</p>' : '') +
        '<section class="cartao form-conta">' +
          '<label class="rotulo" for="email">E-mail</label>' +
          '<input id="email" class="campo-texto" type="email" autocomplete="username" inputmode="email" autocapitalize="off">' +
          '<label class="rotulo rotulo-espaco-curto" for="senha">Senha</label>' +
          '<input id="senha" class="campo-texto" type="password" autocomplete="current-password" minlength="6">' +
          '<p class="pequeno txt-critico" id="erroConta" hidden></p>' +
        '</section>' +
        '<div class="acoes-ing bloco-ajustes"><button type="button" class="pilula-preta" id="entrar">Entrar</button>' +
          '<button type="button" class="pilula-cinza" id="criar">Criar conta</button></div>') +
      // Backup fica discreto: um card recolhido, aberto só quando precisar.
      '<details class="cartao recolhivel backup-discreto"><summary>Backup em arquivo<span class="chevron" aria-hidden="true"></span></summary>' +
        '<div><p class="muted pequeno">Uma cópia de segurança fora do app, para guardar no Arquivos ou no Drive.</p>' +
        '<div class="acoes-ing"><button type="button" class="pilula-cinza" id="exportar">Exportar</button>' +
          '<button type="button" class="pilula-cinza" id="importar">Importar</button></div></div>' +
      '</details>' +
      '<input type="file" id="arquivo" accept="application/json,.json" hidden>';

    if (s.logado){
      el.querySelector("#sincronizar").addEventListener("click", function(){ sincroniza(); });
      el.querySelector("#sair").addEventListener("click", async function(){
        if (!(await confirma("Sair da conta neste aparelho? Os dados continuam aqui e na nuvem; só param de sincronizar até você entrar de novo.", "Sair"))) return;
        sair();
      });
    } else {
      const elE = el.querySelector("#email"), elS = el.querySelector("#senha"), elErro = el.querySelector("#erroConta");
      async function tenta(fn){
        const email = elE.value.trim(), senha = elS.value;
        if (!email){ elE.focus(); return; }
        if (senha.length < 6){ elErro.textContent = "A senha precisa ter pelo menos 6 caracteres."; elErro.hidden = false; elS.focus(); return; }
        el.querySelectorAll(".bloco-ajustes button").forEach(function(b){ b.disabled = true; });
        try { await fn(email, senha); }
        catch (e) { elErro.textContent = e.message; elErro.hidden = false; el.querySelectorAll(".bloco-ajustes button").forEach(function(b){ b.disabled = false; }); }
      }
      el.querySelector("#entrar").addEventListener("click", function(){ tenta(entrar); });
      el.querySelector("#criar").addEventListener("click", function(){ tenta(criarConta); });
      elS.addEventListener("keydown", function(ev){ if (ev.key === "Enter"){ ev.preventDefault(); tenta(entrar); } });
    }

    el.querySelector("#exportar").addEventListener("click", exportaBackup);
    const arq = el.querySelector("#arquivo");
    el.querySelector("#importar").addEventListener("click", function(){ arq.click(); });
    arq.addEventListener("change", function(){
      const f = arq.files && arq.files[0]; if (!f) return;
      const leitor = new FileReader();
      leitor.onload = async function(){
        try {
          const completo = /"versaoDados"/.test(leitor.result);
          if (completo && !(await confirma("Restaurar este backup substitui todos os dados atuais do app" + (situacao().logado ? " (e da nuvem, na próxima sincronização)" : "") + ". Continuar?", "Restaurar", true))) return;
          toast(importaBackup(leitor.result));
        } catch (e) { toast("Não consegui ler o arquivo: " + e.message); }
      };
      leitor.readAsText(f);
      arq.value = "";
    });
  }
  desenha();
  // A tela se atualiza sozinha quando a sincronização muda de situação.
  parar = aoMudar(function(){
    const foco = document.activeElement && document.activeElement.id;
    if (foco === "email" || foco === "senha") return; // não apaga o que está sendo digitado
    desenha();
  });
  return {titulo:"Ajustes", limpa:function(){ if (parar) parar(); }};
}
