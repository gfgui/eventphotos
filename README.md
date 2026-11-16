# Event photos

Photo social network for events (TCC). Guests join through a QR Code, upload photos, like them and see rankings, from the phone's browser and with nothing to install. The technical specification, in Portuguese, is in [docs/especificacao-tecnica.md](docs/especificacao-tecnica.md).

## Requirements

- Node.js 22
- Docker Desktop

## Running in local mode

1. Install the dependencies: `npm install`.
2. Copy `.env.example` to `.env` and fill in the passwords and keys. The commands to generate them are in the file itself.
3. Start Postgres and Garage: `docker compose up -d`. The `garage-init` service sets up the node, the bucket and the access key, then exits.
4. Prepare the database: `npm run db:generate` and `npm run db:migrate`.
5. Run the app: `npm run dev`.
6. Open http://localhost:3000/admin, create the admin account and the first event. To go through the guest flow, use the guests' link on the event's page.

To check that the app reaches the database and the storage, open http://localhost:3000/api/health. The expected response is `{"database":"ok","storage":"ok"}`.

## Admin panel

The hosts' panel is at `/admin`. On the first access there is no account yet, so the page asks for the setup code, which is the value of `ADMIN_SETUP_CODE` in `.env`, and creates the account with a name, an e-mail and a password. From then on, the page is the login and the code is no longer accepted.

In the panel, hosts create events, change their name, honorees, date, cover, guest roles and rankings, choose the event's appearance, open the guests' link, see the photos and download the originals, one at a time or all together in a ZIP, in folders by role and by guest. The ZIP is put together while it is being sent, so it doesn't fill the server's memory.

How the access is protected:

- Passwords have at least 12 characters and are saved as scrypt hashes.
- The session is a random token in an `httpOnly`, `SameSite=Strict` cookie, valid for 7 days. Only its SHA-256 goes to the database, and signing out deletes it.
- After 5 wrong passwords in a row, the login is blocked for 15 minutes. The error message doesn't reveal whether the e-mail exists.
- Every page, Server Action and download checks the session and that the event belongs to that host.

In local mode, use the panel on the notebook itself (`localhost`). On the Wi-Fi the app runs over plain HTTP, so a password typed on another device would travel unencrypted.

There is no password recovery yet.

### Honorees and the couple's photos

The honorees are one or two short names of who the event celebrates, such as "Ana" and "Bruno". Their initials make the event's monogram ("AB"), which guests see in the header and, without a cover, on the welcome screen. Without honorees, the monogram comes from the event's name.

New events start with a "Noivos" role, so the couple can join through the guests' link and send photos like anyone else.

### Cover

The cover appears on the guests' welcome screen, in place of the event's initials. Hosts send it in the event's **Settings** tab. Unlike the guests' photos, it goes through the app (`/api/admin/events/[id]/cover`), which keeps only the version guests see: a WebP of up to 1600 pixels, without EXIF. The cover isn't part of the ZIP.

Guests load it from `/api/events/[slug]/cover`, which needs no session, since the welcome screen comes before joining. Each cover gets its own address, so browsers can keep it for good.

## Guest session

Guests have no password. When a guest finishes the entry (name, role and avatar), the server creates the `Guest` and saves a random token in an `httpOnly` cookie, one per event, valid for 90 days. Only the SHA-256 of the token goes to the database. Whoever clears the browser's cookies becomes a new guest.

## Photo uploads

Photos go straight from the phone to the storage, in multipart uploads presigned by the app: Uppy on the page and `/api/events/[slug]/uploads` on the server. If the network drops, the upload continues from the last finished part.

When an upload finishes, a worker running inside the app process (pg-boss, with one photo at a time) creates what guests see: a display version and a thumbnail, in WebP and without EXIF. The original stays exactly as it was uploaded. A photo that the worker can't read is marked as failed, and the guest sees that in "Minhas fotos".

### Camera and filters

The bar at the bottom of the gallery has two buttons. **Tirar foto** opens the phone's own camera, through a file field with `capture`: unlike a camera inside the page, it works over plain HTTP, and it keeps the full photo. **Galeria** picks photos already on the phone. Before sending, a screen shows the first photo with each filter (Original, P&B, Quente, Frio, Vivo, Suave and Vintage), and an optional description of up to 150 characters. The filter and the description go for the whole batch, and the description can't be changed later. It shows in the full-size view, in the `list` feed and in the panel.

A filter is data, not an edit: its name goes to `Media.filter`, and the pages apply it with CSS (`src/lib/filters.ts`). The file sent, its versions and the ZIP never change, so the SHA-256 of the original still matches the phone's file (RNF04). `Media.source` records whether the photo came from the camera or the gallery, as the page tells it.

When the app starts in local mode, it sets the bucket's CORS to the origin in `PUBLIC_URL`, and the upload URLs use the host of `PUBLIC_URL` with the port of `S3_ENDPOINT`. Other services, such as MinIO or Amazon S3, use the same code, because everything goes through the S3 API.

### Testing on a phone

1. Connect the phone to the same network as the computer.
2. In `.env`, set `PUBLIC_URL` to the computer's address, such as `http://192.168.0.10:3000`, and restart the app.
3. On the phone, open the guests' link shown in the admin panel, such as `http://192.168.0.10:3000/my-event`. To send photos from the computer, use this address too, because uploads from `localhost` are refused while `PUBLIC_URL` points to the IP.

If the phone can't connect, allow ports 3000 and 3900 in the computer's firewall.

## Likes and rankings

Guests like a photo with the heart on it, in the gallery or in the full-size view. Each guest has one like per photo, enforced by the key of `Like` (photo, guest). A like is a `PUT` to `/api/media/[id]/like` and taking it back a `DELETE`, and both can be repeated. In the same transaction, `Media.likeCount` only changes when a like was actually added or removed, so the total stays right with many guests tapping at once. The heart changes right away, and goes back if the request fails. Likes are accepted while the event is open.

The **Fotos** tab sorts the photos on the phone, with the functions in `src/lib/ranking.ts`:

| Order | How |
| --- | --- |
| Em alta (default) | Like Reddit's "hot": the order of magnitude of the likes plus how recent the photo is. A photo two hours newer needs ten times fewer likes to tie (`hotDecaySeconds`) |
| Mais curtidas | Most likes first |
| Recentes | Newest first |

The **Pódio** tab shows the three most liked photos and the three guests with the most published photos. Hosts turn each ranking on or off in the event's **Settings** tab: each block only appears while its ranking is on, and the tab disappears with both off. The rankings don't hide the hearts or the sorting by likes.

There are no real-time updates yet: other guests see new likes when they reload the page.

## Interface components

The components in `src/components/ui/` come from [shadcn/ui](https://ui.shadcn.com), in its default configuration (`base-nova` style, on top of Base UI). To add one, run `npx shadcn@latest add <component>` and then `npm run lint:fix`, because the generated code doesn't follow the Biome format.

## Themes

Each event has its own appearance, saved in `Event.appearance` as `{ "theme": "basic", "headingFont": "theme", "feedStyle": "grid" }`. The hosts choose it in the event's **Appearance** tab of the panel, which shows a preview of each option. A value the app doesn't know, or one an older event never saved, falls back to its default without changing the others. Guests get the new appearance the next time they load a page.

| Theme | Name in the panel | Look |
| --- | --- | --- |
| `basic` | Padrão / Default | shadcn's default tokens, defined by `:root` in `src/app/globals.css`. New events start with it |
| `essential` | Essencial / Essential | Newsreader titles over Inter, dark green accent |
| `heritage` | Herança / Heritage | Cormorant Garamond titles in italic over Jost, burgundy on warm paper |
| `confetti` | Confete / Confetti | Fraunces titles over Nunito Sans, purple accent, dark outlines and hard offset shadows |

The last three come from the same set of design systems, a Figma Make prototype, and share square corners, a paper grain behind the page, accent-colored eyebrows, semibold titles and an accent underline under the active tab. Those shared traits live in `src/themes/editorial.css`.

A theme changes the components in two ways:

- **Tokens:** colors, `--radius`, `--font-sans` and `--heading-font`. Components only use the tokens (`bg-background`, `text-muted-foreground`), never fixed colors, so they follow whichever theme is active.
- **Signatures:** rules in the theme's file that target a component by its `data-slot` attribute, the hook shadcn/ui components already carry (`button`, `tabs-trigger`, `input`). Our own components add `theme-scope`, `event-monogram`, `eyebrow` and `page-title`, and `Button` also sets `data-variant`. These rules are outside any cascade layer, so they win over utility classes.

To add a theme:

1. Create `src/themes/<id>.css` and override the tokens under `[data-theme="<id>"]`, plus any signature rules.
2. Bundle its fonts: put the `.woff2` files and their licenses in `src/fonts` and declare them in `src/themes/fonts.ts`, without preloading, so phones only download the fonts of the theme on screen.
3. Import the file at the top of `src/app/globals.css`, after the other theme imports.
4. Add the id to `themeIds` in `src/themes/config.ts`, and its name and description to `admin.appearance.themes` in both dictionaries.
5. For a dark theme, also add `[data-theme="<id>"] *` to `@custom-variant dark` in `src/app/globals.css`.

Restart `npm run dev` after adding the import, because the dev server may keep serving the previous stylesheet. Whatever the hosts save must pass `appearanceSchema`, in `src/themes/config.ts`.

### Title font and feed style

Besides the theme, hosts choose:

- **Title font:** the theme's own, or one of the bundled fonts: Newsreader, Cormorant Garamond, Fraunces, Jost, Nunito Sans or Inter. It replaces the theme's `--heading-font`, so it changes the event's name and the titles, while the text keeps the theme's font. Each option points to a variable of `src/themes/fonts.ts`, listed in `headingFontVariables`.
- **Feed style** of the **Fotos** tab: `grid`, three cropped photos per row; `list`, one card per photo, with its author, role and likes; or `wall`, two columns with each photo in its own shape. **Minhas fotos** stays a grid, because of the status badges.

## Languages

The interface is available in Brazilian Portuguese (default) and English.

- Every page lives under `/pt-BR/...` or `/en/...`.
- An unprefixed URL, such as the one in the QR Code, is redirected to the language chosen before or, on a first visit, to the phone's language. Languages other than Portuguese and English get Portuguese.
- The language links at the bottom of the page switch languages, and the choice is kept in the `NEXT_LOCALE` cookie.
- The hosts can fix the guests' language of an event in its **Settings** tab, saved in `Event.guestLocale`. Every guest page of that event then redirects to that language and hides the language links. **Automatic**, the default, keeps the behavior above.
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
| `npm run db:studio` | Opens Prisma Studio to browse the data |

To delete the database and the uploaded files, run `docker compose down -v`.

## Tests

Unit tests use [Vitest](https://vitest.dev) and live next to the code they test, as `*.test.ts`. They run in Node, without Docker: each test mocks the database, the storage and the environment variables, and the images are generated by sharp itself.

| Script | What it does |
| --- | --- |
| `npm test` | Runs every test once |
| `npm run test:watch` | Runs the tests again after each change |

What they cover:

- **Uploads:** only the guest's own upload can be signed, the type and size limits, the size check after the upload, and a confirmation that can be repeated (`src/lib/uploads.test.ts`).
- **RNF04 and RNF08:** the original is never written, the versions guests see have no EXIF and are upright, and the SHA-256 of the original is saved (`src/lib/media-processing.test.ts`).
- **RNF09:** the language of addresses without one, like the QR Code's (`src/proxy.test.ts`), and the language fixed by the hosts (`src/lib/events.test.ts`).
- **Export:** folders by role and by guest, with names valid on any system (`src/lib/host-media.test.ts`).
- **Cover:** the version guests see has no EXIF and fits in 1600 pixels, the previous cover is deleted, and files that aren't photos are refused (`src/lib/event-cover.test.ts`).
- **Likes (RF10):** one like per guest, and a total that only moves when a like comes or goes (`src/lib/likes.test.ts`).
- **Sorting and Podium (RF11):** the three orders, Em alta's two hours, and the ties (`src/lib/ranking.test.ts`, `src/lib/podium.test.ts`).
- **Filters (RNF04):** saved as data at the start of the upload, each with a CSS value and a name in both languages (`src/lib/uploads.test.ts`, `src/lib/filters.test.ts`).
- Passwords and session tokens, slugs, avatars, the appearance (themes, title fonts, feed styles and the defaults of older events), and the placeholders of the dictionaries in both languages.

End-to-end tests (Playwright) aren't set up yet. The load test has its own section, below.

## Load test

A light load test with [k6](https://grafana.com/docs/k6/), for RNF03 and RNF05. It plays the guests' side of a party: some guests browse the gallery while others send photos, through the same multipart upload as Uppy, straight to the storage. k6 runs in Docker, so there is nothing to install.

### How to run it

1. Start Postgres and Garage: `docker compose up -d`.
2. Build and start the app in production mode: `npm run build`, then `npm start`. Development mode compiles each page on its first visit, which would distort the numbers.
3. Run, in order:

| Script | What it does |
| --- | --- |
| `npm run load:seed` | Creates the `/load-test` event with 200 guests and 48 published photos, and a test photo. Removes the previous run first |
| `npm run load:run` | Runs the scenario in `load-tests/guests.js` and prints k6's summary |
| `npm run load:report` | Shows how the photos sent went through the worker's queue |
| `npm run load:clean` | Removes the event, its guests and its files |

The test event has no host, so no panel lists it. Its data (guests' cookies, the test photo and the reports) goes to `load-tests/.data/`, which git ignores. The seed refuses to run outside local mode unless `LOAD_TEST_ALLOW_CLOUD=true` is set, so the test data can't reach production by mistake.

### The scenario

- **Browse:** guests arrive over 15 seconds and browse for the test's duration: they open the gallery, load its first 12 thumbnails (6 at a time, like a phone's browser) and, now and then, a photo in full size, with pauses of a few seconds.
- **Upload:** 15 seconds in, a group of guests start sending photos, all at the same time: the peak of simultaneous uploads. Each photo is a 12-megapixel JPEG of about 3 MB, like a phone's.

It is light by default. The variables below scale it up to the scenario of RNF03:

| Variable | Light (default) | RNF03 |
| --- | --- | --- |
| `GUESTS`, guests browsing | 20 | 150 |
| `UPLOADERS`, guests sending photos at once | 5 | 30 |
| `PHOTOS`, photos per sender | 2 | 3 |
| `DURATION`, time browsing at full load | `1m` | `5m` |

In PowerShell: `$env:GUESTS=150; $env:UPLOADERS=30; npm run load:run`. In Git Bash: `GUESTS=150 UPLOADERS=30 npm run load:run`. Browsing and sending guests together can't exceed the guests of the seed; for more, use `npm run load:seed -- --guests 300`.

### Reading the results

k6 checks each step and ends with an error when a threshold isn't met. The thresholds, in `load-tests/guests.js`, are starting points for the criteria that RNF03 leaves to be defined:

| Metric | Threshold |
| --- | --- |
| Failed requests | Under 1% |
| Gallery page, 95th percentile | Under 2 s |
| Thumbnail, 95th percentile | Under 1 s |
| `upload_duration`: from starting a 3 MB upload to the photo going to the worker, 95th percentile | Under 20 s |

What happens after the upload, k6 can't see. `npm run load:report` reads it from the worker's jobs (pg-boss) and saves it as JSON in `load-tests/.data/`: how long the photos waited in the queue, how long the processing took, and how many photos per minute the worker published.

k6 doesn't measure the server either. For RNF05, watch the CPU and memory during the test: `docker stats` for Postgres and Garage, and the `node` process of the app (Task Manager on Windows, `top` on Linux or on a Raspberry Pi).

The results worth keeping go to [`load-tests/results.md`](load-tests/results.md), with the machine and the configuration of each run. The first entry compares the worker's queue before and after lowering its polling interval.

### Simultaneous likes

`load-tests/likes.js` is the "Curtidas simultâneas" test of the specification. Every guest of the scenario likes the same photo at the same time, taps again, takes the like back and likes it again, `ROUNDS` times. With the app in production mode and the seed done, run in order:

| Script | What it does |
| --- | --- |
| `npm run load:likes` | Runs the scenario: `LIKERS` guests (100 by default), `ROUNDS` rounds each (5 by default) |
| `npm run load:likes-report` | Compares each photo's `likeCount` with its rows in `likes`, and ends with an error if any differs |

Every guest ends up liking the photo, so its total must be the number of guests. k6 ends with an error when more than 1% of the requests fail, or when the 95th percentile of a like passes 1 s. A seed made before this scenario existed has no photo list for it: run `npm run load:seed` again.

### Limitations

- k6 isn't a browser: it doesn't run the page's JavaScript or keep a cache. Thumbnails are downloaded again on every visit, while phones keep them for a year, so the test is pessimistic there. The refresh every 2.5 seconds while a photo is being processed isn't simulated, so it is optimistic there.
- The seed creates the guests, instead of the entry flow: that flow is a Server Action, which k6 can't call reliably.
- Everything runs on the same notebook, without the party's Wi-Fi. To include it, run [k6 installed](https://grafana.com/docs/k6/latest/set-up/install-k6/) on another computer on the event's network: `k6 run -e BASE_URL=http://<notebook IP>:3000 load-tests/guests.js`, with `PUBLIC_URL` pointing to that IP, since the upload URLs are signed for it.
- In Docker, `localhost` is the container. That's why the test sends the storage requests to `host.docker.internal`, keeping the original `Host` header so the signatures stay valid.
- From Docker Desktop on Windows, a few new connections hang until they time out, at any point of the run: 0 to 3 per run so far, around 0.1% of the requests, below the 1% threshold. They show up as `dial: i/o timeout` and never reach the app. For final numbers, run k6 installed outside Docker.

## Lint and formatting

The project uses [Biome](https://biomejs.dev) for lint and formatting, instead of ESLint and Prettier. The configuration is in `biome.json` and includes the recommended rules for Next.js and React.

| Script | What it does |
| --- | --- |
| `npm run lint` | Checks lint, formatting and import order, without changing anything |
| `npm run lint:fix` | Fixes what is safe to fix automatically |
| `npm run format` | Only formats the files |

Run `npm run lint` and `npm test` before each commit. Markdown files are excluded, so the documentation tables are not reformatted.
