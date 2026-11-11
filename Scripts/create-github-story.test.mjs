import assert from "node:assert/strict";
import { test } from "node:test";
import { createStory, inferLabels } from "./create-github-story.mjs";

test("infers type and scope labels", () => {
  assert.deepEqual(inferLabels("feat(api): add endpoint", ["enhancement"]), ["feature", "api", "enhancement"]);
  assert.deepEqual(inferLabels("fix(database): repair migration"), ["fix", "database"]);
});
test("rejects malformed titles and unknown scopes", () => {
  assert.throws(() => inferLabels("feature(api): invalid"), /type\(scope\)/);
  assert.throws(() => inferLabels("feat(unknown): invalid"), /Unknown story scope/);
});


// The metadata dispatch prints a plain-text run URL, not JSON (regression: the script used to
// JSON.parse it and report failure for an issue it had already created).
test("dispatches the metadata workflow without parsing its output as JSON", () => {
  const calls = [];
  const run = (args, options) => {
    calls.push({ args, options });
    return args[0] === "api"
      ? { number: 42, html_url: "https://github.com/o/r/issues/42" }
      : "https://github.com/o/r/actions/runs/1";
  };
  const result = createStory({ repo: "o/r", title: "feat(api): add endpoint", labels: [], assignees: [], blockedBy: ["7"], blocking: [], milestone: "3" }, run);

  assert.equal(calls.length, 2);
  assert.equal(calls[0].options, undefined);
  assert.deepEqual(calls[1].options, { json: false });
  assert.ok(calls[1].args.includes("issue_number=42"));
  assert.ok(calls[1].args.includes("blocked_by=7"));
  assert.deepEqual(result, { issueNumber: 42, issueURL: "https://github.com/o/r/issues/42", workflow: "sync-issue-metadata.yml", workflowRun: "https://github.com/o/r/actions/runs/1" });
});
test("names the created issue when the workflow dispatch fails", () => {
  const run = (args) => {
    if (args[0] === "api") return { number: 42, html_url: "https://github.com/o/r/issues/42" };
    throw new Error("dispatch refused");
  };
  assert.throws(
    () => createStory({ repo: "o/r", title: "fix(ui): repair", labels: [], assignees: [], blockedBy: [], blocking: [] }, run),
    /Created issue #42 .*dispatch refused.*Do not re-create/,
  );
});
