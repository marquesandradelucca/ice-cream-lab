# Plano de implementação · Redesign "cara de app"

Referência visual: Figma "Ice Cream Lab · Redesign", páginas 04 (wireframes) e 05 (teste de visual).
https://www.figma.com/design/iistNj8n7z9Pc9G7dIEYV5

Regra geral: cada fase termina com preview local (Mac + iPhone pela rede), aprovação sua e só então publicação.
Nada de cálculo muda (regras de `calculo.js` ficam iguais).

---

## Fase 0 · Decisões (fechadas)

1. **Modo escuro:** desconsiderado. O app fica só no modo claro.
2. **Escalas de avaliação (5 níveis):**
   - Doçura: **Pouco · Média · Ideal · Doce · Enjoativa**
   - Dureza: **Mole · Macia · Ideal · Firme · Dura**
   - Lotes antigos (3 níveis): dureza mole→Mole, ideal→Ideal, dura→Dura; doçura pouco→Pouco, ideal→Ideal, muito→Doce.
3. **Desktop:** fica para depois. Até lá, no computador o app aparece com a largura de celular, centralizado.
4. **Fonte:** fonte do sistema no iPhone e no Mac (SF Pro); Inter nos outros aparelhos.

---

## Fase 1 · Fundação visual (sem mudar telas ainda)

Arquivos: `css/estilo.css`, `js/ui.js`, `GUIA-VISUAL.md`.

- **Tokens novos** (substituem os atuais):
  - Cores: fundo branco, tinta #141414, secundário #5C5C5C / #8E8E8E, faixas de cálculo (ok/atenção/fora) mantidas.
  - Espaço: 4 / 8 / 12 / 16 / 24 (margem lateral 16, entre blocos 12, respiro de cartão 16).
  - Cantos: 24 (cartões, painéis, blocos), 16 (blocos pequenos, campos), 12 (seletores internos), pílula.
  - Texto: 34 / 28 / 20 / 17 / 15 / 13 / 11.
  - Alturas: botão 48, filtro 34, etiqueta 26.
- **Componentes CSS** (classes reutilizáveis):
  - `vidro-claro` (sobre fundo branco) e `vidro-escuro` (sobre imagem, texto branco), com `backdrop-filter`.
  - Botões: preto e vidro. Filtro, etiqueta (Final preta / Teste vidro), seletor de opções sem fundo.
  - Bloco de imagem (capa + escurecimento suave + texto branco que quebra linha).
  - Cabeçalho padrão (título 34, botões redondos de vidro à direita) e cabeçalho de navegação (voltar + título 20).
  - Folha (sheet) que sobe de baixo, vidro quase opaco, com puxador.
  - Estrelas em ícone; ícones de traço fino (SVG).
- **Capa automática em degradê:** função que gera o degradê pela cor do estilo/sabor quando a receita não tem foto.
- Atualizar `GUIA-VISUAL.md` com as regras novas.

## Fase 2 · Navegação com abas

Arquivos: `index.html`, `js/app.js`.

- Barra de abas fixa embaixo: **Home · Ideias · Calculadora · Receitas · Biblioteca**.
- Rotas novas: `#/` Home, `#/ideias`, `#/calculadora` (rascunho livre), `#/receitas`, `#/biblioteca`.
- Navegação empilhada dentro de cada aba (voltar sobe um nível), por exemplo `#/receitas/<id>` → `#/receitas/<id>/versao/<v>` (calculadora da receita) → voltar leva à receita.
- Ajustes vira folha aberta pelo botão do Home (não é mais rota).
- "Testes" deixa de existir como tela: entra no filtro "Em teste" de Receitas. Endereços antigos redirecionam.
- Modo bancada (lote) em tela cheia, sem abas.

## Fase 3 · Telas (uma por vez, cada uma com aprovação)

Ordem sugerida, do mais visto ao menos visto:

1. **Home** (`inicio.js`): Para avaliar (botão no canto), Calculadora genérica, Ideias, Ingredientes, bloco Receitas com faixa lateral, Estudo.
2. **Receitas** (`receitas.js` + `testes.js`): filtros Todas / Em teste / Finais, cartões de capa de 200 px.
3. **Receita** (`receita.js`): capa no fundo inteiro, painel de vidro, versões, lotes com estrelas e avaliação.
4. **Receita final** (`receita.js`, modo pronta): ingredientes, 250 g / 500 g / 1 kg, Começar lote.
5. **Calculadora** (`calculadora.js`): cartão do nome, seletor de estilo, gráfico de intervalos, ingredientes; versão "dentro da receita"; folha Salvar (nova versão / nova receita / foto de capa).
6. **Lote** (`lote.js`): bancada sobre a capa com vidro, um ingrediente por vez; Avaliar com estrelas grandes e escalas de 5 níveis (migração da Fase 0).
7. **Ideias** (`ideias.js`): cartões de vidro empilhados com botão Começar.
8. **Biblioteca** (`estudo.js` + `ingredientes.js`): hub de blocos, Tema, grade de Ingredientes, detalhe do ingrediente com barra de composição.
9. **Ajustes** (`ajustes.js`): conteúdo dentro da folha.

## Fase 4 · Fotos de capa

Arquivos: `js/sync.js`, `js/dados.js`, telas de receita e folha Salvar; `supabase/esquema.sql`.

1. Você cria a pasta de arquivos (bucket) no painel do Supabase seguindo um passo a passo (sem chave secreta).
2. Regras de acesso: cada usuário só lê e grava a própria pasta.
3. No aparelho: escolher/tirar foto → reduzir para ~1600 px e ~200–300 KB → enviar.
4. A receita guarda só o caminho da foto; sincronização atual continua igual.
5. Offline: foto guardada no aparelho; envio em fila quando a internet voltar.
6. Trocar/apagar capa ou excluir receita apaga a foto antiga.
7. Sem foto: capa automática em degradê (Fase 1).

## Fase 5 · Desktop (depois)

Decidir o layout de computador (provavelmente barra lateral no lugar das abas e duas colunas onde já fizemos).

---

## Riscos e cuidados

- **Desfoque (vidro) no Safari:** usar só em painéis, barra de abas e folhas; listas longas com fundo sólido para a rolagem não pesar.
- **Contraste:** texto branco sempre com escurecimento ou véu por baixo.
- **Dados existentes:** nenhuma receita, versão ou lote se perde; só a avaliação ganha os nomes novos.
- **Cache do Safari:** rodar `python3 atualiza-versao.py` a cada mudança.
