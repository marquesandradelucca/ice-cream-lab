// Conteúdo inicial da área Estudo, copiado do "Ice Cream Lab" do Lucca no Notion
// (páginas Fundamentos, Ingredientes e Bases e técnicas, em 16/11/2026).
// Cada seção "##" do Notion virou um tema. O Notion continua como cópia de segurança.
// Formato: Markdown simples — **negrito**, _itálico_, listas com "- " ou "1. " e tabelas com "|".
export const GRUPOS_ESTUDO = [
  ["fundamentos", "Fundamentos", "A ciência por trás: o que cada componente faz na mistura e como equilibrá-los."],
  ["ingredientes", "Ingredientes", "O que cada ingrediente faz, quanto usar e como incorporar sem errar."],
  ["bases", "Bases e técnicas", "As bases de onde sai cada sabor e o processo completo, da pasteurização ao freezer."],
  ["referencias", "Referências", "De onde vem o conteúdo do Estudo."]
];

export const ESTUDO_BASE = [
// ===== Fundamentos =====
{id:"composicao", grupo:"fundamentos", titulo:"Composição de uma mistura", md:`Um sorvete tem, ao mesmo tempo, as três fases que convivem na nossa vida: **água líquida**, que é o que liga tudo e costuma ser 60 a 70% do peso; **ar**, incorporado na batedura, que é o colchão que dá a consistência maleável; e **sólidos**, que trazem sabor, aroma, cor e corpo. Parte da água também está congelada, e a tensão entre a água congelada e a líquida é o que define a dureza. Sólido não congela, e nem toda a água congela de uma vez: por isso existe uma faixa de temperatura em que o creme é servido.

Quimicamente, um sorvete é quatro tipos de mistura de uma vez, além de uma espuma:

- **Solução:** os açúcares e os sais dissolvidos na água, que não dá para separar por meios mecânicos. É aí que nasce o abaixamento do ponto de congelamento.
- **Colóide:** as partículas minúsculas do próprio leite, pequenas demais para se separarem sozinhas.
- **Emulsão:** as gotículas de gordura dispersas na água, que sozinhas não se misturariam.
- **Suspensão:** as partículas maiores, como os cristais de gelo e os sólidos insolúveis.
- **Espuma:** as bolhas de ar presas nessa mistura.

Os sólidos costumam ser agrupados pela função que exercem:

- **Água:** vira os cristais de gelo. Quanto mais água livre, mais gelo e mais dureza.
- **Açúcares:** adoçam, baixam o ponto de congelamento e, ao interagir com a água, deixam a textura mais lisa. São o grupo mais decisivo.
- **Gordura:** dá cremosidade, carrega aromas e ajuda a segurar o ar. Em excesso, pesa na boca e abafa sabores delicados.
- **Proteínas:** dobram-se em certas condições e passam a interagir com os glóbulos de gordura, os cristais de gelo e as bolhas de ar. É esse trabalho que lisa a textura.
- **Outros sólidos:** tudo o que não é açúcar, gordura ou proteína. Amidos e fibras dão volume e elasticidade; sais salgam e também baixam o ponto de congelamento; polióis adoçam e baixam o ponto de congelamento.
- **Estabilizantes:** cadeias longas de carboidrato que funcionam como uma malha segurando as outras moléculas no lugar. Prendem água e seguram o crescimento dos cristais.
- **Emulsificantes:** organizam a gordura durante a batedura, o que dá uma textura mais lisa e seca.
- **Ar:** entra na batedura e dá leveza e maciez.

No balanceamento, os sólidos do leite aparecem juntos como **SLNG** (sólidos lácteos não gordurosos): proteínas, lactose e minerais. Em excesso, a lactose cristaliza e a textura fica arenosa. E **sólidos totais** é tudo o que não é água: o número que resume o corpo da mistura.`},

{id:"balanceamento", grupo:"fundamentos", titulo:"Balanceamento (gordura, sólidos, açúcares)", md:`Balancear é ajustar as proporções para a mistura ter corpo, doçura e maciez certos na temperatura em que será servida. Faixas de referência, em % do peso da mistura (variam um pouco conforme a fonte):

| Componente | Gelato | Ice cream | Sorbet |
| --- | --- | --- | --- |
| Gordura | 4–9% | 10–16% | 0% |
| SLNG | 7–11% | 9–12% | 0% |
| Açúcares | 16–22% | 14–18% | 25–32% |
| Sólidos totais | 36–42% | 36–42% | 28–35% |
| Estabilizantes | 0,1–0,5% | 0,1–0,5% | 0,1–0,5% |

Uma fórmula de gelato citada pelo Goff fica em 8% de gordura, 7,5% de SLNG e 16% de açúcar, com até 4% de sólidos de gema e sem estabilizante nem emulsificante.

**Como calcular**

1. Liste cada ingrediente com o peso e a composição (gordura, SLNG, açúcares, outros sólidos, água).
2. Multiplique o peso de cada ingrediente pelo percentual de cada componente e some por componente.
3. Divida cada soma pelo peso total da mistura para chegar ao percentual.
4. Compare com as faixas e ajuste: creme para a gordura, leite em pó desnatado para os SLNG, açúcares para a doçura e a maciez.

**Sinais de desequilíbrio**

- Poucos sólidos totais: textura aguada, com cristais de gelo.
- Sólidos demais: mistura pesada e pastosa. Se o excesso for de SLNG, fica arenosa.
- Gordura demais: sensação amanteigada e sabor abafado.
- Açúcar demais: mole, doce em excesso e derrete rápido. Açúcar de menos: duro e sem corpo.`},

{id:"pac-pod", grupo:"fundamentos", titulo:"PAC e POD", md:`- **POD (poder adoçante):** a doçura de um açúcar comparada à da sacarose, que vale 100.
- **PAC (poder anticongelante):** quanto um açúcar baixa o ponto de congelamento, comparado à sacarose, que vale 100. Moléculas menores têm PAC maior.

Com os dois números dá para controlar doçura e maciez separadamente. A dextrose, por exemplo, amacia quase o dobro da sacarose e adoça menos.

| Açúcar | POD | PAC |
| --- | --- | --- |
| Sacarose | 100 | 100 |
| Dextrose | 70 | 190 |
| Frutose | 170 | 190 |
| Açúcar invertido | 125 | 190 |
| Mel | 130 | 190 |
| Lactose | 16 | 100 |
| Glucose em pó DE 38–40 | 23 | 70 |
| Maltodextrina DE 18 | 10–15 | 33 |
| Sal | 0 | 590 |
| Álcool puro | 0 | 740 |

O PAC é o mesmo número que a literatura técnica chama de **equivalente de sacarose (SE)**, só que em escala de 100. Os fatores de SE do Goff, por grama de ingrediente, são: sólidos lácteos × 0,545 (a lactose que eles contêm), sólidos de soro × 0,765, sacarose e outros dissacarídeos × 1, monossacarídeos como dextrose e frutose × 1,9, e xaropes de glucose conforme o DE: 10 DE × 0,2, 36 DE × 0,6, 42 DE × 0,8, 62 DE × 1,2. Gordura, proteínas, estabilizantes e as frações de alto peso molecular dos xaropes não baixam o ponto de congelamento, mas reduzem a água disponível, o que o abaixa de forma indireta.

Os valores são aproximados e mudam um pouco de fonte para fonte. Nos xaropes, dependem também do teor de água. Aplique o coeficiente apenas à parte do ingrediente que é de fato açúcar: a dextrose vendida em pó é mono-hidratada e tem cerca de 92% de sólidos.

A glucose em pó admite duas convenções, e vale saber qual você está usando. Uma conta todos os sólidos como açúcar e aplica um coeficiente baixo, que já embute a mistura de sacarídeos; é a que acerta melhor o PAC e a que a calculadora usa. A outra trata só a fração indicada pelo número DE como açúcar (num pó 38 DE, 96% de sólidos, dos quais 38% contam); é a que serve para declarar açúcares num rótulo. Pela primeira, o percentual de açúcares da receita sai um pouco acima do que apareceria numa tabela nutricional.

**Como calcular**

Para cada açúcar, multiplique os gramas pelo coeficiente e divida por 100. Some tudo, por kg de mistura. Inclua a lactose do leite, que é cerca de metade dos SLNG.

Exemplo, em 1 kg de mistura com 140 g de sacarose, 40 g de dextrose e 50 g de lactose:

- PAC = 140 + 76 + 50 = 266
- POD = 140 + 28 + 8 = 176

**Faixas de referência (por kg de mistura)**

- POD: 160 a 210.
- PAC: 240 a 280 no gelato e 300 a 360 no sorbet, para servir entre −10 e −14 °C, como numa vitrine de gelateria. Daí vem a regra prática italiana: no gelato, PAC por kg ÷ 20 dá a temperatura de servir; no sorbet, ÷ 25.
- O sorbet precisa de mais PAC para a mesma temperatura porque tem mais água a congelar. Dois cremes com o mesmo PAC e quantidades diferentes de água não ficam igualmente duros, e é por isso que a regra tem denominadores diferentes.
- No freezer de casa (−18 °C), o PAC precisaria ficar perto de 400. O mais comum é manter a receita e tirar o pote 10 a 15 minutos antes de servir.

**Na calculadora do app**

A calculadora não mostra a regra ÷ 20 / ÷ 25. Ela usa o cálculo mais completo do **ponto de congelamento** (tema Dureza), que leva em conta a água da receita e os sais do leite, e por isso acerta melhor em receitas fora do comum. A regra italiana continua útil como conta de cabeça.`},

{id:"textura", grupo:"fundamentos", titulo:"Textura e cristais de gelo", md:`A cremosidade vem de cristais de gelo pequenos e numerosos. Abaixo de uns 50 micrômetros a língua não os percebe. Acima disso, a textura parece gelada e áspera.

**O que forma cristais pequenos**

- Congelar rápido: mistura a cerca de 4 °C, cuba bem gelada e máquina sem excesso de carga.
- Agitação constante na batedura, que raspa e quebra os cristais.
- Sólidos totais e estabilizantes na faixa certa, que deixam menos água livre.
- Maturação na geladeira, que hidrata proteínas e estabilizantes: mínimo de 1 hora, ideal de 12, nunca mais de 72.
- Endurecimento rápido depois da batedura: pote raso pré-gelado, na parte mais fria do freezer.

**O que estraga a textura**

Variação de temperatura. A cada degelo parcial, os cristais pequenos derretem e a água recongela sobre os grandes. Por isso o sorvete piora com o abre e fecha do freezer.

O gelato sai da máquina entre −5 e −9 °C, conforme o equipamento, com cerca de metade da água congelada. O resto congela no endurecimento, e é aí que os cristais crescem se o processo for lento.

**Diagnóstico rápido**

| Defeito | Causa provável | Ajuste |
| --- | --- | --- |
| Cristais de gelo perceptíveis | Poucos sólidos, congelamento lento ou variação de temperatura | Subir os sólidos, gelar melhor a mistura e a cuba, usar estabilizante |
| Arenoso | Excesso de SLNG (lactose cristalizada) | Reduzir o leite em pó |
| Duro demais | PAC baixo ou pouco ar | Trocar parte da sacarose por dextrose |
| Mole, derrete rápido | PAC alto: açúcar ou álcool em excesso | Reduzir açúcares de PAC alto ou o álcool |
| Amanteigado, com grãos de gordura | Gordura alta ou batedura longa demais | Reduzir o creme, parar a máquina antes |
| Gomoso, elástico | Excesso de estabilizante | Reduzir a dose |`},

{id:"overrun", grupo:"fundamentos", titulo:"Overrun (ar) e temperatura de servir", md:`Overrun é quanto o volume cresce com o ar incorporado na batedura:

overrun (%) = (volume final − volume da mistura) ÷ volume da mistura × 100

Na prática, pese o mesmo pote cheio de mistura líquida e depois cheio de sorvete:

overrun (%) = (peso da mistura − peso do sorvete) ÷ peso do sorvete × 100

| Tipo | Overrun | Temperatura de servir |
| --- | --- | --- |
| Gelato | 20–35% | −10 a −14 °C |
| Sorbet | 20–30% | −10 a −14 °C |
| Ice cream premium | 25–50% | −13 a −15 °C |
| Ice cream industrial | 60–100% | −13 a −15 °C |

Máquinas domésticas costumam ficar entre 15 e 35%.

Cuidado para não confundir overrun com fração de ar. Overrun mede o volume ganho em relação à mistura; fração de ar mede quanto do volume final é ar. Um overrun de 40% dá 29% de ar no produto, e 25 a 40% de ar correspondem a um overrun de 33 a 67%. A conversão é ar (%) = overrun ÷ (100 + overrun) × 100.

- **Mais ar:** mais leve e macio, com menos sabor por colherada.
- **Menos ar:** mais denso e com sabor mais intenso, mas também mais duro.
- **O que influencia:** teor de gordura e proteínas, emulsificantes, velocidade da máquina e tempo de batedura.
- **Temperatura:** quanto mais quente, mais se percebe o sabor e mais macia a textura. Armazene a −18 °C ou menos e sirva mais quente.`},

{id:"dureza", grupo:"fundamentos", titulo:"Dureza: ponto de congelamento e água congelada", md:`O PAC sozinho não diz o quanto um creme vai ficar duro, porque ignora quanta água existe para congelar. O mesmo PAC espalhado por mais água rende menos: por isso um sorbet, com 70% de água, fica mais duro que um gelato com 60%, mesmo com o PAC idêntico. É aí que nasce a regra dos denominadores diferentes.

O cálculo completo soma duas contribuições e depois acompanha o gelo se formando.

**1. Equivalentes de sacarose na água**

Some o PAC da receita (os fatores de SE estão no tema PAC e POD) e divida pela água, para chegar a gramas de equivalente-sacarose por 100 g de água:

g de sacarose por 100 g de água = SE × 100 ÷ água (%)

Essa concentração dá a primeira parte da queda, lida na tabela de congelamento de soluções de sacarose, medida por Pickering e tabulada por Leighton. Como referência: 36 g por 100 g de água baixam 2,21 °C; 60 g baixam 3,85 °C; 120 g baixam 8,92 °C.

**2. Sais do leite**

A segunda parte vem dos minerais, que são pequenos e pesam mais do que parece:

queda pelos sais = (SLNG + sólidos de soro) × 2,37 ÷ água (%)

Numa mistura comum isso vale quase 0,5 °C. O ponto de congelamento da receita é a soma das duas quedas, com sinal negativo.

A faixa boa fica entre −2,75 e −3,0 °C para servir entre −10 e −14 °C.

**3. Porcentagem de água congelada**

Abaixo do ponto de congelamento, a água congela aos poucos, e a que resta líquida vai ficando mais concentrada, o que derruba ainda mais o ponto de congelamento. Para saber quanto gelo existe a uma dada temperatura, repete-se a conta acima com a água que ainda resta, até achar a fração em que a queda total iguala a temperatura.

Num gelato bem balanceado, a −12 °C costumam estar congelados cerca de 70% da água. O número serve bem para comparar receitas entre si e para achar, no seu freezer, a proporção que agrada na colher.

**Limites**

Acima de 55 a 60% de água congelada, o cálculo passa a superestimar o gelo: medições por DSC ficam abaixo da curva teórica, porque aparecem interações entre soluto e solvente. O método também erra de até 0,2 °C conforme os ingredientes, e não alcança os sólidos de chocolate e castanhas, que endurecem ao congelar, nem o overrun, que deixa o creme mais fácil de servir. Serve para comparar, não como medida absoluta.

Existe também uma fórmula simplificada que circula entre gelatieri, %Wf = (1 − FP ÷ temperatura) × 100, com faixa ideal de 75 a 80%. Ela é prática, mas dá números cerca de 10 pontos acima do método completo, então as duas faixas não são intercambiáveis.`},

{id:"estabilizantes", grupo:"fundamentos", titulo:"Estabilizantes e emulsificantes", md:`**Estabilizantes** prendem água, aumentam a viscosidade e retardam o crescimento dos cristais e o derretimento. A dose total fica entre 0,1 e 0,5% do peso da mistura. Em excesso, a textura fica gomosa.

| Estabilizante | Hidrata | Observação |
| --- | --- | --- |
| Goma guar | A frio | Dá corpo. É a base da maioria das misturas |
| Goma jataí ou alfarroba (LBG) | A quente, cerca de 80 °C | O melhor controle de cristais. Combina bem com a guar |
| Carragena | A quente | Em doses mínimas, evita a separação do soro em bases lácteas |
| Xantana | A frio | Estável em meio ácido. Boa para sorbets |
| CMC | A frio | Comum em sorbets e bases a frio |
| Goma tara | Parcial a frio, total a quente | Fica entre a guar e a alfarroba |
| Pectina | A quente | Usada em sorbets de fruta |

Como usar: misture o estabilizante seco com parte do açúcar (pelo menos 5 partes de açúcar para 1 de estabilizante) antes de juntar ao líquido, para não formar grumos. Respeite a temperatura de hidratação e deixe a mistura maturar.

**Emulsificantes** são a gema de ovo (lecitina), os mono e diglicerídeos e a lecitina de soja ou girassol. Eles enfraquecem a película de proteína em volta das gotículas de gordura. Na batedura, essas gotículas se agrupam parcialmente e formam uma rede que segura o ar. O resultado é uma textura mais seca e lisa, que derrete mais devagar.

- Gema: de 2 a 8% da mistura em bases com ovos.
- Mono e diglicerídeos: de 0,1 a 0,3%.

No Brasil, a "liga neutra" é uma mistura de estabilizantes, e o emulsificante em pasta vendido para sorvete é à base de mono e diglicerídeos.`},

{id:"estilos", grupo:"fundamentos", titulo:"Estilos: gelato, sorvete e sorbet", md:`No app, os três estilos são **gelato**, **sorvete** (o ice cream americano, mais cremoso e aerado) e **sorbet**. Em português, "sorvete" também é o nome genérico de todos eles; aqui ele é usado só para o estilo cremoso.

| | Gelato | Sorvete | Sorbet |
| --- | --- | --- | --- |
| Base | Mais leite que creme, pouca ou nenhuma gema | Mais creme, com gemas (custard) ou sem (Filadélfia) | Fruta, água e açúcares, sem laticínios |
| Gordura | 4–9% | 10–16% ou mais | 0% |
| Açúcares | 16–22% | 14–18% | 25–32% |
| Sólidos totais | 36–42% | 36–42% | 28–35% |
| Overrun | 20–35% | 25–100% | 20–30% |
| Temperatura de servir | −10 a −14 °C | −13 a −15 °C | −10 a −14 °C |
| Resultado | Denso, elástico, sabor intenso | Aerado, cremoso, mais frio na boca | Leve, refrescante, sabor de fruta em primeiro plano |

**Gelato x sorvete**

O gelato parece mais saboroso porque tem menos gordura cobrindo o paladar, menos ar e é servido mais quente. A tabela vale como tendência, não como definição: sorvetes premium chegam a overrun e teor de açúcar próximos aos do gelato, e há tradições italianas de gordura alta, como a de Bolonha. Não existe também uma receita original única de gelato: na Sicília a base levava leite, açúcar e amido de milho; em Nápoles, leite, ovos e amido; mais ao norte, creme e nada de amido. O que de fato separa um gelato é o conjunto de consistência, sensação na boca, aparência, sabor, produção artesanal em pequenos lotes e frescor.

Muitos sorvetes industriais têm overrun alto e usam gordura vegetal.

**Sorbet**

Sem gordura e sem proteína do leite, quem dá corpo são os açúcares e os sólidos da fruta, por isso o açúcar fica bem mais alto. Como tem mais água para congelar, precisa de mais PAC para ficar macio na mesma temperatura (veja o tema PAC e POD).

**Outros estilos**

- **Sherbet:** um sorbet com um pouco de laticínio.
- **Frozen custard:** sorvete com mais gema.
- **Soft serve:** servido direto da máquina, por volta de −6 °C, com menos gordura.`},

// ===== Ingredientes =====
{id:"laticinios", grupo:"ingredientes", titulo:"Laticínios (leite, creme, leite em pó)", md:`| Ingrediente | Gordura | SLNG | Sólidos totais |
| --- | --- | --- | --- |
| Leite integral | 3,5% | 8,5% | 12% |
| Leite desnatado | 0,1% | 9% | 9% |
| Creme de leite fresco | 35% | 5,5% | 40,5% |
| Creme UHT de caixinha | 20% | 7% | 27% |
| Leite em pó desnatado | 1% | 96% | 97% |
| Soro de leite em pó | 1% | 96% | 97% |
| Leite condensado | 8% | 22% | 74% (com 44% de açúcar) |
| Manteiga | 82% | 1,5% | 84% |
| Iogurte natural integral | 3,5% | 9% | 12,5% |

**Como cada um entra na mistura**

- **Leite integral:** a base. Entra com a maior parte da água e dos SLNG.
- **Creme fresco:** o ajuste de gordura. O de caixinha tem menos gordura e costuma vir com espessantes, então refaça a conta ao trocar.
- **Leite em pó desnatado:** sobe SLNG sem mexer na gordura nem na água. É a ferramenta mais útil para dar corpo. Cuidado com o limite: acima de uns 11% de SLNG, a lactose cristaliza e o sorvete fica arenoso.
- **Soro de leite em pó:** alternativa mais barata ao leite em pó, com mais lactose (76,5% dos sólidos, contra 54,5%) e menos proteína. Por isso baixa mais o ponto de congelamento e chega antes ao limite da arenosidade. Costuma substituir no máximo um quarto dos SLNG.
- **Manteiga:** uma forma de subir gordura sem água. Precisa derreter e emulsionar bem.
- **Iogurte:** entra depois da pasteurização, já na base fria, para preservar os fermentos e a acidez.`},

{id:"acucares", grupo:"ingredientes", titulo:"Açúcares (sacarose, dextrose, glucose, invertido)", md:`Os açúcares fazem três coisas ao mesmo tempo: adoçam (POD), amaciam (PAC) e somam sólidos. Misturar tipos diferentes é o que permite ajustar os três separadamente. Veja os valores de POD e PAC no tema PAC e POD.

| Açúcar | Para que serve | Uso típico |
| --- | --- | --- |
| Sacarose | O açúcar base, de referência | 60–75% do total de açúcares |
| Dextrose | Amacia bastante e adoça pouco | 10–25% |
| Glucose em pó (DE 38–40) | Dá corpo e segura o derretimento, sem adoçar | 10–20% |
| Açúcar invertido | Amacia e realça o aroma | Até 10%, mais em sorbets |
| Maltodextrina (DE 18) | Sólidos quase sem doçura nem amaciamento | Para corrigir sólidos |
| Mel | Amacia e traz sabor próprio | Pequenas quantidades |
| Açúcar mascavo e rapadura | Sabor e cor, com minerais | Parcial, no lugar da sacarose |

Quanto menor o DE de um xarope de glucose, menos ele adoça e menos amacia, e mais serve apenas para dar corpo. É por isso que o mesmo ingrediente muda de função conforme o número no rótulo.

**Na prática**

- Comece trocando de 15 a 20% da sacarose por dextrose quando o sorvete sair duro do freezer de casa.
- Glucose em pó é diferente do xarope de glucose: o xarope tem cerca de 20% de água, o que muda a conta de sólidos.
- Em sorbet, o açúcar da própria fruta conta. Meça o Brix se quiser precisão.
- Álcool tem PAC altíssimo. Acima de uns 3% da mistura, o sorvete não congela direito.`},

{id:"estabilizantes-uso", grupo:"ingredientes", titulo:"Estabilizantes e emulsificantes: compra e uso", md:`A teoria está no tema Estabilizantes e emulsificantes, em Fundamentos. Aqui ficam as notas de compra e de uso.

**Doses de partida** (sobre o peso total da mistura)

| Produto | Dose | Observação |
| --- | --- | --- |
| Liga neutra pronta | 0,3–0,5% | Segue a embalagem. Normalmente é guar, alfarroba e carragena |
| Goma guar pura | 0,1–0,2% | Hidrata a frio |
| Goma alfarroba (LBG) | 0,1–0,2% | Precisa chegar a 80 °C |
| Xantana | 0,05–0,1% | Pouco já faz efeito. Em excesso, fica viscosa |
| Mono e diglicerídeos | 0,1–0,3% | O emulsificante em pasta vendido para sorvete |
| Gema de ovo | 2–8% | Emulsificante natural |

**Blend caseiro simples:** 60% de guar e 40% de alfarroba, a 0,25% da mistura. Para sorbet, troque a alfarroba por um pouco de xantana, que aguenta melhor a acidez.

**Como dispersar**

Misture o pó com pelo menos cinco vezes o seu peso em açúcar e chova sobre o líquido a cerca de 40 °C, batendo. Jogar direto no líquido forma grumos que não desmancham.

**Onde comprar:** lojas de produtos para confeitaria e sorveteria, e também lojas de insumos para gastronomia molecular, que costumam vender as gomas puras em embalagens pequenas.`},

{id:"aromas", grupo:"ingredientes", titulo:"Aromatizantes, pastas e frutas", md:`**Frutas**

- Prefira purê cru, adicionado à base já fria, para preservar o aroma.
- Frutas ácidas, como maracujá, limão e abacaxi, podem talhar a base láctea: use em sorbet ou junte só no final, bem gelado.
- Abacaxi, mamão, kiwi e figo têm enzimas que quebram proteínas e deixam a base amarga. Aqueça rapidamente o purê para desativá-las.
- Fruta congelada funciona bem, e muitas vezes tem mais sabor que a fresca fora de época.

**Pastas e infusões**

- **Pastas puras** (pistache, avelã, amêndoa): de 6 a 10% da mistura. Elas somam bastante gordura, então reduza o creme.
- **Chocolate:** derreta e incorpore à base quente. A manteiga de cacau endurece o sorvete, então aumente o PAC para compensar.
- **Cacau em pó:** de 4 a 8%. Hidrate junto com os secos.
- **Infusões** (ervas, especiarias, café, chá): infunda no leite quente, de 20 a 30 minutos, tampado, e coe. Hortelã e manjericão dão mais aroma se forem infundidos a frio, de um dia para o outro.
- **Baunilha:** abra a fava, raspe as sementes e infunda tudo na base quente, com maturação longa.

**Variedades e recheios**

- Caldas e doces entram depois da batedura, em camadas, e nunca misturados na máquina.
- Caldas precisam de bastante açúcar ou um pouco de álcool para não endurecerem no freezer.
- Pedaços crocantes, como castanhas e cookies, podem ser envoltos em chocolate para não umedecerem.

**Sal:** uma pitada, por volta de 0,1 a 0,2% da mistura, realça o sabor em quase todas as receitas.`},

// ===== Bases e técnicas =====
{id:"base-gelato", grupo:"bases", titulo:"Gelato (base a quente e a frio)", md:`A base branca de gelato é leite, creme, açúcares, leite em pó desnatado e estabilizante. É a base de onde sai a maioria dos sabores.

**Base a quente (pasteurizada)**

1. Misture os pós secos (leite em pó, açúcares e estabilizante) para o estabilizante não empelotar.
2. Aqueça o leite a cerca de 40 °C e incorpore os secos batendo.
3. Leve a 65 °C, junte o creme e suba até 82–85 °C.
4. Resfrie rápido até 4 °C, em banho de gelo.
5. Mature de 1 a 12 horas na geladeira, nunca mais de 72.

**Base a frio**

Mistura tudo a frio, com estabilizantes que hidratam a frio (guar, xantana, CMC). É mais rápida, mas rende menos corpo e menos estabilidade. Serve bem para testes.

**Proporção inicial, por kg**

| Ingrediente | Quantidade |
| --- | --- |
| Leite integral | 597 g |
| Creme de leite fresco (35%) | 160 g |
| Leite em pó desnatado | 40 g |
| Sacarose | 150 g |
| Dextrose | 20 g |
| Glucose em pó | 30 g |
| Estabilizante | 3 g |

Isso dá 7,7% de gordura, 9,8% de SLNG, 19,7% de açúcares e 37,5% de sólidos totais, com PAC 259 e ponto de congelamento de −2,9 °C. Todos os indicadores ficam longe dos limites das faixas, e não só dentro delas. Ajuste conforme o sabor: para sabores gordurosos, como chocolate, pasta de castanha ou pistache, reduza o creme, porque a gordura deles entra na conta.`},

{id:"custard", grupo:"bases", titulo:"Custard (com gemas)", md:`A base à francesa leva gemas, que funcionam como emulsificante e dão uma textura mais rica e densa.

1. Aqueça leite e creme com metade do açúcar.
2. Bata as gemas com o restante do açúcar até clarear.
3. Tempere as gemas com parte do líquido quente, aos poucos, batendo sempre.
4. Volte tudo à panela e cozinhe em fogo baixo, mexendo em oito com uma espátula, até 82–83 °C.
5. Coe, resfrie rápido a 4 °C e mature de 1 a 12 horas, nunca mais de 72.

**Pontos de atenção**

- O ponto é _nappe_: o creme cobre a espátula e o dedo deixa um risco limpo.
- Acima de 85 °C as gemas talham. Se acontecer, bata no mixer e coe.
- De 4 a 8 gemas por litro. Mais que isso, o gosto de ovo domina.
- As gemas somam gordura e sólidos, então reduza o creme proporcionalmente.`},

{id:"filadelfia", grupo:"bases", titulo:"Filadélfia (sem ovos)", md:`Só leite, creme, açúcar e aroma, sem cozimento de gemas. É a base mais limpa de sabor e a mais rápida.

1. Aqueça parte do leite com o açúcar e o estabilizante, só para dissolver.
2. Junte o creme e o restante do leite frio.
3. Resfrie e mature algumas horas.

É ideal para sabores delicados, como baunilha, leite ou ervas frescas, que as gemas abafariam. Por não ter emulsificante, pede mais atenção ao balanceamento e ao estabilizante.`},

{id:"sorbet", grupo:"bases", titulo:"Sorbet", md:`**Sorbet** é fruta, água e açúcares, sem laticínios. O balanceamento gira em torno de 25–32% de açúcares e 28–35% de sólidos totais.

1. Faça uma calda com água, açúcares e estabilizante.
2. Resfrie a calda.
3. Misture ao purê de fruta cru, para preservar o aroma.
4. Mature algumas horas e bata.

Como cada fruta tem açúcar e água próprios, a proporção de purê muda bastante: cerca de 60–70% para morango ou manga, e 25–35% para limão ou maracujá. Uma pitada de sal e algumas gotas de limão realçam a fruta. Um pouco de glucose em pó dá corpo sem adoçar demais.`},

{id:"vegano", grupo:"bases", titulo:"Versões veganas e sem lactose", md:`**Sem lactose:** use leite e creme sem lactose, onde a lactose já está quebrada em glicose e galactose. Isso aumenta bastante o PAC e a doçura, então reduza os açúcares adicionados em 10 a 15% e espere um resultado mais macio.

**Vegano:** o desafio é repor gordura, proteína e sólidos.

| Base | Característica |
| --- | --- |
| Coco | Gordura alta, textura cremosa, sabor marcante |
| Castanha de caju | Neutra e cremosa. Bate-se com água e coa |
| Aveia | Doce e suave, com bom corpo |
| Soja | A que tem mais proteína, boa estrutura |

Para compensar: use gordura de coco ou pasta de castanhas, maltodextrina ou glucose para sólidos sem doçura, e um pouco mais de estabilizante. Proteína de ervilha ou arroz ajuda no corpo e na aeração.`},

{id:"processo", grupo:"bases", titulo:"Processo: pasteurização, maturação, batedura e congelamento", md:`**1. Pasteurização**

Elimina patógenos e hidrata proteínas e estabilizantes. Três padrões usuais: baixa, a 65 °C por 30 minutos; média, a 72 °C por 5 minutos; alta, a 85 °C por 5 segundos. Acima disso surge gosto de leite cozido. Sorbets e bases veganas, sem laticínios nem ovos, dispensam a etapa, desde que o estabilizante hidrate a frio. É a diferença entre o processo a quente e o processo a frio.

**2. Resfriamento**

Quanto mais rápido, melhor. Banho de gelo com água e sal, mexendo. A faixa entre 50 e 10 °C é a de risco microbiológico, então atravesse-a depressa.

**3. Maturação**

Mínimo de 1 hora a 4 °C, ideal de 12, e nunca mais de 72: a partir daí, descarte a mistura. A gordura cristaliza, as proteínas e os estabilizantes terminam de hidratar e o sabor se desenvolve. É a etapa mais ignorada e uma das que mais mudam o resultado.

**4. Batedura**

A mistura entra a 4 °C e sai entre −5 e −9 °C, conforme o equipamento, em geral depois de 20 a 40 minutos. Nesse ponto, cerca de metade da água congelou, o ar já entrou e o creme ainda está macio o bastante para sair da máquina. Encha a cuba até no máximo dois terços e pare assim que o sorvete parecer uma soft serve firme: passar do ponto quebra a gordura e deixa a textura amanteigada.

**5. Endurecimento**

Passe para um pote raso pré-gelado, cubra a superfície com filme e leve à parte mais fria do freezer até chegar a −18 °C. Quanto mais rápido, menores os cristais. Na indústria o congelamento rápido vai a −25 ou −30 °C; um ultracongelador de confeitaria leva o creme à temperatura de servir em 10 a 15 minutos; um freezer doméstico derruba cerca de 1 °C a cada duas horas por quilo, e um ventilador dentro do freezer acelera bastante.`},

{id:"conservacao", grupo:"bases", titulo:"Conservação e armazenamento", md:`- **Temperatura:** −18 °C ou menos, estável. A variação é o que mais estraga a textura.
- **Recipiente:** raso, de parede grossa, bem fechado. Filme encostado na superfície evita a queima de freezer.
- **Local:** no fundo do freezer, nunca na porta.
- **Validade prática:** de 1 a 2 semanas no auge. Sorbets duram menos, cerca de 1 semana.
- **Servir:** gelato e sorbet ficam bons entre −10 e −14 °C. Saindo do freezer de casa, deixe o pote de 10 a 15 minutos na geladeira antes.
- **Nunca recongele** um sorvete que derreteu: além do risco microbiológico, a textura se perde.`},

// ===== Referências =====
{id:"bibliografia", grupo:"referencias", titulo:"Bibliografia", md:`[Ice Cream, 7th ed. - H. Douglas Goff e Richard W. Hartel](https://drive.google.com/file/d/1dMzmnCrnbjS-BSYjEK967cfPfBdN-I2n/view)
[Ice Cream Technology - H. Douglas Goff](https://books.lib.uoguelph.ca/icecreamtechnologyebook/)
[Gelatologist](https://medium.com/@gelatologist)`}
];
