# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the TypeScript source. Entry point is `src/index.ts`, server wiring is in `src/server.ts`.
- `src/client/` contains Linode API client wrappers.
- `src/tools/` defines MCP tool categories and schemas by service (e.g., `instances`, `networking`, `objectStorage`).
- `dist/` is the compiled output from `tsc` (published artifacts).
- `img/` and `smithery.yaml` support documentation/marketplace metadata.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: run the server from TypeScript via `ts-node`.
- `npm run build`: compile to `dist/` with `tsc`.
- `npm run start`: run the built server (`node dist/index.js`).
- `npm run lint`: run ESLint over the repo.
- `npm run inspect`: build and launch the MCP inspector against the built server.

## Coding Style & Naming Conventions
- TypeScript (ES2022, NodeNext modules) with `strict` enabled in `tsconfig.json`.
- Indentation is 2 spaces; follow existing formatting in `src/`.
- ESLint is configured in `.eslintrc.js`; prefer lint fixes over ad‑hoc formatting changes.
- Tool categories and filenames are lower‑case (`objectStorage`, `nodebalancers`); schema files live next to tools.

## Testing Guidelines
- Jest/ts‑jest are listed in `devDependencies`, but there is no `npm test` script or Jest config yet.
- If you add tests, name files `*.test.ts` and keep them out of `dist/` (current `tsconfig.json` excludes them from build).
- Document any new test command in `package.json` and update this guide.

## Commit & Pull Request Guidelines
- Recent commits use short, imperative subjects (e.g., “refactor paging interface for client”). There is no enforced conventional‑commit format.
- Keep commits scoped to a single concern and include the “why” in the body if behavior changes.
- PRs should include a brief description, linked issue (if any), and usage notes for any CLI or API changes.

## Configuration & Secrets
- The server needs a Linode token via `--token`, `LINODE_API_TOKEN`, or a local `.env` file.
- Never commit tokens or `.env` files; use env vars or local config instead.
