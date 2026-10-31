// One-shot setup of the single-node Garage used in local mode, through its admin API (v2).
// Idempotent: each step checks the current state first, so it runs on every `docker compose up`.

const adminUrl = process.env.GARAGE_ADMIN_URL ?? "http://garage:3903";
// With a single node, capacity has nothing to be balanced against; it only needs to be set.
const capacity = Number(process.env.GARAGE_CAPACITY_BYTES ?? 100e9);
// A null capacity (what JSON makes of NaN) would turn the node into a gateway that stores nothing.
if (!Number.isSafeInteger(capacity) || capacity <= 0) {
  console.error(
    "GARAGE_CAPACITY_BYTES must be a positive whole number of bytes",
  );
  process.exit(1);
}

const required = [
  "GARAGE_ADMIN_TOKEN",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(", ")}`);
  process.exit(1);
}
const {
  GARAGE_ADMIN_TOKEN,
  S3_BUCKET,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
} = process.env;

/** Calls an admin endpoint; returns null on 404 so callers can tell "missing" from errors. */
async function admin(method, endpoint, body) {
  const response = await fetch(`${adminUrl}/v2/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${GARAGE_ADMIN_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body && JSON.stringify(body),
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(
      `${method} ${endpoint}: ${response.status} ${await response.text()}`,
    );
  }
  return response.json();
}

async function waitForGarage() {
  for (let attempt = 1; ; attempt++) {
    try {
      return await admin("GET", "GetClusterStatus");
    } catch (error) {
      if (attempt === 30) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function ensureLayout(status) {
  const [node] = status.nodes;
  if (node.role) {
    console.log(`Layout: node ${node.id.slice(0, 16)} already assigned`);
    return;
  }
  await admin("POST", "UpdateClusterLayout", {
    roles: [{ id: node.id, zone: "local", capacity, tags: [] }],
  });
  const layout = await admin("GET", "GetClusterLayout");
  await admin("POST", "ApplyClusterLayout", { version: layout.version + 1 });
  console.log(
    `Layout: node ${node.id.slice(0, 16)} assigned (version ${layout.version + 1})`,
  );
}

async function ensureBucket() {
  const query = `globalAlias=${encodeURIComponent(S3_BUCKET)}`;
  const existing = await admin("GET", `GetBucketInfo?${query}`);
  if (existing) {
    console.log(`Bucket: ${S3_BUCKET} already exists`);
    return existing;
  }
  const created = await admin("POST", "CreateBucket", {
    globalAlias: S3_BUCKET,
  });
  console.log(`Bucket: ${S3_BUCKET} created`);
  return created;
}

async function ensureKey() {
  const query = `id=${encodeURIComponent(S3_ACCESS_KEY_ID)}&showSecretKey=true`;
  const existing = await admin("GET", `GetKeyInfo?${query}`);
  if (existing) {
    // Otherwise a changed secret in .env would pass here and fail on every app request.
    if (existing.secretAccessKey !== S3_SECRET_ACCESS_KEY) {
      throw new Error(
        `Key ${S3_ACCESS_KEY_ID} exists in Garage with a different secret than S3_SECRET_ACCESS_KEY`,
      );
    }
    console.log(`Key: ${S3_ACCESS_KEY_ID} already exists`);
    return;
  }
  await admin("POST", "ImportKey", {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    name: "app",
  });
  console.log(`Key: ${S3_ACCESS_KEY_ID} imported`);
}

const status = await waitForGarage();
await ensureLayout(status);
const bucket = await ensureBucket();
await ensureKey();
await admin("POST", "AllowBucketKey", {
  bucketId: bucket.id,
  accessKeyId: S3_ACCESS_KEY_ID,
  permissions: { read: true, write: true, owner: true },
});
console.log(`Permissions: read, write and owner on ${S3_BUCKET}`);
