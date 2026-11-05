# pomodoro

Rastreador Pomodoro com timer por ciclos, seleção de quadrante (Eisenhower) e papel a cada bloco, e um painel semanal comparando o planejado com o realizado. Os dados ficam salvos no navegador entre sessões.

## Design

Regras e telas definidas no Google Stitch (projeto "Pomodoro Quadrant Tracker"), exportadas em `design/stitch/`:

- `DESIGN.md` — design system "Atelier Focus" (tokens + regras)
- `design-system.json`, `project.json` — export bruto do Stitch
- `screens/` — HTML e screenshot de cada tela (Timer & Sessão Ativa, Painel Semanal)

## Rodar

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # vitest
npm run lint     # eslint + tsc
npm run build
```

Os dados (blocos, plano semanal, papéis, estado do timer) ficam em `localStorage` sob a chave `pomodoro:v1`.
