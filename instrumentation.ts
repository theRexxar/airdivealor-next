/** Runs once when the Next.js server starts: print the startup report (deployment, MySQL, Redis, storage, email). */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { printStartupReport } = await import("./lib/server/startup-report");
  // Don't hold up the server: the report prints a moment later.
  void printStartupReport("web");
}
