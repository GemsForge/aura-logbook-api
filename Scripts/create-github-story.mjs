import { execFileSync } from "node:child_process";

const usage = `Usage: node Scripts/create-github-story.mjs --title "..." [options]

Options:
  --body TEXT              Markdown issue body
  --labels a,b             Additional labels
  --assignees a,b          GitHub usernames to assign
  --milestone NUMBER       Milestone number
  --parent-issue NUMBER    Native parent/sub-issue relationship
  --blocked-by a,b         Native prerequisite issue numbers
  --blocking a,b           Native dependent issue numbers
  --repo OWNER/REPOSITORY  Repository (defaults to GITHUB_REPOSITORY)
`;

const valueAfter = (args, index, option) => {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${option} requires a value.`);
  return value;
};
const parseList = (value) => value ? [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))] : [];
const typeLabels = new Map([["feat","feature"],["fix","fix"],["refactor","refactor"],["test","testing"],["docs","documentation"],["chore","chore"]]);
const scopeLabels = new Set(["api","ci","database","infrastructure","model","schema","security","service","swift","testing","ui","vapor"]);
export function inferLabels(title, explicitLabels = []) {
  const match = /^(feat|fix|refactor|test|docs|chore)\(([a-z0-9-]+)\):\s+/.exec(title);
  if (!match) throw new Error("Title must use type(scope): short imperative description.");
  if (!scopeLabels.has(match[2])) throw new Error(`Unknown story scope '${match[2]}'. Use an existing scope label.`);
  return [...new Set([typeLabels.get(match[1]), match[2], ...explicitLabels])];
}
const parseArgs = (args) => {
  const options = { labels: [], assignees: [], blockedBy: [], blocking: [] };
  for (let index = 0; index < args.length; index += 1) {
    const option = args[index];
    if (option === "--help") return { help: true };
    const valueOptions = new Set(["--title","--body","--labels","--assignees","--milestone","--parent-issue","--blocked-by","--blocking","--repo"]);
    if (!valueOptions.has(option)) throw new Error(`Unknown option: ${option}`);
    const value = valueAfter(args, index, option); index += 1;
    if (option === "--title") options.title = value;
    else if (option === "--body") options.body = value;
    else if (option === "--labels") options.labels = parseList(value);
    else if (option === "--assignees") options.assignees = parseList(value);
    else if (option === "--milestone" || option === "--parent-issue") options[option === "--milestone" ? "milestone" : "parentIssue"] = value;
    else if (option === "--blocked-by") options.blockedBy = parseList(value);
    else if (option === "--blocking") options.blocking = parseList(value);
    else options.repo = value;
  }
  if (!options.title) throw new Error("--title is required.");
  options.repo ||= process.env.GITHUB_REPOSITORY;
  if (!options.repo || !/^[^/]+\/[^/]+$/.test(options.repo)) throw new Error("Set GITHUB_REPOSITORY or supply --repo OWNER/REPOSITORY.");
  return options;
};
const runGh = (args) => JSON.parse(execFileSync("gh", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
export function createStory(options, run = runGh) {
  const labels = inferLabels(options.title, options.labels);
  const issueArgs = ["api", `repos/${options.repo}/issues`, "--method", "POST", "-f", `title=${options.title}`];
  if (options.body) issueArgs.push("-f", `body=${options.body}`);
  for (const label of labels) issueArgs.push("-f", `labels[]=${label}`);
  for (const assignee of options.assignees) issueArgs.push("-f", `assignees[]=${assignee}`);
  if (options.milestone) issueArgs.push("-f", `milestone=${options.milestone}`);
  const issue = run(issueArgs);
  const metadataWorkflow = options.metadataWorkflow || process.env.GITHUB_METADATA_WORKFLOW || "sync-issue-metadata.yml";
  const workflowArgs = ["workflow", "run", metadataWorkflow, "--repo", options.repo, "--ref", "master", "-f", `issue_number=${issue.number}`];
  if (options.parentIssue) workflowArgs.push("-f", `parent_issue=${options.parentIssue}`);
  if (options.blockedBy.length) workflowArgs.push("-f", `blocked_by=${options.blockedBy.join(",")}`);
  if (options.blocking.length) workflowArgs.push("-f", `blocking=${options.blocking.join(",")}`);
  run(workflowArgs);
  return { issueNumber: issue.number, issueURL: issue.html_url, workflow: metadataWorkflow };
}
if (process.argv[1]?.endsWith("create-github-story.mjs")) {
  try { const options = parseArgs(process.argv.slice(2)); if (options.help) console.log(usage); else console.log(JSON.stringify(createStory(options), null, 2)); }
  catch (error) { console.error(`${error.message}\n\n${usage}`); process.exitCode = 1; }
}

