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

// Markdown simples das páginas de Estudo: **negrito**, _itálico_, listas ("- " e "1. "),
// tabelas com "|" e parágrafos separados por linha em branco.
function escHtml(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function inline(t){
  return escHtml(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[\s(])_(.+?)_(?=[\s).,:;!?]|$)/g, "$1<i>$2</i>");
}
export function mdParaHtml(md){
  const linhas = String(md || "").replace(/\r/g, "").split("\n");
  let html = "", i = 0;
  while (i < linhas.length){
    const l = linhas[i];
    if (!l.trim()){ i++; continue; }
    if (/^\s*\[[^\]]+\]\(https?:\/\/[^)\s]+\)\s*$/.test(l)){
      let links = "";
      while (i < linhas.length && /^\s*\[[^\]]+\]\(https?:\/\/[^)\s]+\)\s*$/.test(linhas[i])){
        const m = linhas[i].match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
        links += '<a class="item-lista link-externo" href="' + escHtml(m[2]) + '" target="_blank" rel="noopener">' + escHtml(m[1]) + '</a>';
        i++;
      }
      html += '<div class="lista-links">' + links + "</div>"; continue;
    }
    if (/^\s*\|/.test(l)){
      const rows = [];
      while (i < linhas.length && /^\s*\|/.test(linhas[i])){ rows.push(linhas[i]); i++; }
      const cel = function(r){ return r.trim().replace(/^\||\|$/g, "").split("|").map(function(c){ return c.trim(); }); };
      const corpo = rows.filter(function(r){ return !/^\s*\|[\s\-|:]+\|\s*$/.test(r); });
      html += '<div class="tabela-rolagem"><table><thead><tr>' + cel(corpo[0]).map(function(c){ return "<th>" + inline(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        corpo.slice(1).map(function(r){ return "<tr>" + cel(r).map(function(c){ return "<td>" + inline(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
      continue;
    }
    if (/^\s*- /.test(l)){
      let items = "";
      while (i < linhas.length && /^\s*- /.test(linhas[i])){ items += "<li>" + inline(linhas[i].replace(/^\s*- /, "")) + "</li>"; i++; }
      html += "<ul>" + items + "</ul>"; continue;
    }
    if (/^\s*\d+\. /.test(l)){
      let items = "";
      while (i < linhas.length && /^\s*\d+\. /.test(linhas[i])){ items += "<li>" + inline(linhas[i].replace(/^\s*\d+\. /, "")) + "</li>"; i++; }
      html += "<ol>" + items + "</ol>"; continue;
    }
    const par = [];
    while (i < linhas.length && linhas[i].trim() && !/^\s*(\||- |\d+\. |\[[^\]]+\]\(https?:)/.test(linhas[i])){ par.push(linhas[i]); i++; }
    html += "<p>" + inline(par.join(" ")) + "</p>";
  }
  return html;
}

// Lápis ao lado de nomes editáveis (calculadora e receita).
export const LAPIS = '<svg class="lapis" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
