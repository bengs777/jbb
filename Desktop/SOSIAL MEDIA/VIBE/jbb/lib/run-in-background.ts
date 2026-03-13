import "server-only";

let cfPromise: Promise<typeof import("@opennextjs/cloudflare")> | null = null;

async function tryGetWaitUntil(): Promise<((p: Promise<unknown>) => void) | null> {
  try {
    cfPromise ??= import("@opennextjs/cloudflare");
    const { getCloudflareContext } = await cfPromise;
    const { ctx } = getCloudflareContext();
    return (p) => ctx.waitUntil(p);
  } catch {
    return null;
  }
}

export function runInBackground(promise: Promise<unknown>) {
  void (async () => {
    const waitUntil = await tryGetWaitUntil();
    if (waitUntil) {
      waitUntil(
        promise.catch((err) => console.error("[bg task failed]", err))
      );
    } else {
      // Local Node (`next dev`) path
      void promise.catch((err) => console.error("[bg task failed]", err));
    }
  })();
}
