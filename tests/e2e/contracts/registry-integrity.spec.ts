import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { readToolInventory } from "../../utils/toolInventory";

test("tool registry is structurally usable", () => {
  const tools = readToolInventory();

  expect(tools.length).toBeGreaterThan(0);

  const ids = tools.map((tool) => tool.id);

  const duplicates = ids.filter(
    (id, index) => ids.indexOf(id) !== index
  );

  expect(
    duplicates,
    `Duplicate tool IDs: ${[...new Set(duplicates)].join(", ")}`
  ).toEqual([]);

  for (const tool of tools) {
    expect(tool.id, "Missing tool id").toBeTruthy();

    expect(
      tool.name,
      `Missing tool name for ${tool.id}`
    ).toBeTruthy();

    expect(
      tool.id,
      `Invalid tool ID: ${tool.id}`
    ).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  }
});

test("tool registry file exists", () => {
  const file = path.resolve(
    process.cwd(),
    "src/config/tools.ts"
  );

  expect(fs.existsSync(file)).toBe(true);
});