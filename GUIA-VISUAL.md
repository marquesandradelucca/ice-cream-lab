# Guia visual do Ice Cream Lab

Regras de aparência do app. Toda tela nova segue este guia; para mudar algo no visual,
muda-se aqui primeiro e depois em `css/estilo.css` (onde cada valor é um token no `:root`).

Princípio: o app é usado no celular, na bancada, com uma mão. Poucas coisas por tela,
alvos de toque grandes, nada que dependa de precisão. Identidade herdada da calculadora v1.1:
fonte mono, tons neutros, sem enfeites.

---

## 1. Cores

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--paper` | #FCFCFA | #131513 | fundo da página |
| `--ink` | #1B1D1B | #EAEBE7 | texto principal, pílula preta |
| `--muted` | #686E68 | #A8ADA6 | texto secundário, legendas |
| `--line` | #E5E5DE | #282B27 | pílula cinza, divisórias, campos |
| `--surface` | mistura de line e paper | idem | fundo de card |
| `--ok` / `--atencao` / `--critico` | verde / âmbar / vermelho | idem | estado de faixas e avisos; vermelho também para apagar |

Cor nunca é a única informação: todo estado colorido vem com texto.

## 2. Tipografia

Fonte única: **IBM Plex Mono**.

| Nível | Tamanho | Peso | Onde |
|---|---|---|---|
| Título | 18px | 600 | marca na barra, título da página, nome da receita/ingrediente quando é o título da página |
| Seção | 16px | 500 | títulos de seção ("Ingredientes", "Composição", "Versões"), nome da receita na calculadora |
| Corpo | 15px | 400 | textos, listas, nomes em cards, números, **textos de botões e pílulas** |
| Pequeno | 13px | 400 | legendas, descrições, datas, notas, faixas dos gráficos |

- Campos de digitar usam 16px (abaixo disso o iPhone dá zoom ao tocar).
- Única exceção de negrito no corpo: o número da versão nos cards de versão (600).
- Ícones (voltar, −, +, ×) têm tamanho próprio; não são texto.

## 3. Espaçamento

Escala única. Não usar valores fora dela.

| Token | Valor | Quando |
|---|---|---|
| `--esp-colado` | 4px | duas linhas que são uma coisa só (nome da receita → "v1 · rascunho") |
| `--esp-grupo` | 8px | itens do mesmo grupo (cards de uma lista, pílulas lado a lado) |
| `--esp-secao` | 12px | título de seção → seu conteúdo |
| `--esp-pagina` | 24px | título da página → conteúdo da página |
| `--esp-bloco` | 32px | entre blocos (fim de um card → próximo título de seção) |
| `--esp-card` | 16px | margem interna dos cards |
| `--esp-lateral` | 16px | margem lateral da tela |

## 4. Formas

- **Pílula** (todo botão com texto, seletores, atalhos): altura **40px**, cantos totalmente redondos.
  - Só existem duas: **preta** (ação principal, opção escolhida) e **cinza** (ação secundária, opção não escolhida).
  - Toda pílula cinza usa a mesma cor de texto (`--ink`); toda pílula preta usa `--paper`.
  - Nunca pílula com borda. Ação de apagar: pílula cinza com texto vermelho.
  - Duas ações lado a lado dividem a largura (50/50).
  - Texto da pílula: corpo, peso normal.
- **Card**: fundo `--surface`, cantos de **8px**, sem borda nem sombra, padding de 16px.
  - Itens de lista (receitas, testes, ingredientes) são cards empilhados com 8px entre eles.
  - Card recolhível: título à esquerda, setinha à direita, abre e fecha ao toque.
- **Campo de peso**: pílula cinza com o "g" dentro (ex.: `− 20g +`).
- **Campo de texto**: fundo `--paper` dentro de cards, ou `--surface` fora; cantos de 8px; 48px de altura.
- **Nome editável** (receita na calculadora e na página da receita): rótulo pequeno "Nome" em cima e campo cinza (`--surface`) de 48px, texto de campo (16px, peso normal) — mesmo visual dos outros campos, sem lápis nem traço.
- Todo arredondamento que não é pílula usa 8px.

## 5. Interação

- **Hover** (só computador) e **toque** (celular): pílulas e cards ficam pretos.
- **Clique**: o elemento afunda levemente (96% nos botões, 98,5% nos cards) e volta com uma mola suave.
- Seletores de pílula trocam direto, sem animação.
- Movimento reduzido no sistema: sem afundar e sem animações, só leve mudança de opacidade.
- Confirmações usam a janela própria do app (nunca a do sistema). Apagar = botão vermelho.
- Menus usam o menu próprio do app (nunca o seletor do sistema).

## 6. Estrutura de uma tela

```
[‹]  Ice Cream Lab                ← barra: flechinha (sobe um nível) + marca (vai à home)
Título da página                  ← só nas telas principais; nas internas o conteúdo traz o próprio título
                                  ← 24px
Título de seção
                                  ← 12px
[ card ]
                                  ← 32px
Título de seção
...
```

- **Voltar** sempre sobe um nível no mapa do app (não refaz o caminho):
  Home → Calculadora / Receitas / Testes / Ingredientes → Receita / Receita pronta / Ingrediente.
- A marca "Ice Cream Lab" está em todas as telas e leva à home.

## 7. Textos

- Português do Brasil, frases curtas, sem jargão desnecessário.
- Botões dizem a ação ("Salvar", "+ ingrediente"), não o objeto.
- Ações que apagam pedem confirmação dizendo o que será apagado.

---

## Redesign "cara de app" (em implantação)

As telas refeitas usam `css/app.css` (classes `ui-*`) e `js/visual.js` (ícones, capas em degradê, estrelas).
Referência: Figma "Ice Cream Lab · Redesign", página 05. Plano: `PLANO-REDESIGN.md`. Prévia dos componentes: `#/guia`.

- Só modo claro. Fundo branco, tinta #141414.
- Espaço: 4 / 8 / 12 / 16 / 24 (margem 16, entre blocos 12, respiro de cartão 16).
- Cantos: 24 cartões e blocos, 16 blocos pequenos e campos, 12 seletores internos, pílula em botões.
- Alturas: botão 48, filtro 34, etiqueta 26, botão redondo 40.
- Texto: 34 tela · 28 destaque · 20 navegação · 17 cartão · 15 texto · 13 secundário · 11 rótulo.
- Vidro claro sobre branco (texto escuro); vidro escuro sobre imagem (texto branco). Botão que não é preto é vidro.
- Cartão de imagem para coisas (receitas, ingredientes); cartão de vidro para ferramentas e dados.
- Sem foto, a capa é um degradê automático pela cor do sabor.
- Escalas: Dureza Mole · Macia · Ideal · Firme · Dura; Doçura Pouco · Média · Ideal · Doce · Enjoativa.

- **Ações destrutivas** (excluir, apagar, descartar): botão de vidro com texto vermelho (`.ui-botao.perigo`, cor `--ui-fora`). Na confirmação, o botão de confirmar é vermelho cheio.
- **Botão principal sobre foto/degradê** (telas com capa ao fundo, blocos de imagem): branco com texto escuro, nunca preto. Em fundo branco e dentro de folhas, continua preto.
- **Sem contornos**: cartões, botões, filtros e campos não têm borda (vidro claro e escuro); a separação vem só do preenchimento do vidro.
- **Sem linhas divisórias** nas listas (ingredientes, versões, lotes, composição, ajustes): a separação vem do espaçamento.
- **Vidro escuro pequeno com desfoque**: etiquetas, pílulas, seletores e botões de vidro escuro sobre capa/foto sempre levam o desfoque (blur 30 + saturação).
- **Sombra única** (`--ui-sombra`): a mesma em cartões, blocos com degradê, botões, filtros e barra de abas.
- **Controles de vidro sobre capa/foto**: botões secundários, redondos, etiquetas, seletores, campos e ˅ usam branco translúcido 16% (`--ui-vidro-interno`), dentro ou fora de painel. Só os painéis grandes são vidro escuro.
