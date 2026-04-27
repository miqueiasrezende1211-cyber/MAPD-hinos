import { spawnSync } from "node:child_process";

const port = process.env.HINARIO_PORT || "8082";
const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const result = spawnSync(
  pnpmCmd,
  ["exec", "expo", "start", "--localhost", "--port", port],
  {
    stdio: "inherit",
    env: process.env,
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
