import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const policy = JSON.parse(readFileSync(join(here, "commit-policy.json"), "utf8"));
const oid = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const zero = value => /^0+$/.test(value);
const git = args => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

export function validateSubject(subject, rules = policy) {
  const match = /^([a-z]+)\\(([a-z][a-z0-9-]*)\\): #([1-9]\\d*) (.+)$/.exec(subject);
  if (!match) return [`Expected ${rules.format}; use lowercase type/scope and a positive issue number.`];
  const errors = [];
  if (!rules.types.includes(match[1])) errors.push(`Unapproved type '${match[1]}'. Allowed: ${rules.types.join(", ")}.`);
  const description = match[4];
  if (description.trim() !== description || !/^[a-z][a-z0-9-]*(?:\\s+\\S.*)?$/.test(description) || /[\\x00-\\x1f\\x7f]/.test(description)) {
    errors.push("Description must start with a lowercase word and contain no surrounding whitespace/control characters.");
  }
  return errors;
}

function commitsBetween(head, base) {
  const range = base && !zero(base) ? [head, `^${base}`] : [head];
  const output = git(["rev-list", ...range]);
  return output ? output.split("\\n") : [];
}

export function prePush(input) {
  const commits = [];
  for (const line of input.split(/\\r?\\n/).filter(Boolean)) {
    const fields = line.trim().split(/\\s+/);
    if (fields.length !== 4) throw new Error("Invalid pre-push ref input.");
    const [, local, , remote] = fields;
    if (!oid.test(local) || !oid.test(remote)) throw new Error("Invalid pre-push SHA.");
    if (zero(local)) continue;
    const head = git(["rev-parse", "--verify", `${local}^{commit}`]);
    const base = zero(remote) ? "" : git(["rev-parse", "--verify", `${remote}^{commit}`]);
    commits.push(...commitsBetween(head, base));
  }
  return validateCommits(commits);
}

export function validateCommits(commits) {
  let failures = 0;
  for (const commit of [...new Set(commits)]) {
    const subject = git(["show", "-s", "--format=%s", commit]);
    if (/^Merge (?:branch|pull request)/.test(subject)) continue;
    const errors = validateSubject(subject);
    if (errors.length) {
      failures += 1;
      console.error(`Commit ${commit.slice(0, 12)}: ${subject}`);
      errors.forEach(error => console.error(`  - ${error}`));
    }
  }
  if (failures) {
    console.error(`Commit policy failed for ${failures} commit(s). Example: ${policy.example}`);
    return false;
  }
  return true;
}

if (process.argv[1]?.endsWith("commit-policy.mjs")) {
  const [mode] = process.argv.slice(2);
  if (mode === "pre-push") process.exitCode = prePush(readFileSync(0, "utf8")) ? 0 : 1;
}
