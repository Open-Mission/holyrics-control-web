# Repository Guidelines

## Project Structure & Module Organization

This app is a Vite + React + TypeScript frontend for Holyrics Control Web.

- `src/routes/`: TanStack Router route entries such as `index.tsx`, `settings.tsx`, and `themes.tsx`.
- `src/components/`: feature UI, split into folders like `dashboard/`, `settings/`, `songs/`, `playlists/`, and reusable `ui/` primitives.
- `src/components/design-system/`: app-level layout and composition primitives. Reuse these before creating route-local wrappers.
- `src/hooks/`: client-side stores and reusable hooks.
- `src/lib/`: runtime helpers, IndexedDB access, API mutators, and shared utilities.
- `src/api/endpoints/`: Orval-generated React Query clients and models.
- `src/assets/`: static images.
- `docs/superpowers/`: specs and implementation plans used during feature work.

## Build, Test, and Development Commands

- `pnpm dev`: starts Vite in host mode for local/device testing.
- `pnpm build`: runs TypeScript build checks and creates the production bundle.
- `pnpm lint`: runs ESLint across the repository.
- `pnpm preview`: serves the built app locally.
- `pnpm api:generate`: regenerates API clients from `orval.config.ts` and the backend OpenAPI schema.

Run `pnpm lint` and `pnpm build` before opening a PR.

## Coding Style & Naming Conventions

Use TypeScript with 2-space indentation, semicolons optional only when the file already follows that style, and `@/` path aliases instead of long relative imports. Prefer functional React components and colocate code by feature. Use:

- `kebab-case` for route files when applicable
- `PascalCase` for components
- `camelCase` for functions, hooks, and variables

Follow the existing shadcn/ui + design-system patterns. Avoid hard-coded colors in product UI; prefer semantic tokens from `src/index.css`.

## Testing Guidelines

There is no committed test suite wired into `package.json` yet. Until dedicated tests are added, treat `pnpm lint` and `pnpm build` as required validation. When adding tests, place `*.test.ts` or `*.test.tsx` near the related module and prefer focused coverage for stores, runtime helpers, and critical route behavior.

## Commit & Pull Request Guidelines

Recent history uses concise, imperative commits such as `feat: implement onboarding setup wizard` and `docs: add multi-server design spec`. Follow that pattern:

- `feat: ...` for features
- `refactor: ...` for internal cleanup
- `docs: ...` for specs or guides

PRs should include a short summary, affected routes/components, validation performed, and screenshots for visible UI changes.

## Configuration & Generated Code

Do not hand-edit generated API files under `src/api/endpoints/` unless you are intentionally patching generation output and documenting why. Runtime request behavior is centralized in `src/lib/holyrics-instance.ts`; keep server-resolution changes there.
