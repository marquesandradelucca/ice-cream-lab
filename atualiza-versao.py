# Marca todos os arquivos do app com um número de versão novo (?v=N), para o celular
# nunca ficar preso numa cópia antiga guardada pelo navegador.
# Uso: python3 atualiza-versao.py   (rode depois de mudar qualquer arquivo do app)
import os, re, time

raiz = os.path.dirname(os.path.abspath(__file__))
versao = time.strftime("%Y%m%d%H%M%S")

def troca(caminho, padrao, novo):
    p = os.path.join(raiz, caminho)
    texto = open(p, encoding="utf-8").read()
    open(p, "w", encoding="utf-8").write(re.sub(padrao, novo, texto))

# Imports entre módulos: from "./x.js" ou "./x.js?v=..." -> "./x.js?v=<versao>"
for pasta, _, arquivos in os.walk(os.path.join(raiz, "js")):
    for nome in arquivos:
        if nome.endswith(".js"):
            rel = os.path.relpath(os.path.join(pasta, nome), raiz)
            troca(rel, r'from "(\.{1,2}/[^"?]+\.js)(\?v=\d+)?"', r'from "\1?v=' + versao + '"')

troca("index.html", r'(js/app\.js|css/estilo\.css)(\?v=\d+)?"', r'\1?v=' + versao + '"')
troca("sw.js", r'const VERSAO = "[^"]*"', 'const VERSAO = "icelab-' + versao + '"')
print("versão", versao)
