---
name: Atelier Focus
colors:
  surface: '#12131a'
  surface-dim: '#12131a'
  surface-bright: '#383941'
  surface-container-lowest: '#0d0e15'
  surface-container-low: '#1a1b22'
  surface-container: '#1e1f26'
  surface-container-high: '#292931'
  surface-container-highest: '#33343c'
  on-surface: '#e3e1ec'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e3e1ec'
  inverse-on-surface: '#2f3038'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#ffb2b7'
  on-secondary: '#67001b'
  secondary-container: '#b50036'
  on-secondary-container: '#ffc2c4'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#ffdadb'
  secondary-fixed-dim: '#ffb2b7'
  on-secondary-fixed: '#40000d'
  on-secondary-fixed-variant: '#92002a'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#12131a'
  on-background: '#e3e1ec'
  surface-variant: '#33343c'
typography:
  display-timer:
    fontFamily: JetBrains Mono
    fontSize: 72px
    fontWeight: '500'
    lineHeight: 72px
    letterSpacing: -0.04em
  display-timer-mobile:
    fontFamily: JetBrains Mono
    fontSize: 48px
    fontWeight: '500'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.025em
  headline-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.02em
  title-md:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.015em
  title-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
  code-inline:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

### Personality & Ethos
O design system é ancorado em clareza cirúrgica, quietude deliberada e precisão instrumental. Inspirado no rigor gráfico suíço e no minimalismo utilitário escandinavo, o ambiente elimina o ruído cognitivo para proporcionar estados prolongados de concentração profunda (*deep work*). A experiência afasta-se de gamificações excessivas ou interfaces hiperativas; trata-se de um instrumento técnico silencioso, confiável e esteticamente disciplinado, onde cada pixel serve à triagem e à execução de valor.

### Target Audience
Profissionais de alto rendimento, engenheiros de software, designers, pesquisadores e gestores autônomos que organizam seus dias com base em blocos de tempo intencionais e na separação implacável entre urgência reativa e importância estratégica.

### Design Movement & Aesthetic
- **Minimalismo Instrumental:** Ausência de ornamentos decorativos supérfluos, uso de tipografia funcional e proporções matemáticas puras.
- **Tonal Layers & Micro-borders:** Delimitação de cartões por superfícies semitransparentes e bordas ultrafinas de baixo contraste em vez de sombras pesadas.
- **Arquitetura Visual Redutiva:** Ênfase no conteúdo ativo. Elementos em repouso recuam silenciosamente na hierarquia visual; ações ativas e transições de estado emergem com microinterações rápidas, táteis e sem atrito.

## Colors

### System Strategy
O modo escuro é o padrão estrutural para atenuar o cansaço visual em sessões longas de foco. O fundo base não utiliza preto absoluto puro, mas um tom antracite profundo e neutro (`#090A0F`), construindo camadas em superfícies progressivamente mais claras (`#11131A`, `#181B24`, `#222634`).

### Functional Palette & Quadrant Mapping
As cores semânticas não funcionam como alertas estridentes, mas como códigos cromáticos de alta legibilidade e sofisticação:
- **Q1 (Urgente & Importante — Executar Agora):** `#F43F5E` (Coral Carmim). Transmite alta prioridade e atenção imediata sem evocar pânico.
- **Q2 (Não Urgente & Importante — Foco Estratégico & Crescimento):** `#6366F1` (Índigo Violeta). Cor central do sistema; assinala blocos de trabalho focado, deep work e desenvolvimento sustentável.
- **Q3 (Urgente & Não Importante — Delegar / Operacional):** `#F59E0B` (Âmbar Ouro). Identifica interrupções, tarefas burocráticas e fricções operacionais.
- **Q4 (Não Urgente & Não Importante — Eliminar / Arquivar):** `#71717A` (Zinco Neutro Mudo). Submete itens marginais à menor saliência cromática do layout.

### Timer & Focus Session States
- **Pomodoro Ativo:** Acento dinâmico herdado da tarefa em execução (com predomínio do Índigo `#6366F1` em sessões regulares).
- **Pausa Curta (Short Break):** `#10B981` (Esmeralda Sálvia).
- **Pausa Longa (Long Break):** `#06B6D4` (Ciano Glacial).

## Typography

### Typographic Hierarchy & Pairing
- **Principal (Geist):** Empregada em todos os títulos, tarefas, descrições e controles de interface. Oferece clareza neutra, altura de x generosa e leitura desobstruída em telas de alta densidade de pixels.
- **Técnica & Métricas (JetBrains Mono):** Reservada para elementos numéricos que exigem contagem sem oscilação de largura: o cronômetro Pomodoro, carimbos de data/hora, atalhos de teclado (keybinds), badges de quadrante e contadores de ciclos (`03/04`).

### Tabular Numbers & Font Features
Todas as instâncias numéricas do timer e tags de tempo devem renderizar obrigatoriamente com a propriedade CSS `font-variant-numeric: tabular-nums` e `font-feature-settings: "tnum" 1`. Isso impede jitter horizontal quando os segundos são decrementados.

## Layout & Spacing

### Layout Philosophy
A SPA desktop adota uma grade fluida estruturada com restrição de largura máxima (`max-width: 1600px`) centralizada na viewport, garantindo proporções balanceadas em monitores ultrawide.

### Grid & Workspace Structure
- **Sidebar de Navegação / Métricas Rápidas:** Painel fixo colapsável à esquerda com largura de `240px` (ou `64px` recolhido).
- **Core Workspace (A Matriz 2x2):** O coração da aplicação é uma grade bidirecional de 2 colunas e 2 linhas para os 4 quadrantes (`Q1`, `Q2`, `Q3`, `Q4`), operando com gaps consistentes de `1.25rem` (`20px`). Cada quadrante possui rolagem interna independente (`overflow-y: auto`) com scrollbars invisíveis ou ultrafinas de 4px.
- **Dock / Floating Focus Bar:** Módulo flutuante inferior ou lateral dedicado ao Timer Pomodoro ativo, fixado com elevação limpa e atalhos rápidos de controle.

### Breakpoints & Adaptabilidade
- **Desktop Expandido (> 1280px):** Matriz 2x2 integral com visualização simultânea dos quatro quadrantes e dock de foco integrado.
- **Tablet / Telas Compactas (768px - 1279px):** Split de 2 colunas horizontais com tabs rápidas para alternar entre `Q1/Q2` (Foco) e `Q3/Q4` (Secundário), mantendo a persistência do timer.
- **Mobile (< 768px):** Reflow para coluna única com segmented control superior (`Q1 | Q2 | Q3 | Q4`) e bottom sheet persistente para o timer Pomodoro.

## Elevation & Depth

### Depth Philosophy
O sistema rejeita sombras pesadas ou skeumorfismo dramático em favor de **camadas tonais combinadas com bordas de micro-contraste** (*ghost borders*) e iluminação ambiente difusa.

### Surface Tiers
- **Tier 0 (Canvas Base):** `#090A0F` — O plano de fundo neutro e estável.
- **Tier 1 (Painéis & Colunas dos Quadrantes):** `#11131A` com contorno de `1px solid rgba(255, 255, 255, 0.05)`.
- **Tier 2 (Cartões de Tarefas & List Items):** `#181B24` em estado regular, elevando-se para `#202430` no hover com contorno de `1px solid rgba(255, 255, 255, 0.08)`.
- **Tier 3 (Modais, Menus de Contexto & Floating Timer Dock):** `#1A1D27` com desfoque de fundo (`backdrop-filter: blur(12px)`) e borda nítida de `1px solid rgba(255, 255, 255, 0.12)`.

### Ambient Glows (State-Driven)
Sombras são utilizadas estritamente de maneira funcional e semitransparente:
- Durante uma sessão de deep work no Pomodoro, o cartão ou dock ativo recebe uma aura tênue com raio de desfoque largo e opacidade controlada (`box-shadow: 0 0 24px -4px rgba(99, 102, 241, 0.12)`).
- Cartões Q1 prioritários possuem uma linha indicadora lateral de `2px` em `#F43F5E` sem dispersão excessiva de luz.

## Shapes

### Shape Language
A linguagem geométrica é controlada e compacta (`roundedness: 1`), transmitindo rigor arquitetônico e seriedade:
- **Base (0.25rem / 4px):** Utilizado em checkboxes, tags compactas de tempo, atalhos de teclado (`kbd`) e badges de contagem.
- **Intermediário (`rounded-lg` — 0.5rem / 8px):** Padrão definitivo para botões, campos de entrada de texto, cartões de tarefa da matriz e dropdowns contextuais.
- **Macro (`rounded-xl` — 0.75rem / 12px):** Reservado para os contêineres principais dos 4 quadrantes, o card flutuante do Pomodoro e modais de diálogo.
- **Exceção Pill (Full Rounded):** Restrito a switches de alternância de estado e indicadores de status pulsante do timer em modo minimizado.

## Components

### Buttons
- **Primary:** Fundo na cor de ênfase correspondente (ex: Índigo `#6366F1`), texto em contraste puro, cantos arredondados de `8px`, tipografia `13px` com peso `500`. Microinteração: redução de brilho em hover de 4% e escala sutil `scale(0.99)` ao clique.
- **Secondary / Ghost:** Fundo transparente ou translúcido (`rgba(255, 255, 255, 0.03)`), borda de `1px solid rgba(255, 255, 255, 0.07)`, texto em cinza claro (`#D4D4D8`). Ao hover, elevação de fundo para `rgba(255, 255, 255, 0.07)`.
- **Icon Only:** Dimensões quadradas de `32x32px` ou `28x28px`, centralizado, ícones com espessura de traço de `1.5px` (estilo Linear).

### Cards de Tarefas (Eisenhower Task Card)
- **Estrutura:** Superfície retangular limpa com padding interno de `12px 14px`, espaçamento compacto entre título e metadados.
- **Indicadores de Quadrante:** Barra vertical de precisão de `2px` alinhada à esquerda do card, colorida segundo o quadrante de destino (`Q1: Coral`, `Q2: Índigo`, `Q3: Âmbar`, `Q4: Cinza`).
- **Pomodoro Chips Integrados:** Ícone diminuto de relógio acompanhado do número de ciclos planejados/executados (ex: `🍅 2/4` ou representação com glifos geométricos `●●○○`) em `JetBrains Mono` 11px.
- **Drag & Drop Handle:** Indicador sutil de arraste visível no hover lateral para reclassificação instantânea entre quadrantes.

### Timer Pomodoro (Hero / Focus Display)
- **Modo Matriz Ativa:** Visualizador numérico em `JetBrains Mono` 72px com peso balanceado, centralizado e legível a distância.
- **Anel de Progresso (Progress Ring):** Traço fino de `2px` em SVG circular, com fundo em cinza translúcido e linha de preenchimento suavemente animada.
- **Ações Rápidas:** Controles de `Play/Pause`, `Pular Ciclo` e `Trocar Modo (Trabalho/Pausa)` operados preferencialmente por atalhos (`Espaço`, `Tab`, `Esc`).

### Inputs & Quick-Add Task
- **Quick Entry:** Campo inline de captura rápida no topo de cada quadrante ou atalho universal global (`Cmd/Ctrl + K` / `C`). Fundo escuro puro, sem borda saliente até receber foco. Ao foco: anel de realce de `1px` na cor do quadrante ativo.
- **Tags de Entrada em Linguagem Natural:** Suporte a chips imediatos acionados por prefixos (ex: digitando `!q1` move para Urgente, `~25m` agenda pomodoros).

### Checkboxes & Seletores
- **Checkbox Minimalista:** Caixa de `16x16px` com raio de `4px`, contorno fino de `1px solid rgba(255, 255, 255, 0.2)`. Quando marcada, transição imediata para preenchimento monocromático com checkmark de traço `1.5px`, aplicando simultaneamente efeito de `line-through` e opacidade atenuada (40%) no título da tarefa.

### Chips & Badges
- **Quadrant Badge:** Formato compacto, tipografia `label-sm` (`JetBrains Mono` 10px em maiúsculas), preenchimento semitransparente com 10% da opacidade da cor principal e texto com a cor pura do quadrante (ex: `Q2 FOCUS` com fundo `rgba(99, 102, 241, 0.1)` e texto `#6366F1`).
- **Keyboard Shortcut Badge (KBD):** `18px` de altura mínima, padding `2px 6px`, fundo `#181B24`, borda `1px solid rgba(255, 255, 255, 0.1)`, tipografia mono de 10px.
