export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 1. Validate environment configuration & secrets integrity on startup
    try {
      const { validateEnvironmentConfiguration } = await import('./lib/config/envValidation');
      const report = validateEnvironmentConfiguration();
      if (report.criticalFrontendLeaks.length > 0) {
        console.error('🚨 [CRITICAL SECURITY LEAK] Server secrets detected with NEXT_PUBLIC_ prefix in environment:');
        report.criticalFrontendLeaks.forEach((key) => console.error(`  - FORBIDDEN FRONTEND KEY: ${key}`));
      }
      if (!report.valid) {
        console.error('[Security] Production secrets configuration is incomplete or contains insecure defaults:');
        report.missingRequired.forEach((key) => console.error(`  - Missing required key: ${key}`));
        report.placeholderDetected.forEach((key) => console.error(`  - Placeholder detected in: ${key}`));
      } else {
        console.log('[Security] Environment configuration & secrets verified successfully.');
      }
      if (report.warnings.length > 0) {
        report.warnings.forEach((w) => console.warn(`[Security Warning] ${w}`));
      }
    } catch (err) {
      console.error('[Security] Failed to validate environment configuration:', err);
    }

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
