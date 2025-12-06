import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { progressAnnualSchema, PROGRESS_METRIC_TYPES } from '../progress';

describe('progressAnnualSchema', () => {
  it('accepts valid payload with sport_id', () => {
    const payload = {
      year: 2025,
      metric_type: PROGRESS_METRIC_TYPES[0],
      sport_id: '550e8400-e29b-41d4-a716-446655440000',
    };

    const parsed = progressAnnualSchema.parse(payload);

    expect(parsed.year).toBe(2025);
    expect(parsed.metric_type).toBe(payload.metric_type);
    expect(parsed.sport_id).toBe(payload.sport_id);
  });

  it('sets sport_id to null when omitted', () => {
    const parsed = progressAnnualSchema.parse({
      year: '2024',
      metric_type: 'time',
    });

    expect(parsed.sport_id).toBeNull();
    expect(parsed.year).toBe(2024);
  });

  it('rejects year below minimum', () => {
    expect(() =>
      progressAnnualSchema.parse({
        year: 1999,
        metric_type: 'distance',
      })
    ).toThrowError(ZodError);
  });

  it('rejects invalid metric type', () => {
    expect(() =>
      progressAnnualSchema.parse({
        year: 2025,
        metric_type: 'invalid',
      })
    ).toThrowError(ZodError);
  });

  it('rejects malformed sport_id', () => {
    expect(() =>
      progressAnnualSchema.parse({
        year: 2025,
        metric_type: 'distance',
        sport_id: 'not-a-uuid',
      })
    ).toThrowError(/sport_id must be a valid UUID/);
  });
});

