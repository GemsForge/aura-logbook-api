import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

test("npm start launches Vite directly instead of recursively invoking npm", () => {
  assert.equal(packageJson.scripts.start, "vite");
});
