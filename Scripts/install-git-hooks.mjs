import { chmodSync, copyFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const hooks = execFileSync("git", ["rev-parse", "--git-path", "hooks"], { encoding: "utf8" }).trim();
const bundle = join(hooks, "aura-logbook-commit-policy");
mkdirSync(bundle, { recursive: true });
copyFileSync(join(root, "commit-policy.mjs"), join(bundle, "commit-policy.mjs"));
copyFileSync(join(root, "commit-policy.json"), join(bundle, "commit-policy.json"));
copyFileSync(join(root, "..", ".githooks", "pre-push"), join(hooks, "pre-push"));
chmodSync(join(hooks, "pre-push"), 0o755);
console.log(`Installed Aura Logbook commit policy in ${hooks}`);
