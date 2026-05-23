import { describe, expect, it } from 'vitest';
import { durationSeconds } from './timerMath.js';

describe('timer duration', () => {
  it('calculates elapsed seconds for a session', () => {
    expect(durationSeconds(new Date('2026-05-19T09:00:00.000Z'), new Date('2026-05-19T10:30:00.000Z'))).toBe(5400);
  });

  it('never returns negative duration after clock changes', () => {
    expect(durationSeconds(new Date('2026-05-19T10:00:00.000Z'), new Date('2026-05-19T09:00:00.000Z'))).toBe(0);
  });
});
