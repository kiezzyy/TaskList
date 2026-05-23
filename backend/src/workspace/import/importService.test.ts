import { describe, expect, it } from 'vitest';
import { analyzeWorkspaceImport } from './importService.js';

describe('workspace import analysis', () => {
  it('returns friendly validation errors for invalid files', async () => {
    const result = await analyzeWorkspaceImport({ nope: true });
    expect(result.valid).toBe(false);
    expect(result.guidance).toContain('TaskList JSON backup');
  });
});
