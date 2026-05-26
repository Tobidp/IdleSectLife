# IdleSectLife — Projeto & Design

## Visão Geral do Jogo

**IdleSectLife** é um jogo idle/incremental baseado em texto para navegador. O jogador funda e gerencia seu próprio **secto de artes marciais** (temática wuxia/China) com objetivo de crescer e se tornar o maior e mais forte secto do império.

### Tags
browser, jogo de texto, idle, wuxia, artes marciais, China, gerenciamento de recursos

### Estilo de Jogo
- **Passagem de tempo automática:** 1 dia a cada ~3 segundos
- **Foco em crescimento exponencial:** recursos, discípulos, construções, fama
- **Microgerenciamento** de discípulos (alocação diária de ações)
- **Balanceamento de economia** (recursos, custos de upgrade, manutenção)

---

## Conceito Original (Do Arquivo Enviado)

### Mecânica Central
Você escolhe uma arte marcial inicial (um dos 4 sectos) e inicia seu secto com o objetivo de conquistar poder e território.

### 4 Sectos Iniciais
- **Secto da Espada** → aumenta Força (ataque direto)
- **Secto da Lança** → aumenta Vida (defesa, alcance, sobrevivência)
- **Secto do Arco** → aumenta Destreza (precisão, esquiva)
- **Secto dos Punhos** → aumenta Vitalidade (resistência, recuperação)

*(Outros sectos podem ser construídos durante o jogo, após upgrades do secto inicial.)*

### Recursos (6 Totais)
1. **Pedra** — coletada
2. **Madeira** — coletada
3. **Metal** — mineirado em minas de ferro, depois fundido em fundição
4. **Comida** — plantações
5. **Tecido** — ... *(detalhes a definir)*
6. **Ouro** — recompensas de missões bem-sucedidas, eventos, campeonatos

*Na v1, foco em: pedra, madeira, comida, ouro, tecido (via mercado apenas). Metal entra em iterações posteriores; Tecido ganha cadeia de produção (plantação→linho→tecelagem) em v2.*

### Pavilhões (Construções)
- **Armas:** armazena armas (compradas, conquistadas em missões, fabricadas)
- **Depósito:** estoca pedra, madeira, metal, tecido, comida
- **Cofre:** armazena ouro
- **Enfermaria:** trata discípulos feridos; sem ela, cura mais lenta e risco de morte maior
- **Quartos:** cada um armazena X discípulos
- **Ferraria:** fabrica itens/armas (com recursos)

*Na v1, focamos em: Quartos e Depósito. Demais pavilhões em iterações posteriores.*

### Discípulos
- Chegam conforme a fama/reconhecimento aumenta
- Cada discípulo tem **3 ações por dia** (manhã, tarde, noite):
  - Ir em missão
  - Treinar
  - Coletar recursos
- Atributos: Vida, Força, Destreza, Vitalidade
- Slots de equipamento: arma, roupa, pés, mão
- **Felicidade:** afeta velocidade de progressão
  - \>75: feliz, ganho cheio
  - 50–74: mediano, ganho reduzido
  - <50: quase não progride, pode abandonar secto

### Sistema de Fama/Reconhecimento
- Sobe com: missões bem-sucedidas, eventos positivos, bom desempenho em campeonatos
- Desce com: missões fracassadas
- Atrai novos discípulos conforme sobe

### Missões (Versão v2+)
Diárias, em diferentes níveis de dificuldade:
- **1–10 estrelas amarelas:** ouro + reconhecimento baixo, itens cinzentos
- **1–10 estrelas vermelhas:** ouro + reconhecimento médio, itens verdes
- **1–10 estrelas azuis:** ouro + reconhecimento alto, itens azuis
- **1–10 estrelas douradas:** ouro + reconhecimento muito alto, itens roxos

### Itens & Raridade
- **Cinza:** fornece pouca quantidade de atributo
- **Verde:** pouca/média quantidade
- **Azul:** média quantidade
- **Roxo:** grande quantidade
- Podem ser fabricados pela ferraria com recursos

### Tempo & Estações
- Passagem automática: dia → mês → ano
- 4 estações (3 meses cada), cada uma propícia para diferentes atividades
- *(Efeitos específicos de estações a definir)*

### Extras (Conceito)
- **Upgrade do Secto:** custo exponencial e proporcional; destrava construção de novos sectos
- **Custos exponenciais:** todos os upgrades crescem exponencialmente com custo base × 1.5^nível
- **Manutenção mensal:** cada construção consome recursos mensalmente
- **Morte de discípulos:** possível em missões, treinamento, colheita; evitável/reduzível com boa enfermaria

---

## Decisões de Fundação (Aprovadas)

### 1. Tech Stack
- **Frontend:** TypeScript puro + Vite (sem framework)
- **Linguagem de jogo:** Inglês (interface, código)
- **Linguagem de comunicação:** Português (conversa com desenvolvedor/designer)
- **Persistência:** localStorage (100% client-side, sem servidor)
- **Ferramentas:** Vite para build/dev

### 2. Abordagem de Construção
- **Iterativa:** build do loop central primeiro (core loop), depois camadas adicionais
- **Resolução de dúvidas:** TODAS as dúvidas de design resolvidas ANTES de qualquer coding

### 3. Estrutura de Código (Granular)
```
src/
  core/          # game loop, time engine, save/load, RNG
    └─ time/
    └─ save/
    └─ rng/
  
  domain/        # lógica pura do jogo (sem DOM)
    └─ resources/
    └─ sect/
    └─ disciples/
    └─ buildings/
    └─ fame/
    └─ market/
  
  data/          # constantes e balanceamento
    └─ costs.ts
    └─ prices.ts
    └─ baseStats.ts
  
  state/         # estado central do jogo (store)
  
  ui/            # renderização, painéis, controles
    └─ panels/
    └─ components/
    └─ controls/
  
  main.ts

index.html
style.css
```

---

## Design da v1 (Primeira Versão Jogável)

### Escopo da v1
**Loop Central Funcionando:**
- Escolher 1 secto no início
- Ter discípulos com atributos e felicidade
- Alocar as 3 ações diárias (Coletar / Treinar)
- Recursos aumentam
- Construir/melhorar pavilhões (Quartos + Depósito)
- Tempo passa automaticamente (dia → mês → ano)
- Fama atrai mais discípulos
- Salvar em localStorage

**Fora da v1 (v2+):**
- Missões
- Itens & Ferraria
- Campeonatos
- Metal & cadeia mina→fundição
- Tecido: cadeia completa plantação→linho→tecelagem (mercado existe em v1, mas produção local em v2)
- Enfermaria completa (v1: básica ou omitida)
- Múltiplos sectos (v2 +)
- Outras construções (Armas, Cofre, etc.)

### Mecânica: Tempo
- **1 dia = 3 segundos** de tempo real
- **1 mês = 30 dias**
- **1 ano = 12 meses**
- **Estações = 4 (3 meses cada)**
- **Controles:** Pause + velocidades (1x / 2x / 4x)
- Estações dão modificadores leves de coleta (ex.: Verão +20% comida, Inverno −20%)

### Mecânica: Discípulos

#### Atributos & Significado
| Atributo | Significado |
|----------|-----------|
| **Vida** | Pool de HP; zerou → ferido (vai à enfermaria se existir, com risco de morte) |
| **Força** | Dano em missão; aumenta coleta de recursos |
| **Destreza** | Chance de sucesso em missão; reduz chance de se ferir |
| **Vitalidade** | Velocidade de cura; resistência a morte; contribui ao HP máximo |

#### Progresso
- **Treino:** +1 em TODOS os atributos + **+3 no atributo do secto** (mapear Espada→Força, Lança→Vida, Arco→Destreza, Punho→Vitalidade)
- Cada ação de treino = +1 para todos + bonus pro secto

#### Felicidade
- **Início:** 80 (secto preferido) / 55 (não preferido)
- **Aumenta:** bem alimentado, estar no secto preferido
- **Diminui:** falta de comida (−10/dia), secto não preferido (dreno leve)
- **Efeitos no Progresso:**
  - ≥75 (feliz): ganho cheio (ex.: +3 Força, +1 outros)
  - 50–74 (mediano): ganho reduzido à metade
  - <50 (infeliz): ~10% do ganho + chance diária de abandonar secto

#### Ações Diárias (3 por discípulo)
- **Coletar Pedra/Madeira/Comida:** ~5 unidades/ação (escala com Força)
- **Treinar:** melhora atributos (veja acima)
- *(Missões = v2)*

#### Recrutamento
- Discípulos chegam automaticamente conforme a fama sobe
- Cada chegada: secto preferido é **aleatório** entre os 4
  - Se seu secto bate: feliz (80)
  - Se não bate: entra como 2ª opção (55) → incentivo a abrir outros sectos
- Cap: máximo de discípulos = capacidade dos Quartos

### Mecânica: Recursos & Coleta

#### Recursos (v1)
1. **Pedra** — coletada via ação "Coletar Pedra"
2. **Madeira** — coletada via ação "Coletar Madeira"
3. **Comida** — coletada via ação "Coletar Comida" (farming/forage)
4. **Ouro** — mercado + (v2: missões, campeonatos)
5. **Tecido** — mercado (compra com ouro); produção local (plantação→linho→tecelagem) em v2

#### Valores Iniciais
- Pedra: 50
- Madeira: 50
- Comida: 30
- Ouro: 20
- Tecido: 0 (adquire via mercado)

#### Coleta
- **Clique manual:** +1 de um recurso (para pressa, sem cooldown / com cooldown leve)
- **Ação de Discípulo:** ~5 unidades/ação, ajustado pela Força do discípulo
  - Fórmula: `yield = 5 + (Força × 0.5)`
  - Discípulo com Força 10 colhe ~10 units/ação
  - Discípulo com Força 20 colhe ~15 units/ação

#### Consumo: Comida
- Cada discípulo consome **1 comida/dia**
- Se comida total < consumo do dia:
  - **Shortage:** felicidade despenca (−10/dia para todos)
  - Se persistir por dias: discípulos começam a sair
- Incentiva planejamento de colheita de comida

### Mecânica: Pavilhões & Upgrades

#### Quartos (Dormitórios)
- **Função:** define quantos discípulos cabem no secto
- **Capacidade inicial:** 5 discípulos
- **Por nível:** +2 discípulos de capacidade (nível 1 = 5, nível 2 = 7, etc.)
- **Custo base:** Wood 30, Stone 20
- **Custo de upgrade:** `base × 1.5^(nível_atual)` (exponencial)
- **Manutenção:** X wood/mês proporcional ao nível

#### Depósito (Warehouse)
- **Função:** define limite de estoque por tipo de recurso
- **Limite inicial:** 200 unidades por recurso
- **Por nível:** +150 unidades de cap (nível 1 = 200, nível 2 = 350, etc.)
- **Custo base:** Stone 30, Wood 20
- **Custo de upgrade:** `base × 1.5^(nível_atual)`
- **Manutenção:** X stone/mês proporcional ao nível

#### Secto (Upgrade)
- **Função:** nível geral, gera fama, destrava construir outros sectos (v2)
- **Custo base:** Stone 100, Wood 100, Gold 50
- **Custo de upgrade:** `base × 1.5^(nível_atual)`
- **Bônus por nível:** (tbd — ex.: +X% no ganho de atributos, ou +fama/dia)

### Mecânica: Fama & Recrutamento

#### Fontes de Fama (v1)
1. **Upgrades:** ao melhorar secto/pavilhões, recebe um burst de fama
   - Ex.: +5 fama por nível de pavilhão, +20 por nível de secto
2. **Discípulos felizes & treinados:** pequena fama passiva
   - Ex.: cada discípulo com Felicidade ≥75 gera +0.1 fama/dia

#### Recrutamento Automático
- Cada dia, chance de atrair novo discípulo (se há vaga nos Quartos)
- `chanceArrival/dia = min(0.9, fama / 200)`
  - 0 fama = 0% chance
  - 200 fama = 90% chance/dia
- Recém-chegado tem secto preferido aleatório (1 de 4)

### Mecânica: Mercado (fonte de ouro na v1)

Simples economia de compra/venda para fechar o loop de ouro:

| Recurso | Venda | Compra |
|---------|-------|--------|
| Pedra | 1 ouro | 2 ouro |
| Madeira | 1 ouro | 2 ouro |
| Comida | 2 ouro | 4 ouro |
| Tecido | — | 5 ouro |

- Vender: excedente de pedra/madeira/comida por ouro
- Comprar: repor recursos se necessário, com markup; tecido só compra (sem venda em v1)
- Objetivo: adiciona uma dimensão de estratégia; ouro tem fonte E uso na v1

### Mecânica: Persistência
- **Autosave:** a cada mudança significativa ou a cada N segundos, salvar em localStorage
- **Formato:** JSON com estado completo do jogo
- **Load:** ao abrir a página, carregar estado salvo; se não existir, new game

### Interface (UI)

#### Painéis Principais (Inglês)
1. **Sect Overview:** nível secto, fama total, dia/mês/ano, estação
2. **Resources Panel:** pedra, madeira, comida, ouro (com /mês deltas)
3. **Disciples Panel:** lista de discípulos com atributos, felicidade, secto, alocar 3 ações
4. **Buildings Panel:** Quartos e Depósito (nível, capacidade atual, botão upgrade + custo)
5. **Market:** buy/sell recursos por ouro
6. **Time Controls:** pause, velocidade (1x / 2x / 4x)
7. **Event Log:** feed de eventos (recruta chegou, recurso esgotou, etc.)

### Números de Balanceamento (v1 Defaults)

Todos **ajustáveis** durante testes e playtesting:

- **Coleta base:** 5 units/ação
- **Consumo comida:** 1 discípulo/dia
- **Treino:** +1 todos, +3 secto (multiplicado por felicidade)
- **Fama burst:** +5 por nível de pavilhão, +20 por nível secto
- **Fama passiva:** +0.1 por discípulo feliz/treinado/dia
- **Felicidade inicial:** 80 (match) / 55 (mismatch)
- **Felicidade penalidades:** −10/dia se comida < consumo
- **Custo exponencial:** multiplicador 1.5 (ajustável para pacing)
- **Upgrade base costs:** Quartos (W30/S20), Depósito (S30/W20), Secto (S100/W100/G50)
- **Capacidade inicial:** Quartos 5, Depósito 200/recurso
- **Capacidade por nível:** Quartos +2, Depósito +150

---

## Roteiro (v2 & Além)

### v2: Missões, Itens & Cadeia de Tecido
- Sistema de missões diárias (4 tiers de estrela)
- Itens por raridade (cinza/verde/azul/roxo)
- Ferraria para craftar itens
- Combate/resolução de missão (basada em stats vs dificuldade)
- **Cadeia de Tecido:** 
  - Plantações produzem **Linho** (ação "Coletar Linho"; cotribui pra fama como agrícola)
  - Discípulo em plantação escolhe: colher comida OU colher linho
  - Mercado: pode trocar linho ↔ ouro (ex.: 1 linho = 1 ouro ou ajustado)
  - Pavilhão **Tecelagem:** transforma linho → tecido (ratio: 3 linho = 1 tecido; custo exponencial)

### v3: Metal & Infraestrutura
- Cadeia mina de ferro → fundição (metal)
- Cofre para armazenar ouro
- Pavilhão de Armas

### v4: Enfermaria Completa, Múltiplos Sectos
- Sistema de ferimentos e cura elaborado
- Construir outros 3 sectos (após upgrades de secto base)
- Bonus de secto por nível

### v5: Campeonatos, Eventos Aleatórios
- Torneios com rankings
- Eventos aleatórios (bônus / penalidades)
- Sistema de reputação mais refinado

---

## Notas de Design

### Filosofia
- **Crescimento exponencial:** custos aumentam; recursos também. Jogador sente progresso contínuo.
- **Economia fechada:** todos os recursos têm fonte e sink; nenhum é infinito.
- **Microgerenciamento leve:** 3 ações/discípulo permite estratégia sem overload.
- **Felicidade como balanceador:** discípulos infelizes param de progredir, força cuidado e planejamento.
- **Fama como driver:** motiva upgrades e planejamento (abrir novos sectos para satisfazer recém-chegados).

### Decisões Abertas (Post-v1)
- Efeitos específicos de cada estação (ex.: Verão bom pra coleta, Inverno bom pra... ??)
- Estatísticas exatas de missão por tier (dificuldade vs recompensa)
- Raridade de itens e seus bônus
- Sistema de reputação detalhado (se vai além de fama)

---

## Resumo Executivo

**IdleSectLife** é um jogo idle de gerenciamento de secto marcial. Na **v1**, o jogador funda um secto, recruta discípulos, aloca suas ações diárias para coletar/treinar, gerencia recursos e pavilhões, e vê seu secto crescer com a fama. 

**Tech:** TS puro + Vite, client-side com localStorage.

**Estrutura:** Granular (core/ domain/ data/ state/ ui/) para facilitar manutenção e expansão.

**Próximas fases** adicionam missões, itens, combate, múltiplos sectos e campeonatos.

Todas as dúvidas de design foram resolvidas antes de qualquer código. Pronto para iniciar a implementação.
