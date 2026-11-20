// Sincronização com o Supabase (etapa 5): login por e-mail e senha e cópia dos dados na nuvem.
// Sem bibliotecas: fala direto com a API do Supabase (auth e REST).
//
// Como funciona:
// - Cada item do app (ingrediente, receita, versão, lote, ideia, tema de estudo e o rascunho da
//   calculadora) é um registro na tabela "registros".
// - O app lembra como cada item estava na última sincronização. O que mudou desde então sobe;
//   o que chegou de outro aparelho desce. Se o mesmo item mudou dos dois lados, vale o mais recente.
// - Sem internet, nada se perde: as mudanças ficam no aparelho e sobem quando a conexão voltar.
import { dados, salvaLocal } from "./dados.js?v=20261120164520";

const URL_SUPABASE = "https://bigruncntcxnckcttjuw.supabase.co";
const CHAVE_PUBLICA = "sb_publishable_Mff_WvrBX1Qgyvbx0jn8eA_YsDL78KI"; // pública de propósito; a tabela é protegida por RLS
const CHAVE_SESSAO = "icelab-sessao";
const CHAVE_ESTADO = "icelab-sync";
const COLECOES = ["ingredientes", "receitas", "versoes", "lotes", "ideias", "estudo", "fotos"];

let sessao = ler(CHAVE_SESSAO);
let estado = ler(CHAVE_ESTADO) || novoEstado();
let ouvintes = [];
let temporizador = null, emAndamento = false;

function ler(k){ try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function grava(k, v){ try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function novoEstado(){ return {cursor:null, conhecido:{}, editado:{}, ultima:null, erro:null, usuario:null}; }

// ---------- Situação, para a tela de Ajustes ----------
export function situacao(){
  return {logado:!!sessao, email:sessao && sessao.user && sessao.user.email, ultima:estado.ultima,
    erro:estado.erro, sincronizando:emAndamento, online:navigator.onLine};
}
export function aoMudar(fn){ ouvintes.push(fn); return function(){ ouvintes = ouvintes.filter(function(x){ return x !== fn; }); }; }
function avisa(){ ouvintes.forEach(function(fn){ try { fn(situacao()); } catch (e) {} }); }

// ---------- Login ----------
async function chamaAuth(caminho, corpo){
  const r = await fetch(URL_SUPABASE + "/auth/v1/" + caminho, {
    method:"POST", headers:{"Content-Type":"application/json", apikey:CHAVE_PUBLICA}, body:JSON.stringify(corpo)
  });
  const j = await r.json().catch(function(){ return {}; });
  if (!r.ok) throw new Error(traduzErro(j));
  return j;
}
function traduzErro(j){
  const m = (j && (j.msg || j.error_description || j.message || j.error)) || "";
  if (/invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
  if (/already registered|already exists/i.test(m)) return "Esse e-mail já tem conta. Use “Entrar”.";
  if (/password should be at least/i.test(m)) return "A senha precisa ter pelo menos 6 caracteres.";
  if (/email not confirmed/i.test(m)) return "Confirme o e-mail pelo link que o Supabase enviou e tente de novo.";
  if (/invalid.*email|email.*invalid/i.test(m)) return "Esse e-mail não parece válido.";
  return m || "Não foi possível falar com o servidor.";
}
function guardaSessao(j){
  sessao = {access_token:j.access_token, refresh_token:j.refresh_token,
    expira:Date.now() + (Number(j.expires_in) || 3600) * 1000, user:{id:j.user && j.user.id, email:j.user && j.user.email}};
  grava(CHAVE_SESSAO, sessao);
}

export async function entrar(email, senha){
  const j = await chamaAuth("token?grant_type=password", {email:email, password:senha});
  aoEntrar(j);
}
export async function criarConta(email, senha){
  const j = await chamaAuth("signup", {email:email, password:senha});
  if (!j.access_token) throw new Error("Conta criada. Confirme pelo link no seu e-mail e depois toque em “Entrar”.");
  aoEntrar(j);
}
function aoEntrar(j){
  // Outra pessoa entrando neste aparelho começa a sincronização do zero.
  if (estado.usuario && j.user && estado.usuario !== j.user.id) estado = novoEstado();
  guardaSessao(j);
  estado.usuario = sessao.user.id; estado.erro = null; grava(CHAVE_ESTADO, estado);
  avisa();
  sincroniza();
}
export function sair(){
  sessao = null; grava(CHAVE_SESSAO, null);
  estado.erro = null; grava(CHAVE_ESTADO, estado);
  avisa();
}

async function token(){
  if (!sessao) return null;
  if (Date.now() < sessao.expira - 60000) return sessao.access_token;
  try {
    const j = await chamaAuth("token?grant_type=refresh_token", {refresh_token:sessao.refresh_token});
    guardaSessao(j);
    return sessao.access_token;
  } catch (e) {
    // Sessão vencida de vez: pede para entrar de novo, sem apagar nada do aparelho.
    if (navigator.onLine){ sair(); estado.erro = "Sua sessão expirou. Entre de novo para continuar sincronizando."; grava(CHAVE_ESTADO, estado); avisa(); }
    return null;
  }
}

async function rest(metodo, caminho, corpo, extra){
  const t = await token(); if (!t) throw new Error("sem sessão");
  const r = await fetch(URL_SUPABASE + "/rest/v1/" + caminho, {
    method:metodo,
    headers:Object.assign({"Content-Type":"application/json", apikey:CHAVE_PUBLICA, Authorization:"Bearer " + t}, extra || {}),
    body:corpo ? JSON.stringify(corpo) : undefined
  });
  if (!r.ok){ const j = await r.json().catch(function(){ return {}; }); throw new Error(j.message || ("Erro " + r.status)); }
  return r.status === 204 ? null : r.json();
}

// ---------- Itens do app como registros ----------
function chave(tipo, id){ return tipo + ":" + id; }
function itensLocais(){
  const db = dados(), out = {};
  COLECOES.forEach(function(tipo){
    (db[tipo] || []).forEach(function(item){ if (item && item.id != null) out[chave(tipo, item.id)] = {tipo:tipo, id:String(item.id), dados:item}; });
  });
  out[chave("calc", "atual")] = {tipo:"calc", id:"atual", dados:db.calc};
  return out;
}
function impressao(item){ return JSON.stringify(item); }

// Chamado a cada salvamento: anota a hora das mudanças e agenda o envio.
export function notificaMudanca(){
  const agora = Date.now(), locais = itensLocais();
  Object.keys(locais).forEach(function(k){
    const h = impressao(locais[k].dados);
    if (estado.conhecido[k] !== h && !estado.editado[k]) estado.editado[k] = agora;
  });
  Object.keys(estado.conhecido).forEach(function(k){ if (!locais[k] && !estado.editado[k]) estado.editado[k] = agora; });
  grava(CHAVE_ESTADO, estado);
  if (!sessao) return;
  clearTimeout(temporizador);
  temporizador = setTimeout(sincroniza, 2500);
}

function aplicaRemoto(reg){
  const db = dados();
  if (reg.tipo === "calc"){ if (!reg.apagado && reg.dados) db.calc = reg.dados; return; }
  if (COLECOES.indexOf(reg.tipo) < 0) return;
  const lista = db[reg.tipo] || (db[reg.tipo] = []);
  const i = lista.findIndex(function(x){ return String(x.id) === reg.id; });
  if (reg.apagado){ if (i >= 0) lista.splice(i, 1); return; }
  if (i >= 0) lista[i] = reg.dados; else lista.push(reg.dados);
}

// ---------- Sincronizar: primeiro baixa o que é novo, depois envia o que mudou aqui ----------
export async function sincroniza(){
  if (!sessao || emAndamento) return;
  if (!navigator.onLine){ estado.erro = null; avisa(); return; }
  emAndamento = true; avisa();
  try {
    const primeira = !estado.cursor;
    // 1. Baixar
    let caminho = "registros?select=tipo,id,dados,apagado,alterado,atualizado_em&order=atualizado_em.asc";
    if (estado.cursor) caminho += "&atualizado_em=gt." + encodeURIComponent(estado.cursor);
    const remotos = await rest("GET", caminho);
    const locais = itensLocais();
    let mudouAqui = false;
    remotos.forEach(function(reg){
      const k = chave(reg.tipo, reg.id);
      const editadoAqui = estado.editado[k];
      // Na primeira vez, o que já está na nuvem prevalece sobre o que existe só como padrão aqui;
      // depois, vence a mudança mais recente.
      if (!editadoAqui || primeira || Number(reg.alterado) >= editadoAqui){
        aplicaRemoto(reg); mudouAqui = true;
        delete estado.editado[k];
        estado.conhecido[k] = reg.apagado ? undefined : impressao(reg.dados);
        if (reg.apagado) delete estado.conhecido[k];
      }
      if (!estado.cursor || reg.atualizado_em > estado.cursor) estado.cursor = reg.atualizado_em;
    });
    if (mudouAqui) salvaLocal();

    // 2. Enviar o que mudou aqui desde a última vez (inclusive itens apagados)
    const agora = itensLocais(), envio = [];
    Object.keys(agora).forEach(function(k){
      const h = impressao(agora[k].dados);
      if (estado.conhecido[k] !== h) envio.push({k:k, h:h, reg:{tipo:agora[k].tipo, id:agora[k].id, dados:agora[k].dados, apagado:false, alterado:estado.editado[k] || Date.now()}});
    });
    Object.keys(estado.conhecido).forEach(function(k){
      if (!agora[k]){ const p = k.split(":"); envio.push({k:k, h:null, reg:{tipo:p[0], id:p.slice(1).join(":"), dados:null, apagado:true, alterado:estado.editado[k] || Date.now()}}); }
    });
    for (let i = 0; i < envio.length; i += 200){
      const lote = envio.slice(i, i + 200);
      const resp = await rest("POST", "registros?on_conflict=user_id,tipo,id&select=atualizado_em",
        lote.map(function(x){ return x.reg; }), {Prefer:"resolution=merge-duplicates,return=representation"});
      lote.forEach(function(x){
        if (x.h == null) delete estado.conhecido[x.k]; else estado.conhecido[x.k] = x.h;
        delete estado.editado[x.k];
      });
      // O cursor avança junto, para não baixar de volta o que acabou de subir.
      (resp || []).forEach(function(r){ if (r.atualizado_em > (estado.cursor || "")) estado.cursor = r.atualizado_em; });
    }
    estado.ultima = new Date().toISOString(); estado.erro = null;
  } catch (e) {
    if (String(e.message) !== "sem sessão") estado.erro = navigator.onLine ? "Não foi possível sincronizar: " + e.message : null;
  } finally {
    emAndamento = false; grava(CHAVE_ESTADO, estado); avisa();
  }
}

// Sincroniza ao abrir, ao voltar a internet e ao voltar para o app.
export function iniciaSync(){
  window.addEventListener("online", function(){ sincroniza(); });
  document.addEventListener("visibilitychange", function(){ if (document.visibilityState === "visible") sincroniza(); });
  if (sessao) sincroniza();
}
