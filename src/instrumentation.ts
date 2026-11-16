/** Runs once when the server starts. The photo worker lives in the same process as the app. */
export async function register() {
  // Not while `next build` prerenders: the database and the storage may not even be there.
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return;
  }

  const { allowBrowserUploads } = await import("@/lib/storage");
  const { startMediaQueue } = await import("@/lib/media-worker");

  const steps = await Promise.allSettled([
    allowBrowserUploads(),
    startMediaQueue(),
  ]);
  for (const step of steps) {
    if (step.status === "rejected") {
      console.error("Could not prepare photo uploads", step.reason);
    }
  }
}
