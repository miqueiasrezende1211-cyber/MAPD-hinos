import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const result = spawnSync(pnpmCmd, ["exec", "drizzle-kit", ...args], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
