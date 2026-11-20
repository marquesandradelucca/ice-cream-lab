// Ajustes: conta (entrar/criar/sair), situação da sincronização e backup em arquivo.
import { exportaBackup, importaBackup } from "../dados.js?v=20261120192851";
import { situacao, aoMudar, entrar, criarConta, sair, sincroniza } from "../sync.js?v=20261120192851";
import { confirma } from "../ui.js?v=20261120192851";
import { toast } from "../app.js?v=20261120192851";
import { dados, salva } from "../dados.js?v=20261120192851";
import { capa, escolheCapa, icone } from "../visual.js?v=20261120192851";
import { WIDGETS_BIBLIOTECA, capaBiblioteca } from "./biblioteca.js?v=20261120192851";
import { WIDGETS_HOME, capaHome } from "./inicio.js?v=20261120192851";

function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function hora(iso){ try { return new Date(iso).toLocaleString("pt-BR", {day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit"}); } catch (e) { return ""; } }

export function textoSituacao(s){
  if (!s.logado) return "Dados só neste aparelho";
  if (s.sincronizando) return "Sincronizando…";
  if (!s.online) return "Sem internet · envia quando voltar";
  if (s.erro) return s.erro;
  return s.ultima ? "Sincronizado · " + hora(s.ultima) : "Conectado";
}

// Personalização: capas dos blocos de imagem da Home e da Biblioteca (guardadas neste aparelho).
// Lista única: Ingredientes vale para a Home e para a Biblioteca. Tudo fica em db.home.
// Montado na hora do uso (Home e Ajustes se importam mutuamente).
function gruposPersonaliza(){
  const itens = WIDGETS_HOME.concat(WIDGETS_BIBLIOTECA.filter(function(w){ return !WIDGETS_HOME.some(function(h){ return h.id === w.id; }); }));
  return [{chave:"home", titulo:"", itens:itens, capa:function(db, id){
    const w = itens.find(function(x){ return x.id === id; });
    return (db.home && db.home[id]) || (db.biblioteca && db.biblioteca[id]) || (w && w.padrao);
  }}];
}

// Ajustes abre como folha (botão de sliders da Home). A rota #/ajustes leva à Home e abre a folha.
export function render(el){
  location.replace("#/");
  setTimeout(abreAjustes, 60);
  return {titulo:"Ice Cream Lab"};
}

export function abreAjustes(aoFechar){
  if (document.querySelector(".ajustes-folha")) return;
  const veu = document.createElement("div"); veu.className = "ui-veu";
  const f = document.createElement("div"); f.className = "ui-folha ajustes-folha"; f.setAttribute("role", "dialog"); f.setAttribute("aria-label", "Ajustes");
  f.innerHTML = '<span class="puxador"></span><h2>Ajustes</h2><div class="ajustes-corpo"></div>' +
    '<div class="capa-rodape"><button type="button" class="ui-botao preto largo" id="fechaAjustes">Fechar</button></div>';
  document.body.append(veu, f);
  const tela = conteudo(f.querySelector(".ajustes-corpo"));
  const fecha = function(){ tela.limpa(); veu.remove(); f.remove(); if (aoFechar) aoFechar(); };
  veu.addEventListener("click", fecha); f.querySelector("#fechaAjustes").addEventListener("click", fecha);
}

function conteudo(el){
  let parar = null, personalizaAberta = false;   // continua aberta ao redesenhar depois de trocar uma capa
  function desenha(){
    const s = situacao();
    el.innerHTML =
      '<span class="ui-rotulo ajustes-rotulo">Conta</span>' +
      (s.logado ?
        '<section class="ui-cartao ui-vidro ajustes-cartao">' +
          '<b>' + esc(s.email) + '</b>' +
          '<span class="ui-sec' + (s.erro ? ' ajustes-erro' : '') + '">' + esc(textoSituacao(s)) + '</span>' +
          '<div class="rec-acoes bloco-ajustes"><button type="button" class="ui-botao vidro" id="sair">Sair</button>' +
            '<button type="button" class="ui-botao preto" id="sincronizar"' + (s.sincronizando ? ' disabled' : '') + '>Sincronizar</button></div>' +
        '</section>' :
        '<section class="ui-cartao ui-vidro ajustes-cartao">' +
          (s.erro ? '<span class="ui-sec ajustes-erro">' + esc(s.erro) + '</span>' : '<span class="ui-sec">Entre para guardar os dados na nuvem e usar em mais de um aparelho.</span>') +
          '<input id="email" class="ui-campo campo-branco" type="email" autocomplete="username" inputmode="email" autocapitalize="off" placeholder="E-mail" aria-label="E-mail">' +
          '<input id="senha" class="ui-campo campo-branco" type="password" autocomplete="current-password" minlength="6" placeholder="Senha" aria-label="Senha">' +
          '<span class="ui-sec ajustes-erro" id="erroConta" hidden></span>' +
          '<div class="rec-acoes bloco-ajustes"><button type="button" class="ui-botao vidro" id="criar">Criar conta</button>' +
            '<button type="button" class="ui-botao preto" id="entrar">Entrar</button></div>' +
        '</section>') +
      // Personalização: degradê ou foto dos blocos de imagem da Home e da Biblioteca (guardado neste aparelho).
      gruposPersonaliza().map(function(g){
        const db = dados();
        return '<section class="ui-cartao ui-vidro ajustes-cartao"><details class="rec-dobra" id="dobraPersonaliza"' + (personalizaAberta ? ' open' : '') + '>' +
          '<summary><h2>Personalização</h2><span class="rec-seta claro" aria-hidden="true">' + icone("baixo") + '</span></summary><div class="ui-linhas">' +
          g.itens.map(function(w){
            const proprio = db[g.chave] && db[g.chave][w.id];
            return '<button type="button" class="ui-linha personaliza-item" data-g="' + g.chave + '" data-w="' + w.id + '">' +
              '<span class="personaliza-capa" style="--capa:' + capa(w.nome, g.capa(db, w.id)) + '"></span>' +
              '<span class="personaliza-nome">' + w.nome + '<span class="ui-sec">' + (!proprio ? 'Padrão' : proprio.indexOf("paleta:") === 0 ? esc(proprio.slice(7)) : 'Foto') + '</span></span>' +
              '<span class="estudo-seta" aria-hidden="true">' + icone("direita") + '</span></button>';
          }).join("") + '</div></details></section>';
      }).join("") +
      // Backup fica discreto: recolhido, aberto só quando precisar.
      '<section class="ui-cartao ui-vidro ajustes-cartao"><details class="rec-dobra">' +
        '<summary><h2>Backup em arquivo</h2><span class="rec-seta claro" aria-hidden="true">' + icone("baixo") + '</span></summary>' +
        '<p class="ui-sec">Uma cópia de segurança fora do app, para guardar no Arquivos ou no Drive.</p>' +
        '<div class="rec-acoes"><button type="button" class="ui-botao vidro" id="exportar">Exportar</button>' +
          '<button type="button" class="ui-botao vidro" id="importar">Importar</button></div>' +
      '</details></section>' +
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

    el.querySelectorAll(".personaliza-item").forEach(function(b){ b.addEventListener("click", function(){
      const g = gruposPersonaliza().find(function(x){ return x.chave === b.dataset.g; });
      const w = g.itens.find(function(x){ return x.id === b.dataset.w; }), db = dados();
      escolheCapa({titulo:w.nome, semente:w.nome, atual:(db[g.chave] && db[g.chave][w.id]) || "", padrao:w.padrao, rotuloPadrao:"Padrão", foto:true,
        aoEscolher:function(valor){
          db[g.chave] = db[g.chave] || {};
          const antes = db[g.chave][w.id];
          if (valor) db[g.chave][w.id] = valor; else delete db[g.chave][w.id];
          if (!salva()){ if (antes) db[g.chave][w.id] = antes; else delete db[g.chave][w.id]; toast("A foto é grande demais para guardar. Tente outra."); }
          desenha();
        }});
    }); });
    el.querySelector("#dobraPersonaliza").addEventListener("toggle", function(ev){ personalizaAberta = ev.target.open; });
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
