# CLAUDE.md — Teselia

> Write all code, comments, commits, docs and README in **English** (public, international project).
>
> Maintainer's personal context (not in the repo, ignored if missing): @~/.claude/teselia.md

## What this project is

**Teselia** ("by caicesardev") is an open source suite of accessible micro components: small, single-purpose form inputs built with Vue 3 and shipped as framework-agnostic Web Components.

- Name story: _tessera_ = the small tile of a Roman mosaic (small pieces forming a whole) and, in ancient Rome, a token granting access. Ties to the personal brand (César) and to the core value: accessibility.
- Differentiators: **WCAG 2.2 AA by default**, strong design quality, European Accessibility Act awareness, keyboard-first ("Tested with Shift+Tab").
- Every component, name and design must be **original**.

## Project principles

- Public from the first commit (built in the open).
- **Fully open source, MIT.**
- Ship v1 of the first component before anything else. No gold-plating of infra or tooling.

## Hard rules

- **Clean room**: all code is written from scratch. Never reuse or recreate proprietary or third-party code.
- Don't introduce new tools or services without asking.

### Git, publishing and permissions — ALWAYS ask first

- **Everything stays local.** Never run `git commit`, `git push`, create branches on the remote, open pull requests or create/modify issues without my explicit permission for that specific action. Prepare the change, show me a summary and a proposed commit message, and wait.
- **Never publish anything** without asking first: no `npm publish`, `pnpm publish`, `changeset publish`, docs deploys, GitHub releases or tags.
- A permission applies only to the action I approved. It never carries over to later actions.

### Databases

- Read-only by default: only `SELECT` / read queries.
- Never run `DROP`, `DELETE`, `TRUNCATE`, `ALTER` or any other destructive or schema-changing statement unless I explicitly ask for it.

### Destructive actions

- **Warn me before anything that could permanently delete or overwrite project resources**: deleting files or folders, `rm -rf`, `git reset --hard`, `git clean`, `git checkout -- <file>` over uncommitted work, force pushes, rewriting history, overwriting config, clearing caches or build outputs that can't be regenerated, deleting packages or database data.
- Explain what will be lost and wait for my confirmation. If in doubt, ask.

## Decided

| Topic       | Decision                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| Suite name  | Teselia (brand, capitalized) / `teselia` (npm, lowercase)                                               |
| npm         | Org `@teselia` already created (free, public packages). First package: `@teselia/phone`                 |
| GitHub      | `caicesardev/teselia` on my personal account (may move to an org later)                                 |
| License     | MIT                                                                                                     |
| Repo layout | Monorepo with **pnpm workspaces**                                                                       |
| Stack       | Vue 3, Composition API, TypeScript, Vite (library mode), Vitest                                         |
| Delivery    | Custom elements via Vue `defineCustomElement` (Shadow DOM, style isolation)                             |
| Builds      | **ESM** (Vue as peer dependency) + **IIFE** (Vue bundled) for `<script>`/CDN use                        |
| CDN         | jsDelivr / unpkg straight from npm (`unpkg` / `jsdelivr` fields → IIFE)                                 |
| Theming     | CSS custom properties + `::part()`                                                                      |
| Forms       | Native `<form>` integration via `ElementInternals` (form-associated custom element)                     |
| Versioning  | Changesets (independent versions per package)                                                           |
| Docs        | VitePress in `docs/`, deployed to **teselia.caicesardev.com**                                           |
| Hosting     | Cloudflare Workers static assets via Workers Builds (Git integration): `main` → production, PRs → preview URLs. Config in `wrangler.jsonc` (assets dir, custom domain) |
| Docs engine | VitePress `2.0.0-alpha` pinned exactly (1.x is frozen on Vite 5); aliases `@teselia/phone` to its source |
| Tasks       | GitHub Issues + GitHub Projects                                                                         |
| Testing     | Vitest (Node) for pure logic; Vitest browser mode + Playwright (Chromium, Firefox, WebKit) + `axe-core` |
| Line ending | LF everywhere, enforced by `.gitattributes`                                                             |

## Repo structure (target)

```
teselia/
├── package.json            # "private": true, workspace root, never published
├── pnpm-workspace.yaml     # packages/*, docs
├── tsconfig.base.json
├── .changeset/
├── design/                 # design docs ("memoria") per component, e.g. design/phone.md
├── docs/                   # VitePress site (private package)
├── scripts/                # repo scripts, e.g. check-public-types.mjs
└── packages/
    ├── phone/              # @teselia/phone (published)
    ├── otp/                # @teselia/otp (published, in progress)
    └── shared/             # @teselia/shared (private, bundled into each component)
```

- **`packages/shared`** holds code used by two or more components: composables (announcer, custom states, implicit submission), `base.css` (tokens, host styles, `.visually-hidden`) and test support (`@teselia/shared/test`: axe helper, `emulateMedia` command). Move code there only when a second component needs it. The form-associated element class stays in each component (see design/otp.md D8: a shared mixin inlines the whole `HTMLElement` type into the public `.d.ts`).
  - It is **private and never published**. Components list it as a **devDependency** (`"workspace:*"`), and Vite bundles it into their builds. It must never become a runtime `dependency`.
  - Types: its `exports` have a `teselia-source` condition. Each component's `tsconfig.json` sets `customConditions: ["teselia-source"]`, so typechecking and tests use the source. `tsconfig.build.json` resets it to `[]`, so declaration builds use `packages/shared/dist` (built first by `pnpm build`).
  - Every component build ends with `node ../../scripts/check-public-types.mjs`. It fails if the published declarations reachable from `types` import anything consumers cannot install, such as `@teselia/shared`.
- Layout inside a component package (`packages/phone`):

  ```
  src/
  ├── index.ts, element.ts   # public entry and the form-associated custom element class
  ├── TesPhone.ce.vue        # template + wiring only
  ├── tes-phone.css          # component styles (<style src>, inlined into the shadow root)
  ├── props.ts               # props interface and default texts
  ├── composables/           # one responsibility each (combobox, number field, validation, events…)
  └── core/                  # pure, framework-free logic, unit tested in Node
  test/
  ├── unit/                  # Node tests for src/core
  ├── browser/               # Vitest browser mode: Chromium, Firefox, WebKit (files run sequentially)
  └── support/               # component helpers (generic ones live in @teselia/shared/test)
  ```

  New logic goes into `core/` when it has no Vue or DOM dependency, otherwise into a focused composable. Keep the SFC thin.
- `packages/phone/package.json` essentials: `"files": ["dist"]`, `exports` with `"."` (ESM + types) and `"./iife"` (no `"./style.css"`: `.ce.vue` styles are inlined into the shadow root, so there is no external stylesheet; add one only if a light-DOM stylesheet becomes necessary, e.g. `:not(:defined)` FOUC rules); `unpkg`/`jsdelivr` pointing to the IIFE; `peerDependencies: { vue: "^3.5.0" }`; `publishConfig.access: "public"`; `repository.directory: "packages/phone"`; `homepage: https://teselia.caicesardev.com/phone`.
- Root scripts: `build`, `test`, `docs:dev`, `docs:build`, `changeset`, `version-packages`, `release` (`pnpm build && changeset publish`).

## First component: `@teselia/phone`

Accessible international phone input with country dial code.

**`design/phone.md` is the source of truth** for scope, public API, accessibility spec, definition of done and milestones. Read it before working on the component, and update it in the same change when a decision changes.

Summary: `<tes-phone>`, `libphonenumber-js` (min metadata), country names via `Intl.DisplayNames`, no flags in v1, APG editable combobox, E.164 form value. **Released `1.0.0` on 2026-09-27.** VoiceOver testing is still pending (#27).

## Second component: `@teselia/otp`

Accessible one-time code input. **`design/otp.md` is the source of truth.**

Summary: `<tes-otp>`, one real `<input>` drawn as cells (not one input per character), digits by default and `type="alphanumeric"` as an option, `autosubmit` opt-in, no runtime dependency besides Vue. Shared code with phone moves to a private, bundled `packages/shared`. Target: `1.0.0` on **2026-10-24**.

## How we work

- Break work into small issues (1–2 hours each) with acceptance criteria.
- Every session should end with something visible: a merged PR on `main`, an updated demo, a new green test.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`...).
- Code style: self-documenting code with minimal or no comments. Prefer clear names and small functions; comment only a non-obvious *why* that code cannot express.
- `main` is protected: every change lands through a pull request (squash merge only), and the `Verify` CI check (typecheck, builds, tests in Chromium/Firefox/WebKit) must pass with the branch up to date.
- Current roadmap: pinned issue #84 and the `otp v1.0.0` milestone (phone's was #31 / `v1.0.0`, done). Pick the next open issue from the roadmap, in order.
- Branching: trunk-based. `main` is the only long-lived branch and is always releasable. Work happens in short-lived branches named after the change (`feat/phone-combobox`, `chore/monorepo-scaffold`), merged into `main` through a pull request with squash merge. No `dev` branch.
- TypeScript is pinned to `~6.0`: TypeScript 7 is the native (Go) compiler and ships no JavaScript API, which `vue-tsc` and declaration generators need. Revisit when the Vue tooling supports it.

## First steps

1. ~~Help me write `design/phone.md` (the "memoria") resolving the open decisions.~~ Done.
2. ~~Scaffold the monorepo (pnpm workspaces, TS base config, Changesets, Vitest).~~ Done.
3. ~~Scaffold `packages/phone` with Vite library mode (ESM + IIFE) and a minimal `defineCustomElement` component.~~ Done, including the form-association spike.
4. ~~Scaffold the VitePress docs site importing the local package.~~ Done.
5. Turn the v1 scope into GitHub issues.
