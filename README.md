# thesis-barter-app

## Setup

  1. `npm install`
  2. Copy `config/.env-example` to `config/.env` and fill in values (see below).
  3. Set up a local Postgres database (see below).
  4. `npx prisma migrate dev` — applies migrations to your local DB.
  5. `npm run dev:server` — starts the server (via `tsx`, watches for changes).
  6. `npm run build` — builds the client (webpack).

  ## Environment variables

  All env vars live in `config/.env` Copy `config/.env-example` to get started.

  - `DATABASE_URL` — your local Postgres connection string. **This needs your own OS username, not a shared value** — see below.
  - `GEMINI_API_KEY` — for the moderation feature (not yet integrated).
  - `MODE` — `development` or `production`, controls webpack's build mode.

  ## Local database setup

  I used a real local Postgres, not Prisma's `prisma dev` local proxy — the proxy hit connection errors (`P1017`)
    - possibly because of a limitation of its 'experimental SQLite-backed server', and not a config issue. This has not yet been confirmed though. Will update.
      *_Windows/Linux teammates would need slightly different Postgres install steps than the Homebrew ones here._

  1. Install/start Postgres on MacOS: `brew install postgresql@15` (if not already installed), then `brew services start postgresql@15`.
    *_I'm sorry, I only included Mac commands on this draft. Will update._
  2. Create a database: `createdb thesis_barter_dev`
  3. Set `DATABASE_URL` in `config/.env` to:
     DATABASE_URL="postgresql://<your-mac-username>@localhost:5432/thesis_barter_dev"
  Run `whoami` if you're not sure what your username is. **Homebrew's Postgres doesn't create a `postgres` superuser like Linux installs do** — it creates one matching your OS
  username instead. If you leave the username off the connection string, you'll get a `P1010` access-denied error.
  4. `npx prisma migrate dev` to apply the schema.

  ## Module system

  This project uses ES modules (`"type": "module"` in `package.json`) — `import`/`export`, everywhere except `webpack.config.cjs` (explicitly `.cjs`, stays CommonJS on purpose).

  A Node ESM thing to remember: **relative imports need an explicit `.js` extension, even when importing from a `.ts` file.** Example: `import router from './routes/router.js'`
  is correct even though the actual source file is `router.ts`. This is how Node's ESM resolver works.
    *_I beleive there is also a config setting to allow relative imports without an extension but I don't remember the details. Will update._

  The server runs via `tsx` (`npm run dev:server` / `npm run start`), which handles the TS→JS transform at runtime — there's no separate compile step for local dev.

// for ts and tsx files, to test console logs:
// npx tsx [file name here].[file extension here]


Links to npm I need to read again:
- [npm-ci](https://docs.npmjs.com/cli/v10/commands/npm-ci)

- [package-lock.json](https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json)

- [config-omit](https://docs.npmjs.com/cli/v10/using-npm/config#omit)