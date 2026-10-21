import assert from "node:assert/strict";
import { test } from "node:test";
import { inferLabels } from "./create-github-story.mjs";

test("infers type and scope labels", () => {
  assert.deepEqual(inferLabels("feat(api): add endpoint", ["enhancement"]), ["feature", "api", "enhancement"]);
  assert.deepEqual(inferLabels("fix(database): repair migration"), ["fix", "database"]);
  assert.deepEqual(inferLabels("docs(any-scope): document policy"), ["documentation", "any-scope"]);
  assert.deepEqual(inferLabels("chore(ci): update workflow"), ["chore", "ci"]);
});
test("rejects malformed titles and unknown scopes", () => {
  assert.throws(() => inferLabels("feature(api): invalid"), /type\(scope\)/);
  assert.throws(() => inferLabels("feat(unknown): invalid"), /Unknown story scope/);
  assert.throws(() => inferLabels("ci(api): invalid"), /type\(scope\)/);
});

