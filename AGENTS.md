# Quadrantic Pomodoro

A desktop web app that runs Pomodoro cycles and tags each focus block with an Eisenhower quadrant and a role; all data
stays in the browser. See the [README](README.md).

Stack: TypeScript 5.6, React 18, Vite 5, Tailwind 3, Vitest 2, ESLint 9 (`package.json`), Node 24 (`mise.toml`). The
code is the previous app; [ADR 0001](docs/adr/0001-frontend-stack.md) decides the redesign's stack, which replaces it.

## Quick reference

- Install or add a dependency: `mise exec -- npm ci`; `npm install <pkg>` (ask first)
- Run: `mise exec -- npm run dev`
- Build: `mise exec -- npm run build`
- Test one file: `mise exec -- npx vitest run src/domain/timer.test.ts`
- Lint or format one file: `mise exec -- npx eslint <file>`
- Generate code: none
- Local services: none
- Worktrees: see the Worktrees line at the end of this file
- Quick check, seconds on what changed: `mise exec -- npx vitest run <test file>` and `mise exec -- npx eslint <file>`
- Done check, all that must pass before a change is done: `scripts/ralph-check HEAD` (lint, tsc, tests, build;
  about 5 s, no services)

## Boundaries

**Always**

- Run the Quick check before moving on. A change is done when the Done check passes.
- Report each check's result, or that it did not run.
- Update this file in the change that alters a command, path or rule it names.
- Keep this file under 800 words; past 1,200, move a section into a skill or memory file before adding. All
  `AGENTS.md` files together stay under 16 KiB.
- Make no network request at runtime ([ADR 0001](docs/adr/0001-frontend-stack.md)).

**Never**

- Commit secrets or credentials, or put personal data in logs, fixtures or commits.
- Edit generated files by hand: `dist/`, `cook.lock`, and the `cook:begin`…`cook:end` sections.
- Make a check pass by weakening it: skipping a test, suppressing a warning, loosening an assertion.

**Stop and ask** before adding a dependency or rewriting pushed history, and when a check fails again after a fix, a
command is refused, or a decision is left open.

Enforced by `.agents/permission/policy.yaml`. A refusal is the rule working.

## Where things go

- New code: `src/domain/` for framework-free logic, `src/state/` for storage, `src/ui/` and `src/pages/` for
  components; the design is [`DESIGN.md`](DESIGN.md).
- Tests: next to the code as `<name>.test.ts`, such as `src/domain/timer.test.ts`.
- Settings: none; the app has no configuration or secrets.
- Decisions and domain rules: `docs/adr/`.
- A procedure an agent repeats: a skill in `.agents/skills/`.
- A trap in one area: `.agents/memory/`, listed under Deep dive.

## Rules

- A behavior change ships with a test; a bug fix with one that failed before the fix.
- Comments record only reasons the code cannot show.
- Change only what the task needs, matching the surrounding code.
- Commits: one change per commit on a feature branch; open a pull request against `main`.
- Deploy: none; there is no hosting yet.

## Gotchas

- Claude Code skips `AGENTS.md` while a `CLAUDE.md` exists; `.gitignore` keeps it out, so put instructions here.

## Deep dive (read on demand)

- Driving the app in a browser: the `verify` skill in `.agents/skills/verify/`.
- The agent layout and its policy: `.agents/README.md`.
- Unattended runs: `.ralph-tui/bin/run <name> --agent claude --epic <id>`, then `.ralph-tui/bin/clean <name>`.
<!-- cook:begin io.github.lmarqs.cookbook:git#worktrees/worktrees -->
<!-- io.github.lmarqs.cookbook:git#worktrees --instructions=AGENTS.md --instructions=README.md -->
- Worktrees: branch `<branch>` is checked out at `.worktrees/<branch>`; `.worktrees/README.md` says how to
  create one ready to run and remove it.
<!-- cook:end io.github.lmarqs.cookbook:git#worktrees/worktrees -->
