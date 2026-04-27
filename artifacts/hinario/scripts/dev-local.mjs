import { spawnSync } from "node:child_process";

const port = process.env.HINARIO_PORT || "8082";
const pnpmExecPath = process.env.npm_execpath;

if (!pnpmExecPath) {
  throw new Error("npm_execpath is not set. Run this script via pnpm.");
}

const result = spawnSync(
  process.execPath,
  [pnpmExecPath, "exec", "expo", "start", "--localhost", "--port", port],
  {
    stdio: "inherit",
    env: process.env,
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
