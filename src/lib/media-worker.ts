import { PgBoss } from "pg-boss";
import { env } from "@/lib/env";
import { markMediaFailed, processMedia } from "@/lib/media-processing";

const queueName = "process-media";

type JobData = { mediaId: string };

async function bootQueue() {
  const boss = new PgBoss({
    connectionString: env.DATABASE_URL,
    schedule: false,
  });
  boss.on("error", (error) => console.error("Media queue error", error));
  await boss.start();

  await boss.createQueue(queueName, {
    retryLimit: 3,
    retryDelay: 10,
    retryBackoff: true,
  });

  // One photo at a time: the same notebook is serving the whole party.
  const workOptions = {
    includeMetadata: true,
    // After each job, pg-boss waits for the next poll before fetching another. At the default
    // of 2 s, the queue never passed 30 photos a minute in the load test, although each took
    // under a second. At the minimum, 0.5 s, the next photo starts right away.
    pollingIntervalSeconds: 0.5,
  } as const;
  await boss.work<JobData, void, typeof workOptions>(
    queueName,
    workOptions,
    async ([job]) => {
      try {
        await processMedia(job.data.mediaId);
      } catch (error) {
        if (job.retryCount >= job.retryLimit) {
          await markMediaFailed(job.data.mediaId);
        }
        throw error;
      }
    },
  );

  return boss;
}

// One queue per process: in development, hot reloads would otherwise start new workers.
const globalForQueue = globalThis as unknown as {
  mediaQueue?: Promise<PgBoss>;
};

/** Connects the queue and its worker, once. If it fails, the next call tries again. */
export function startMediaQueue() {
  globalForQueue.mediaQueue ??= bootQueue().catch((error) => {
    globalForQueue.mediaQueue = undefined;
    throw error;
  });
  return globalForQueue.mediaQueue;
}

export async function enqueueMediaProcessing(mediaId: string) {
  const boss = await startMediaQueue();
  await boss.send(queueName, { mediaId });
}
