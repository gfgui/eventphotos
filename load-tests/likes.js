// Simultaneous likes: many guests like the same photo at the same time, tap twice and change
// their minds. k6 checks the answers; whether the photo's total still matches its likes is
// checked afterwards, by `npm run load:likes-report`. How to run it is in "Load test", in the
// README.

import { check, sleep } from "k6";
import exec from "k6/execution";
import http from "k6/http";

// Written by `npm run load:seed`: the test event, the cookies of its guests and its photos.
const session = JSON.parse(open("./.data/session.json"));

const number = (value, fallback) => Number(value || fallback);

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const LIKERS = number(__ENV.LIKERS, 100);
const ROUNDS = number(__ENV.ROUNDS, 5);

if (!session.photoIds?.length) {
  throw new Error(
    "The session file has no photos: run npm run load:seed again",
  );
}
if (LIKERS > session.tokens.length) {
  throw new Error(
    `${LIKERS} guests needed, ${session.tokens.length} seeded: npm run load:seed -- --guests ${LIKERS}`,
  );
}

// Everyone on the same photo: the worst case for its total.
const target = `${BASE_URL}/api/media/${session.photoIds[0]}/like`;

export const options = {
  scenarios: {
    // All of them start together, and each one repeats the taps ROUNDS times.
    likes: {
      executor: "per-vu-iterations",
      vus: LIKERS,
      iterations: ROUNDS,
      maxDuration: "2m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"],
    "http_req_duration{name:like}": ["p(95)<1000"],
  },
  summaryTrendStats: ["avg", "med", "p(95)", "max"],
  // Each virtual user is one phone, which keeps its cookies.
  noCookiesReset: true,
};

/** Before the clock starts, waits for the app to answer. */
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

let signedIn = false;

/** Each virtual user is one of the seeded guests, through their cookie. */
function signIn() {
  if (signedIn) return;
  const token = session.tokens[exec.vu.idInTest - 1];
  http.cookieJar().set(BASE_URL, session.cookieName, token);
  signedIn = true;
}

/** A like, a second tap, a change of mind and a like again: every guest ends up liking it. */
export default function () {
  signIn();
  for (const method of ["PUT", "PUT", "DELETE", "PUT"]) {
    const response = http.request(method, target, null, {
      tags: { name: "like" },
    });
    check(response, { "like saved": (answer) => answer.status === 200 });
  }
}
