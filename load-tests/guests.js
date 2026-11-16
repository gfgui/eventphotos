// Load test of the guests' side: some guests browse the gallery while others send photos.
// Light by default; the variables below scale it up to the scenario of RNF03 (150 guests,
// 30 uploads at once). How to run it is in "Load test", in the README.

import { check, sleep } from "k6";
import exec from "k6/execution";
import http from "k6/http";
import { Counter, Trend } from "k6/metrics";

// Written by `npm run load:seed`: the test event and the cookies of its guests.
const session = JSON.parse(open("./.data/session.json"));
// A 12-megapixel JPEG, about 3 MB, like a phone's.
const photo = open("./.data/photo.jpg", "b");

const number = (value, fallback) => Number(value || fallback);

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
// Only when k6 runs in Docker, where "localhost" is the container: where to send the storage
// requests, which stay signed for the host in their URL.
const STORAGE_HOST = __ENV.STORAGE_HOST;
const GUESTS = number(__ENV.GUESTS, 20);
const UPLOADERS = number(__ENV.UPLOADERS, 5);
const PHOTOS = number(__ENV.PHOTOS, 2);
const DURATION = __ENV.DURATION || "1m";

// The size of the parts Uppy sends, the smallest S3 accepts.
const PART_SIZE = 5 * 1024 * 1024;

if (GUESTS + UPLOADERS > session.tokens.length) {
  throw new Error(
    `${GUESTS + UPLOADERS} guests needed, ${session.tokens.length} seeded: npm run load:seed -- --guests ${GUESTS + UPLOADERS}`,
  );
}

export const options = {
  scenarios: {
    // Guests arrive, then keep browsing for DURATION.
    browse: {
      executor: "ramping-vus",
      exec: "browse",
      stages: [
        { duration: "15s", target: GUESTS },
        { duration: DURATION, target: GUESTS },
        { duration: "10s", target: 0 },
      ],
    },
    // All of them start together: the peak of simultaneous uploads.
    upload: {
      executor: "per-vu-iterations",
      exec: "upload",
      vus: UPLOADERS,
      iterations: PHOTOS,
      startTime: "15s",
      maxDuration: "5m",
    },
  },
  // Starting points for the criteria RNF03 leaves "to be defined".
  thresholds: {
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"],
    "http_req_duration{name:gallery}": ["p(95)<2000"],
    "http_req_duration{name:thumbnail}": ["p(95)<1000"],
    upload_duration: ["p(95)<20000"],
  },
  summaryTrendStats: ["avg", "med", "p(95)", "max"],
  // Each virtual user is one phone, which keeps its cookies. By default k6 clears them after
  // every iteration, and the guest would lose the session.
  noCookiesReset: true,
};

/**
 * Before the clock starts, waits for the app to answer, and stops the test with a clear
 * message when it doesn't. Failed attempts here don't count in the results.
 */
export function setup() {
  for (let attempt = 1; attempt <= 10; attempt++) {
    const response = http.get(`${BASE_URL}/api/health`, {
      timeout: "5s",
      tags: { name: "warm-up" },
      responseCallback: http.expectedStatuses(0, { min: 200, max: 599 }),
    });
    if (response.status === 200) return;
    sleep(1);
  }
  throw new Error(
    `The app doesn't answer at ${BASE_URL}: run npm run build and npm start`,
  );
}

/** From the tap on "send" to the photo going to the worker, upload included. */
const uploadDuration = new Trend("upload_duration", true);
const photosSent = new Counter("photos_sent");

let signedIn = false;

/** Each virtual user is one of the seeded guests, through their cookie. */
function signIn() {
  if (signedIn) return;
  const token = session.tokens[exec.vu.idInTest - 1];
  http.cookieJar().set(BASE_URL, session.cookieName, token);
  signedIn = true;
}

/** Opens the gallery, its first rows of photos and, now and then, one photo in full. */
export function browse() {
  signIn();
  const page = http.get(`${BASE_URL}/pt-BR/${session.slug}/gallery`, {
    tags: { name: "gallery" },
  });
  const thumbnails = [
    ...new Set(page.body?.match(/\/api\/media\/[\da-f-]{36}\/thumbnail/g)),
  ].slice(0, 12);
  // Without a valid session the page still answers 200: the redirect to the entry happens
  // inside the streamed page, which k6 doesn't run. The seeded photos prove it is the gallery.
  check(page, {
    "gallery opens with photos": (response) =>
      response.status === 200 && thumbnails.length > 0,
  });
  // Six connections at a time, like a phone's browser.
  const responses = http.batch(
    thumbnails.map((path) => ({
      method: "GET",
      url: BASE_URL + path,
      params: { tags: { name: "thumbnail" } },
    })),
  );
  check(responses, {
    "thumbnails load": (all) =>
      all.every((response) => response.status === 200),
  });
  sleep(3 + Math.random() * 5);

  if (thumbnails.length > 0 && Math.random() < 0.3) {
    const chosen = thumbnails[Math.floor(Math.random() * thumbnails.length)];
    const display = http.get(
      BASE_URL + chosen.replace(/thumbnail$/, "display"),
      { tags: { name: "display" } },
    );
    check(display, { "photo opens": (response) => response.status === 200 });
    sleep(2 + Math.random() * 3);
  }
}

function sign(body) {
  return http.post(
    `${BASE_URL}/api/events/${session.slug}/uploads/sign`,
    JSON.stringify(body),
    { headers: { "Content-Type": "application/json" }, tags: { name: "sign" } },
  );
}

/** A request to a URL presigned by the app, straight to the storage. */
function storage(method, url, body, name) {
  const params = { tags: { name } };
  if (STORAGE_HOST) {
    const signedHost = url.split("/")[2];
    url = url.replace(signedHost, STORAGE_HOST);
    params.headers = { Host: signedHost };
  }
  return http.request(method, url, body, params);
}

/** Sends one photo the way Uppy does: a multipart upload straight to the storage. */
export function upload() {
  signIn();
  const startedAt = Date.now();

  const start = sign({
    method: "POST",
    key: "chosen-by-the-server",
    file: { type: "image/jpeg", size: photo.byteLength },
  });
  if (!check(start, { "upload starts": (r) => r.status === 200 })) return;
  const { url, key } = start.json();

  const created = storage("POST", url, null, "storage-create");
  const uploadId = /<UploadId>([^<]+)<\/UploadId>/.exec(
    created.body ?? "",
  )?.[1];
  if (
    !check(created, { "storage opens the upload": () => Boolean(uploadId) })
  ) {
    return;
  }

  const parts = [];
  for (let offset = 0; offset < photo.byteLength; offset += PART_SIZE) {
    const partNumber = parts.length + 1;
    const signed = sign({ method: "PUT", key, uploadId, partNumber });
    const sent = storage(
      "PUT",
      signed.json("url"),
      photo.slice(offset, offset + PART_SIZE),
      "storage-part",
    );
    if (!check(sent, { "part arrives": (r) => r.status === 200 })) return;
    parts.push(
      `<Part><PartNumber>${partNumber}</PartNumber><ETag>${sent.headers.Etag}</ETag></Part>`,
    );
  }

  const finish = sign({ method: "POST", key, uploadId });
  const completed = storage(
    "POST",
    finish.json("url"),
    `<CompleteMultipartUpload>${parts.join("")}</CompleteMultipartUpload>`,
    "storage-complete",
  );
  if (
    !check(completed, { "storage joins the parts": (r) => r.status === 200 })
  ) {
    return;
  }

  const confirmed = http.post(
    `${BASE_URL}/api/events/${session.slug}/uploads/complete`,
    JSON.stringify({ key }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { name: "complete" },
    },
  );
  if (
    check(confirmed, { "photo goes to the worker": (r) => r.status === 202 })
  ) {
    uploadDuration.add(Date.now() - startedAt);
    photosSent.add(1);
  }
  sleep(1 + Math.random() * 2);
}
