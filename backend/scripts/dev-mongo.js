/**
 * Runs a real, persistent local MongoDB instance for development without
 * requiring a full MongoDB Community Server install (no Windows service,
 * no admin/UAC, no MSI). Uses mongodb-memory-server's binary manager,
 * which downloads a standalone mongod for your platform (cached after
 * the first run) — despite the package name, data here is written to
 * disk (see dbPath below), not memory-only, and survives restarts.
 *
 * This is purely a contributor convenience for local dev/demo use. For
 * anything beyond that, install real MongoDB Community Server or point
 * MONGO_URI (backend/.env) at a managed instance instead.
 *
 * Usage: npm run dev:mongo
 */
const fs = require("fs");
const path = require("path");
const { MongoMemoryServer } = require("mongodb-memory-server");

const PORT = Number(process.env.DEV_MONGO_PORT) || 27017;
const DATA_DIR = path.join(__dirname, "..", ".mongo-data");

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true }); // mongodb-memory-server expects this to pre-exist

  const mongod = await MongoMemoryServer.create({
    instance: {
      port: PORT,
      dbPath: DATA_DIR,
      dbName: "farmsathi",
    },
  });

  console.log(`Dev MongoDB running at ${mongod.getUri()}`);
  console.log(`Data persisted under ${DATA_DIR}`);
  console.log("Press Ctrl+C to stop.");

  const shutdown = async () => {
    console.log("\nStopping dev MongoDB...");
    await mongod.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start dev MongoDB:", err);
  process.exit(1);
});
