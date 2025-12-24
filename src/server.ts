import "dotenv/config";
import http from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { connectToDatabase } from "./config/db";
import { printRegisteredRoutes } from "./utils/routePrinter";

async function main() {
  await connectToDatabase();

  const app = createApp();
  // Log all registered endpoints on startup (handy for frontend integration).
  printRegisteredRoutes(app);
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] listening on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[server] fatal error during startup", err);
  process.exit(1);
});


