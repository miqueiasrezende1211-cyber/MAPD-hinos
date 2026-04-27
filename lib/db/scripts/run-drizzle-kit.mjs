import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const drizzleKitBin = require.resolve("drizzle-kit/bin.cjs");
const args = process.argv.slice(2);

const result = spawnSync(process.execPath, [drizzleKitBin, ...args], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
