# Load test results

Runs of `load-tests/guests.js`, newest first. How to run it is in "Load test", in the README. The raw reports of each run stay in `load-tests/.data/`, which git ignores, so the numbers worth keeping are copied here.

## 2026-11-16: simultaneous likes

**Where:** the same notebook and setup as the run below. App with `npm start`, k6 2.4.0 in Docker, `npm run load:likes` with its defaults.

**Scenario:** 100 guests on the same photo at the same time, the worst case for its total. Each one likes it, taps again, takes the like back and likes it again, 5 rounds: 2,000 like requests.

| Metric | Result |
| --- | --- |
| Like requests | 2,000 in 13.5 s (147 per second) |
| Failed requests | 0 |
| Like, median | 643 ms |
| Like, p95 | 849 ms |
| Like, max | 1.17 s |
| The photo's total (`npm run load:likes-report`) | 100, the same as its rows in `likes` |

Every threshold passed, and the total stayed right: no like was counted twice or lost. The times are high because every request updates the same row, so the database serializes them; likes spread over many photos wait less. The p95 is close to the 1 s threshold, so it is worth measuring again on the target hardware (RNF05).

## 2026-11-13: the worker's polling interval

**Where:** development notebook, Intel Core i5-12450HX (8 cores, 12 threads), 16 GB of RAM, Windows 11. App with `npm start`, Postgres and Garage in Docker Desktop 28.3.2, k6 2.4.0 in Docker. Everything on the same machine, without Wi-Fi.

**What changed:** after each job, pg-boss waits for its next poll before fetching another photo. At the default interval, 2 s, the queue could never pass 30 photos a minute, whatever the CPU. The worker now polls every 0.5 s, pg-boss's minimum (`src/lib/media-worker.ts`).

Two scenarios, each run before and after the change:

- **Light:** the defaults. 20 guests browsing and 5 sending 2 photos each, 10 in total.
- **Peak:** the uploads of RNF03. 20 guests browsing and 30 sending 1 photo each, all at once.

Each photo is a 12-megapixel JPEG of 3.3 MB.

### The worker's queue (`npm run load:report`)

| Metric | Light, before | Light, after | Peak, before | Peak, after |
| --- | --- | --- | --- | --- |
| Waiting in the queue, p50 | 8.5 s | 1.9 s | 26.2 s | 5.1 s |
| Waiting in the queue, p95 | 15.1 s | 3.0 s | 54.0 s | 11.3 s |
| Processing one photo, p50 | 0.7 s | 0.6 s | 0.4 s | 0.5 s |
| Upload confirmed to published, p95 | 15.8 s | 3.6 s | 54.4 s | 11.8 s |
| Upload confirmed to published, max | 15.8 s | 3.6 s | 56.3 s | 12.4 s |
| Photos published per minute | 30.6 | 90.0 | 30.4 | 119.7 |

Before, the queue published one photo every 2 s, while processing took under a second. After, it is limited by the CPU: about half a second per photo. In the light scenario, the 90 photos a minute are the pace at which photos arrived, not the worker's limit.

### Requests (k6)

| Metric | Light, before | Light, after | Peak, before | Peak, after |
| --- | --- | --- | --- | --- |
| Requests | 3,025 | 2,875 | 3,218 | 3,175 |
| Failed requests | 0 | 2 (0.07%) | 0 | 3 (0.09%) |
| Gallery page, p95 | 235 ms | 132 ms | 338 ms | 199 ms |
| Thumbnail, p95 | 173 ms | 91 ms | 183 ms | 131 ms |
| Upload of a photo (`upload_duration`), p95 | 2.3 s | 0.8 s | 5.6 s | 3.8 s |

Every threshold passed in all four runs. The polling doesn't touch these requests, so their differences between runs are noise. The failed requests are all `dial: i/o timeout`: k6, in Docker, couldn't open a connection to the notebook. See the limitations of the load test in the README.

### Not measured yet

- CPU and memory during the runs (RNF05).
- The full RNF03 scenario: 150 guests browsing.
- A Raspberry Pi, and the party's Wi-Fi.
