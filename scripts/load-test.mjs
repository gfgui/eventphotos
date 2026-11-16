// Prepares, measures and removes the data of the load test. See "Load test" in the README.
//
//   node scripts/load-test.mjs seed [--guests 200] [--photos 48]
//   node scripts/load-test.mjs report
//   node scripts/load-test.mjs likes
//   node scripts/load-test.mjs clean
//
// Everything lives in one event, under the slug below and with no host, so no panel lists it.
// Uses the database and the bucket of .env, like the app.

import "dotenv/config";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import {
  AbortMultipartUploadCommand,
  DeleteObjectCommand,
  ListMultipartUploadsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import pg from "pg";
import sharp from "sharp";

const slug = "load-test";
const dataDir = new URL("../load-tests/.data/", import.meta.url);
const sessionFile = new URL("session.json", dataDir);
const photoFile = new URL("photo.jpg", dataDir);

if (
  process.env.DEPLOY_MODE !== "local" &&
  process.env.LOAD_TEST_ALLOW_CLOUD !== "true"
) {
  console.error(
    "The load test writes to the database and the bucket of .env. Outside local mode, " +
      "confirm with LOAD_TEST_ALLOW_CLOUD=true.",
  );
  process.exit(1);
}

const bucket = process.env.S3_BUCKET;
// The same settings as src/lib/storage.ts.
const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: /^(true|1|yes|on)$/i.test(
    process.env.S3_FORCE_PATH_STYLE ?? "",
  ),
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function findEvent(db) {
  const { rows } = await db.query("select id from events where slug = $1", [
    slug,
  ]);
  return rows[0] ?? null;
}

/** Runs `task` on every item, a few at a time. */
async function inBatches(items, task, size = 16) {
  for (let start = 0; start < items.length; start += size) {
    await Promise.all(items.slice(start, start + size).map(task));
  }
}

/** A photo like a phone's: 12 megapixels, about 3 MB of JPEG. Created once. */
async function createUploadPhoto() {
  const exists = await stat(photoFile).then(
    () => true,
    () => false,
  );
  if (exists) return;
  const photo = await sharp({
    create: {
      width: 4032,
      height: 3024,
      channels: 3,
      background: "#808080",
      // Noise doesn't compress well, so the file has a phone photo's size.
      noise: { type: "gaussian", mean: 128, sigma: 14 },
    },
  })
    .jpeg({ quality: 85 })
    .toBuffer();
  await writeFile(photoFile, photo);
}

/** The files of a photo already in the gallery, with the worker's sizes and qualities. */
async function galleryPhotoFiles() {
  const original = await sharp({
    create: {
      width: 1600,
      height: 1200,
      channels: 3,
      background: "#a06040",
      noise: { type: "gaussian", mean: 128, sigma: 10 },
    },
  })
    .jpeg({ quality: 85 })
    .toBuffer();
  return {
    original,
    display: await sharp(original).webp({ quality: 82 }).toBuffer(),
    thumbnail: await sharp(original)
      .resize({ width: 640, height: 640, fit: "inside" })
      .webp({ quality: 72 })
      .toBuffer(),
  };
}

function put(key, body, contentType) {
  return s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

async function seed(db, { guests, photos }) {
  await clean(db, { quiet: true });
  await mkdir(dataDir, { recursive: true });
  await createUploadPhoto();

  const {
    rows: [event],
  } = await db.query(
    `insert into events (id, slug, name, date, status, updated_at)
     values (gen_random_uuid(), $1, 'Load test', now(), 'OPEN', now())
     returning id`,
    [slug],
  );
  const {
    rows: [role],
  } = await db.query(
    `insert into roles (id, event_id, name, sort_order)
     values (gen_random_uuid(), $1, 'Guest', 0)
     returning id`,
    [event.id],
  );

  // A guest's cookie holds a token, and the database only its SHA-256, as in
  // src/lib/session-token.ts. The tokens go to the session file, for k6.
  const tokens = Array.from({ length: guests }, () =>
    randomBytes(32).toString("base64url"),
  );
  const { rows: guestRows } = await db.query(
    `insert into guests (id, event_id, role_id, name, avatar, token_hash)
     select gen_random_uuid(), $1, $2, 'Guest ' || n, 'casual/' || (n % 16), hash
     from unnest($3::text[]) with ordinality as t(hash, n)
     returning id`,
    [event.id, role.id, tokens.map(sha256)],
  );

  // Photos already published, so guests have a gallery to browse. The same picture under a new
  // key each time: every request still reaches the storage.
  const files = await galleryPhotoFiles();
  const media = Array.from({ length: photos }, (_, index) => {
    const id = randomUUID();
    return {
      id,
      guestId: guestRows[index % guestRows.length].id,
      originalKey: `events/${event.id}/originals/${id}`,
      displayKey: `events/${event.id}/display/${id}.webp`,
      thumbnailKey: `events/${event.id}/thumbnails/${id}.webp`,
    };
  });
  await inBatches(media, (photo) =>
    Promise.all([
      put(photo.originalKey, files.original, "image/jpeg"),
      put(photo.displayKey, files.display, "image/webp"),
      put(photo.thumbnailKey, files.thumbnail, "image/webp"),
    ]),
  );
  // One second apart, newest first, like photos sent during a party.
  await db.query(
    `insert into media (id, event_id, guest_id, source, original_key, display_key,
       thumbnail_key, mime_type, size_bytes, width, height, sha256, status, created_at)
     select id, $1, guest_id, 'GALLERY', original_key, display_key, thumbnail_key,
       'image/jpeg', $7, 1600, 1200, $8, 'PUBLISHED',
       now() - make_interval(secs => n::double precision)
     from unnest($2::uuid[], $3::uuid[], $4::text[], $5::text[], $6::text[])
       with ordinality as t(id, guest_id, original_key, display_key, thumbnail_key, n)`,
    [
      event.id,
      media.map((photo) => photo.id),
      media.map((photo) => photo.guestId),
      media.map((photo) => photo.originalKey),
      media.map((photo) => photo.displayKey),
      media.map((photo) => photo.thumbnailKey),
      files.original.length,
      sha256(files.original),
    ],
  );

  await writeFile(
    sessionFile,
    JSON.stringify(
      {
        slug,
        eventId: event.id,
        cookieName: `guest_${event.id}`,
        tokens,
        // For the simultaneous likes, in load-tests/likes.js.
        photoIds: media.map((photo) => photo.id),
      },
      null,
      2,
    ),
  );
  console.log(
    `Ready: /${slug} with ${guests} guests and ${photos} published photos.`,
  );
}

const percentile = (sorted, p) =>
  sorted.length === 0
    ? null
    : sorted[
        Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
      ];

function summarize(values) {
  const sorted = values.filter((value) => value !== null).sort((a, b) => a - b);
  const seconds = (ms) => (ms === null ? "-" : (ms / 1000).toFixed(1));
  return {
    "p50 (s)": seconds(percentile(sorted, 50)),
    "p95 (s)": seconds(percentile(sorted, 95)),
    "max (s)": seconds(sorted.at(-1) ?? null),
  };
}

/** How the photos sent during the test went through the worker's queue (pg-boss). */
async function report(db) {
  const event = await findEvent(db);
  if (!event) {
    console.log("No load test event. Run the seed first.");
    return;
  }

  const { rows: statuses } = await db.query(
    `select status, count(*)::int as photos from media
     where event_id = $1 group by status order by status`,
    [event.id],
  );
  // Only the photos sent by k6 have jobs: the seeded ones never went through the queue.
  const { rows: jobs } = await db.query(
    `select j.state,
       extract(epoch from j.started_on - j.created_on) * 1000 as waited,
       extract(epoch from j.completed_on - j.started_on) * 1000 as worked,
       extract(epoch from j.completed_on - j.created_on) * 1000 as total,
       j.created_on, j.completed_on
     from pgboss.job j
     join media m on m.id::text = j.data->>'mediaId'
     where j.name = 'process-media' and m.event_id = $1`,
    [event.id],
  );
  const ms = (column) =>
    jobs.map((job) => (job[column] === null ? null : Number(job[column])));

  console.log("\nPhotos of the load test event, by status");
  console.table(statuses);

  if (jobs.length === 0) {
    console.log("No photo was sent to the queue. Run the test first.");
    return;
  }

  const queue = {
    "waiting in the queue": summarize(ms("waited")),
    processing: summarize(ms("worked")),
    "upload confirmed to published": summarize(ms("total")),
  };
  console.log(`\nWorker queue: ${jobs.length} photos`);
  console.table(queue);

  const completed = jobs.filter((job) => job.state === "completed");
  const first = Math.min(...jobs.map((job) => job.created_on.getTime()));
  const last = Math.max(...completed.map((job) => job.completed_on.getTime()));
  const perMinute =
    completed.length > 0 ? completed.length / ((last - first) / 60_000) : 0;
  console.log(
    `Throughput: ${perMinute.toFixed(1)} photos per minute (${completed.length} of ${jobs.length} done)`,
  );

  const file = new URL(
    `report-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
    dataDir,
  );
  await writeFile(
    file,
    JSON.stringify(
      {
        statuses,
        queue,
        photosPerMinute: perMinute,
        done: completed.length,
        sent: jobs.length,
      },
      null,
      2,
    ),
  );
  console.log(`Saved in load-tests/.data/${file.pathname.split("/").at(-1)}`);
}

/**
 * After load-tests/likes.js: each photo's total must match its rows in likes, however many
 * guests tapped at the same time.
 */
async function likes(db) {
  const event = await findEvent(db);
  if (!event) {
    console.log("No load test event. Run the seed first.");
    return;
  }

  const { rows } = await db.query(
    `select m.id, m.like_count, count(l.guest_id)::int as likes
     from media m left join likes l on l.media_id = m.id
     where m.event_id = $1
     group by m.id
     having m.like_count > 0 or count(l.guest_id) > 0
     order by m.like_count desc`,
    [event.id],
  );
  if (rows.length === 0) {
    console.log("No likes yet. Run npm run load:likes first.");
    return;
  }

  for (const row of rows) {
    const mark = row.like_count === row.likes ? "" : "  <- different";
    console.log(
      `${row.id}: total ${row.like_count}, likes ${row.likes}${mark}`,
    );
  }
  const wrong = rows.filter((row) => row.like_count !== row.likes);
  if (wrong.length > 0) {
    console.error(`${wrong.length} photo(s) with a total that doesn't match.`);
    process.exitCode = 1;
  } else {
    console.log("Every total matches its likes.");
  }
}

async function clean(db, { quiet = false } = {}) {
  const event = await findEvent(db);
  if (!event) {
    if (!quiet) console.log("No load test event to remove.");
    return;
  }

  const prefix = `events/${event.id}/`;
  // Uploads the test left halfway, which don't show up as files.
  const pending = await s3.send(
    new ListMultipartUploadsCommand({ Bucket: bucket, Prefix: prefix }),
  );
  await inBatches(pending.Uploads ?? [], ({ Key, UploadId }) =>
    s3.send(new AbortMultipartUploadCommand({ Bucket: bucket, Key, UploadId })),
  );

  let removed = 0;
  let continuationToken;
  do {
    const page = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    // One by one: DeleteObjects needs checksums that not every S3-compatible storage takes.
    await inBatches(page.Contents ?? [], ({ Key }) =>
      s3.send(new DeleteObjectCommand({ Bucket: bucket, Key })),
    );
    removed += page.Contents?.length ?? 0;
    continuationToken = page.NextContinuationToken;
  } while (continuationToken);

  // Roles, guests and media go with the event.
  await db.query("delete from events where id = $1", [event.id]);
  await rm(sessionFile, { force: true });
  if (!quiet) {
    console.log(`Removed the load test event and its ${removed} files.`);
  }
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    guests: { type: "string", default: "200" },
    photos: { type: "string", default: "48" },
  },
});

const commands = {
  seed: (db) =>
    seed(db, { guests: Number(values.guests), photos: Number(values.photos) }),
  report,
  likes,
  clean,
};
const command = commands[positionals[0]];

if (!command) {
  console.error("Usage: node scripts/load-test.mjs seed|report|likes|clean");
  process.exitCode = 1;
} else {
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await command(db);
  } finally {
    await db.end();
  }
}
