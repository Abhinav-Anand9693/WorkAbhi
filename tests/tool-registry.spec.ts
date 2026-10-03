import { test, expect } from '@playwright/test';
import { tools } from '../src/config/tools';

test.describe('WorkAbhi tool registry', () => {
  test('registry contains no duplicate tool IDs', () => {
    const ids = tools.map((tool) => tool.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect(
      duplicates,
      `Duplicate tool IDs found: ${[...new Set(duplicates)].join(', ')}`
    ).toEqual([]);
  });

  test('every registered tool has required routing metadata', () => {
    for (const tool of tools) {
      expect(tool.id, `Missing id for ${tool.name}`).toBeTruthy();
      expect(tool.name, `Missing name for ${tool.id}`).toBeTruthy();
      expect(tool.type, `Missing type for ${tool.id}`).toBeTruthy();
      expect(tool.category, `Missing category for ${tool.id}`).toBeTruthy();
      expect(tool.available, `Tool marked unavailable: ${tool.id}`).toBeTruthy();
    }
  });
});
