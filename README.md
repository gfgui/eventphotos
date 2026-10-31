# Event photos

Photo social network for events (TCC). Guests join through a QR Code, upload photos, like them and see rankings, from the phone's browser and with nothing to install. The technical specification, in Portuguese, is in [docs/especificacao-tecnica.md](docs/especificacao-tecnica.md).

## Requirements

- Node.js 22
- Docker Desktop

## Running in local mode

1. Install the dependencies: `npm install`.
2. Copy `.env.example` to `.env` and fill in the passwords and keys. The commands to generate them are in the file itself.
3. Start Postgres and Garage: `docker compose up -d`. The `garage-init` service sets up the node, the bucket and the access key, then exits.
4. Prepare the database: `npm run db:generate`, `npm run db:migrate` and `npm run db:seed`.
5. Run the app: `npm run dev` and open http://localhost:3000.

To check that the app reaches the database and the storage, open http://localhost:3000/api/health. The expected response is `{"database":"ok","storage":"ok"}`.

## Languages

The interface is available in Brazilian Portuguese (default) and English.

- Every page lives under `/pt-BR/...` or `/en/...`.
- An unprefixed URL, such as the one in the QR Code, is redirected to the language chosen before or, on a first visit, to the phone's language. Languages other than Portuguese and English get Portuguese.
- The language links at the bottom of the page switch languages, and the choice is kept in the `NEXT_LOCALE` cookie.
- Interface texts live in `src/i18n/dictionaries/`. `pt-BR.ts` is the reference, and the type check fails if `en.ts` is missing a key.

## Services

| Service | Port | Reachable from |
| --- | --- | --- |
| App (Next.js) | 3000 | Local network |
| Postgres | 5432 | This computer only |
| Garage, S3 API | 3900 | Local network, because phones upload straight to it |
| Garage, admin API | 3903 | This computer only |

## Database scripts

| Script | What it does |
| --- | --- |
| `npm run db:generate` | Generates the Prisma client in `src/generated/prisma` |
| `npm run db:migrate` | Creates and applies migrations from `prisma/schema.prisma` |
| `npm run db:seed` | Creates the test event (`test` slug) with sample roles |
| `npm run db:studio` | Opens Prisma Studio to browse the data |

To delete the database and the uploaded files, run `docker compose down -v`.

## Lint and formatting

The project uses [Biome](https://biomejs.dev) for lint and formatting, instead of ESLint and Prettier. The configuration is in `biome.json` and includes the recommended rules for Next.js and React.

| Script | What it does |
| --- | --- |
| `npm run lint` | Checks lint, formatting and import order, without changing anything |
| `npm run lint:fix` | Fixes what is safe to fix automatically |
| `npm run format` | Only formats the files |

Run `npm run lint` before each commit. Markdown files are excluded, so the documentation tables are not reformatted.
