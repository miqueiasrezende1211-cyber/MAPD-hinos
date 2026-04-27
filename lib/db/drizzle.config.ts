import fs from "node:fs";
import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

const schemaDir = path.resolve(__dirname, "./src/schema");
const schemaFiles = fs
  .readdirSync(schemaDir)
  .filter((file) => file.endsWith(".ts") && !file.endsWith(".d.ts"))
  .map((file) => path.resolve(schemaDir, file).replace(/\\/g, "/"));

if (schemaFiles.length === 0) {
  throw new Error(`No .ts schema files found under ${schemaDir}`);
}

export default defineConfig({
  schema: schemaFiles,
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
