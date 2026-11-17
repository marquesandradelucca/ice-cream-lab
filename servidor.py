# Servidor local para testar no celular pelo Wi-Fi durante o desenvolvimento.
# Uso: python3 servidor.py   (depois abra http://IP-DO-MAC:8000 no celular)
# Manda "no-cache" para o navegador sempre buscar a versão mais nova dos arquivos.
import http.server, os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

class SemCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

# Fila maior: o app pede muitos arquivos de uma vez e a fila padrão (5) derrubava conexões.
class Servidor(http.server.ThreadingHTTPServer):
    request_queue_size = 128

Servidor(("0.0.0.0", 8000), SemCache).serve_forever()
