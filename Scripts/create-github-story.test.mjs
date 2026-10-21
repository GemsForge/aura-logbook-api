import assert from "node:assert/strict";
import { test } from "node:test";
import { inferLabels } from "./create-github-story.mjs";

test("infers type and scope labels", () => {
  assert.deepEqual(inferLabels("feat(api): add endpoint", ["enhancement"]), ["feature", "api", "enhancement"]);
  assert.deepEqual(inferLabels("fix(database): repair migration"), ["fix", "database"]);
});
test("rejects malformed titles and unknown scopes", () => {
  assert.throws(() => inferLabels("feature(api): invalid"), /type\(scope\)/);
  assert.throws(() => inferLabels("feat(unknown): invalid"), /Unknown story scope/);
});

