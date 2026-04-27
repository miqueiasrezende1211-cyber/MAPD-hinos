import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const pnpmExecPath = process.env.npm_execpath;

if (!pnpmExecPath) {
  throw new Error("npm_execpath is not set. Run this script via pnpm.");
}

const result = spawnSync(process.execPath, [pnpmExecPath, "exec", "drizzle-kit", ...args], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
