# Photo social network for events (TCC)

Full specification (in Portuguese): @docs/especificacao-tecnica.md

## Overview

- Web app, with nothing to install, where event guests join through a QR Code, upload photos, like them and see rankings.
- Hosts customize the event (theme, font, feed style, roles, rankings), moderate and export the originals.
- The same code runs in two modes: local (the host's notebook, without internet) and cloud (production).

## Stack

- Next.js (App Router) with TypeScript and Tailwind
- shadcn/ui in its default configuration (`base-nova` style, on top of Base UI), in `src/components/ui/`
- Postgres with Prisma; pg-boss for background jobs
- S3-compatible storage: Garage in local mode, Amazon S3 in the cloud
- Direct upload to storage through presigned URLs (Uppy, multipart)
- sharp for thumbnails; Zod for validation
- Tests: Vitest, Playwright and k6
- Lint and formatting: Biome (`npm run lint`), instead of ESLint and Prettier
- Docker Compose in local mode: app, Postgres and Garage

## Project rules

- Never modify or recompress the uploaded original. Filters are stored as data and applied with CSS on display.
- In local mode, nothing may depend on the external internet: no CDN, fonts bundled with next/font and embedded SVG avatars.
- Guests only receive versions without EXIF metadata; the originals stay with the hosts.
- All configuration comes from environment variables, such as DEPLOY_MODE, PUBLIC_URL, DATABASE_URL, S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.
- No serverless: the app runs as a Node container in both modes.

## Conventions

- Everything in English: code, comments, Prisma models, routes and repository docs. The specification in `docs/` stays in Portuguese.
- The interface is bilingual: Brazilian Portuguese (default) and English. Every interface text lives in the dictionaries in `src/i18n/dictionaries/` (`pt-BR.ts` is the reference, `en.ts` must have the same keys); never hardcode interface text in components.
- Pages live under `src/app/[lang]/`; read the language with `getLocale()` and the texts with `getDictionary()` from `@/i18n/dictionaries`. `src/proxy.ts` sends unprefixed URLs to the saved or the phone's language.
- Each event has its own theme, so components only use the theme tokens (`bg-background`, `text-muted-foreground`), never fixed colors. How to add a theme is in the README.
- Every page, Server Action and route handler of the admin panel checks the session itself (`requireHost` or `getCurrentHost`) and that the event belongs to that host. `src/proxy.ts` only handles languages.
- Models: Host, Event, Role, Guest, Media and Like. Their fields are in "Modelo de dados", in the specification.
- IDs are UUIDs.
- Unit tests (Vitest) live next to the code, as `*.test.ts`, and mock the database, the storage and `@/lib/env`. Run `npm test` and `npm run lint` before finishing a change.

## Current phase: wrapping up phases 1 to 3

- Done in the code: phase 1 (Prisma schema, event creation with its cover, guest entry, upload from the gallery and the Photos tab, in local mode), phase 2 (likes, sorting, Podium and configurable rankings) and phase 3 (theme, title font, feed style, the phone's native camera and filters). The guests' language and the ZIP export were brought forward.
- Still open: the app's Docker image and the tests on real phones, from phase 1.
- Out of scope for now: the live camera inside the page (it needs HTTPS), real-time updates (SSE), gallery pagination, moderation, the QR Code and cloud mode.
