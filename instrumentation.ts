export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log("[Instrumentation] Registering background email worker...");
    try {
      const { startEmailWorker } = await import('./lib/emailWorkerLauncher');
      // startEmailWorker(); // Temporarily disabled to prevent dev server freeze
      console.log("[Instrumentation] Background email worker registered successfully.");
    } catch (err) {
      console.error("[Instrumentation] Failed to load email worker:", err);
    }
  }
}
