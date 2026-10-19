import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const environment = String(process.env.AURA_ENV || "").trim().toUpperCase();
if (environment !== "FIT") {
  throw new Error("Refusing to reset the database: set AURA_ENV=FIT explicitly.");
}

if (process.argv[2] !== "--confirm") {
  throw new Error("Refusing to reset the staging database: pass --confirm explicitly.");
}

const databasePath = resolve(process.env.AURA_STAGING_DATABASE || "AuraLogbook.Api/Data/auralogbook-staging.db");
if (existsSync(databasePath)) {
  unlinkSync(databasePath);
  console.log(`Removed staging database: ${databasePath}`);
} else {
  console.log(`Staging database does not exist: ${databasePath}`);
}

console.log("Start the API with AURA_ENV=FIT to recreate the schema through migrations.");
