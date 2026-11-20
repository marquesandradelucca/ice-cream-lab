// Service worker: guarda o app no aparelho para funcionar sem internet.
// Ao mudar qualquer arquivo do app, rode: python3 atualiza-versao.py
const VERSAO = "icelab-20261120194737";
const ARQUIVOS = [
  "./", "index.html", "manifest.json", "css/estilo.css", "css/app.css", "js/visual.js", "js/icones.js", "js/telas/guia.js", "js/telas/biblioteca.js",
  "js/app.js", "js/ui.js", "js/dados.js", "js/calculo.js", "js/ingredientes-base.js",
  "js/telas/inicio.js", "js/telas/calculadora.js", "js/telas/ingredientes.js", "js/telas/embreve.js",
  "js/telas/receitas.js", "js/telas/testes.js", "js/telas/lote.js", "js/telas/estudo.js", "js/telas/ideias.js", "js/estudo-base.js", "js/sync.js", "js/telas/ajustes.js", "js/telas/receita.js",
  "icons/icon-192.png", "icons/favicon-32.png", "icons/favicon-64.png", "icons/icon-512.png", "icons/apple-touch-icon.png"
];

self.addEventListener("install", function(ev){
  ev.waitUntil(caches.open(VERSAO).then(function(c){ return c.addAll(ARQUIVOS); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(ev){
  ev.waitUntil(caches.keys().then(function(chaves){
    return Promise.all(chaves.filter(function(k){ return k !== VERSAO; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

// Rede primeiro (para pegar atualizações), com o cache como reserva quando estiver offline.
self.addEventListener("fetch", function(ev){
  if (ev.request.method !== "GET") return;
  ev.respondWith(
    // "no-cache": sempre confere com o servidor se há versão nova do arquivo.
    (new URL(ev.request.url).origin === location.origin ? fetch(ev.request.url, {cache:"no-cache"}) : fetch(ev.request)).then(function(resp){
      if (resp && (resp.ok || resp.type === "opaque")){
        const copia = resp.clone();
        caches.open(VERSAO).then(function(c){ c.put(ev.request, copia); });
      }
      return resp;
    }).catch(function(){
      return caches.match(ev.request, {ignoreSearch:true}).then(function(r){
        return r || (ev.request.mode === "navigate" ? caches.match("index.html") : undefined);
      });
    })
  );
});
