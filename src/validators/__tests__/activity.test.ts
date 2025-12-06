import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import {
  listActivitiesQuerySchema,
  generateActivitiesBodySchema,
  ACTIVITY_SORTABLE_FIELDS,
  ACTIVITY_SORT_DIRECTIONS,
} from '../activity';

describe('activity validators', () => {
  describe('listActivitiesQuerySchema', () => {
    describe('date filtering', () => {
      it('accepts valid ISO 8601 dates with timezone', () => {
        const result = listActivitiesQuerySchema.parse({
          from: '2025-01-01T00:00:00+01:00',
          to: '2025-12-31T23:59:59+01:00',
        });

        expect(result.from).toBe('2025-01-01T00:00:00+01:00');
        expect(result.to).toBe('2025-12-31T23:59:59+01:00');
      });

      it('accepts dates with UTC timezone (Z)', () => {
        const result = listActivitiesQuerySchema.parse({
          from: '2025-01-01T00:00:00Z',
        });

        expect(result.from).toBe('2025-01-01T00:00:00Z');
      });

      it('rejects dates without timezone offset', () => {
        expect(() =>
          listActivitiesQuerySchema.parse({
            from: '2025-01-01T00:00:00',
          })
        ).toThrow('Value must be a valid ISO 8601 date with timezone');
      });

      it('rejects invalid date format', () => {
        expect(() =>
          listActivitiesQuerySchema.parse({
            from: '2025-01-01',
          })
        ).toThrow();
      });

      it('validates that "from" is earlier than "to"', () => {
        expect(() =>
          listActivitiesQuerySchema.parse({
            from: '2025-12-31T23:59:59Z',
            to: '2025-01-01T00:00:00Z',
          })
        ).toThrowError(ZodError);
      });

      it('allows "from" and "to" to be the same', () => {
        const result = listActivitiesQuerySchema.parse({
          from: '2025-06-15T12:00:00Z',
          to: '2025-06-15T12:00:00Z',
        });

        expect(result.from).toBe('2025-06-15T12:00:00Z');
        expect(result.to).toBe('2025-06-15T12:00:00Z');
      });

      it('allows only "from" without "to"', () => {
        const result = listActivitiesQuerySchema.parse({
          from: '2025-01-01T00:00:00Z',
        });

        expect(result.from).toBe('2025-01-01T00:00:00Z');
        expect(result.to).toBeUndefined();
      });

      it('allows only "to" without "from"', () => {
        const result = listActivitiesQuerySchema.parse({
          to: '2025-12-31T23:59:59Z',
        });

        expect(result.to).toBe('2025-12-31T23:59:59Z');
        expect(result.from).toBeUndefined();
      });
    });

    describe('sport_type and type filtering', () => {
      it('accepts valid sport_type string', () => {
        const result = listActivitiesQuerySchema.parse({
          sport_type: 'Running',
        });

        expect(result.sport_type).toBe('Running');
      });

      it('trims whitespace from sport_type', () => {
        const result = listActivitiesQuerySchema.parse({
          sport_type: '  Cycling  ',
        });

        expect(result.sport_type).toBe('Cycling');
      });

      it('rejects empty sport_type after trimming', () => {
        expect(() =>
          listActivitiesQuerySchema.parse({
            sport_type: '   ',
          })
        ).toThrow('sport_type must contain at least 1 character');
      });

      it('rejects sport_type exceeding 64 characters', () => {
        const longString = 'a'.repeat(65);
        expect(() =>
          listActivitiesQuerySchema.parse({
            sport_type: longString,
          })
        ).toThrow('sport_type must not exceed 64 characters');
      });

      it('accepts valid type string', () => {
        const result = listActivitiesQuerySchema.parse({
          type: 'Workout',
        });

        expect(result.type).toBe('Workout');
      });

      it('rejects type exceeding 64 characters', () => {
        const longString = 'b'.repeat(65);
        expect(() =>
          listActivitiesQuerySchema.parse({
            type: longString,
          })
        ).toThrow('type must not exceed 64 characters');
      });
    });

    describe('pagination', () => {
      it('applies default page value of 1', () => {
        const result = listActivitiesQuerySchema.parse({});

        expect(result.page).toBe(1);
      });

      it('applies default limit value of 20', () => {
        const result = listActivitiesQuerySchema.parse({});

        expect(result.limit).toBe(20);
      });

      it('coerces string page to number', () => {
        const result = listActivitiesQuerySchema.parse({
          page: '5',
        });

        expect(result.page).toBe(5);
      });

      it('coerces string limit to number', () => {
        const result = listActivitiesQuerySchema.parse({
          limit: '50',
        });

        expect(result.limit).toBe(50);
      });

      it('rejects page less than 1', () => {
        expect(() =>
          listActivitiesQuerySchema.parse({
            page: 0,
          })
        ).toThrow();
      });

      it('rejects negative page', () => {
        expect(() =>
          listActivitiesQuerySchema.parse({
            page: -1,
          })
        ).toThrow();
      });

      it('rejects limit less than 1', () => {
        expect(() =>
          listActivitiesQuerySchema.parse({
            limit: 0,
          })
        ).toThrow();
      });

      it('rejects limit greater than 100', () => {
        expect(() =>
          listActivitiesQuerySchema.parse({
            limit: 101,
          })
        ).toThrow();
      });

      it('accepts limit of exactly 100', () => {
        const result = listActivitiesQuerySchema.parse({
          limit: 100,
        });

        expect(result.limit).toBe(100);
      });

      it('rejects non-integer page', () => {
        expect(() =>
          listActivitiesQuerySchema.parse({
            page: 1.5,
          })
        ).toThrow();
      });
    });

    describe('sorting', () => {
      it('applies default sort_by value of "start_date"', () => {
        const result = listActivitiesQuerySchema.parse({});

        expect(result.sort_by).toBe('start_date');
      });

      it('applies default sort_dir value of "desc"', () => {
        const result = listActivitiesQuerySchema.parse({});

        expect(result.sort_dir).toBe('desc');
      });

      it('accepts all valid sortable fields', () => {
        ACTIVITY_SORTABLE_FIELDS.forEach((field) => {
          const result = listActivitiesQuerySchema.parse({
            sort_by: field,
          });

          expect(result.sort_by).toBe(field);
        });
      });

      it('accepts all valid sort directions', () => {
        ACTIVITY_SORT_DIRECTIONS.forEach((dir) => {
          const result = listActivitiesQuerySchema.parse({
            sort_dir: dir,
          });

          expect(result.sort_dir).toBe(dir);
        });
      });

      it('rejects invalid sort_by field', () => {
        expect(() =>
          listActivitiesQuerySchema.parse({
            sort_by: 'invalid_field',
          })
        ).toThrow();
      });

      it('rejects invalid sort_dir value', () => {
        expect(() =>
          listActivitiesQuerySchema.parse({
            sort_dir: 'invalid_direction',
          })
        ).toThrow();
      });
    });

    describe('complete query validation', () => {
      it('accepts valid complete query', () => {
        const result = listActivitiesQuerySchema.parse({
          from: '2025-01-01T00:00:00Z',
          to: '2025-12-31T23:59:59Z',
          sport_type: 'Running',
          type: 'Race',
          page: 2,
          limit: 50,
          sort_by: 'distance',
          sort_dir: 'asc',
        });

        expect(result).toEqual({
          from: '2025-01-01T00:00:00Z',
          to: '2025-12-31T23:59:59Z',
          sport_type: 'Running',
          type: 'Race',
          page: 2,
          limit: 50,
          sort_by: 'distance',
          sort_dir: 'asc',
        });
      });

      it('accepts empty query with all defaults', () => {
        const result = listActivitiesQuerySchema.parse({});

        expect(result).toEqual({
          page: 1,
          limit: 20,
          sort_by: 'start_date',
          sort_dir: 'desc',
        });
      });
    });
  });

  describe('generateActivitiesBodySchema', () => {
    describe('primary_sports validation', () => {
      it('accepts valid array of sport types', () => {
        const result = generateActivitiesBodySchema.parse({
          primary_sports: ['Running', 'Cycling', 'Swimming'],
        });

        expect(result.primary_sports).toEqual(['Running', 'Cycling', 'Swimming']);
      });

      it('accepts single sport in array', () => {
        const result = generateActivitiesBodySchema.parse({
          primary_sports: ['Running'],
        });

        expect(result.primary_sports).toEqual(['Running']);
      });

      it('trims whitespace from each sport', () => {
        const result = generateActivitiesBodySchema.parse({
          primary_sports: ['  Running  ', '  Cycling  '],
        });

        expect(result.primary_sports).toEqual(['Running', 'Cycling']);
      });

      it('rejects empty array', () => {
        expect(() =>
          generateActivitiesBodySchema.parse({
            primary_sports: [],
          })
        ).toThrow('Provide at least one primary sport');
      });

      it('rejects array with more than 25 sports', () => {
        const manySports = Array.from({ length: 26 }, (_, i) => `Sport${i}`);
        expect(() =>
          generateActivitiesBodySchema.parse({
            primary_sports: manySports,
          })
        ).toThrow('Provide at most 25 primary sports');
      });

      it('accepts exactly 25 sports', () => {
        const exactlySports = Array.from({ length: 25 }, (_, i) => `Sport${i}`);
        const result = generateActivitiesBodySchema.parse({
          primary_sports: exactlySports,
        });

        expect(result.primary_sports).toHaveLength(25);
      });

      it('rejects sport with empty string after trimming', () => {
        expect(() =>
          generateActivitiesBodySchema.parse({
            primary_sports: ['Running', '   ', 'Cycling'],
          })
        ).toThrow('Each sport_type must contain at least 1 character');
      });

      it('rejects sport exceeding 64 characters', () => {
        const longSport = 'a'.repeat(65);
        expect(() =>
          generateActivitiesBodySchema.parse({
            primary_sports: ['Running', longSport],
          })
        ).toThrow('Each sport_type must not exceed 64 characters');
      });

      it('allows primary_sports to be undefined', () => {
        const result = generateActivitiesBodySchema.parse({});

        expect(result.primary_sports).toBeUndefined();
      });
    });

    describe('distribution validation', () => {
      it('accepts valid distribution summing to 1.0', () => {
        const result = generateActivitiesBodySchema.parse({
          distribution: {
            primary: 0.5,
            secondary: 0.3,
            tertiary: 0.15,
            quaternary: 0.05,
          },
        });

        expect(result.distribution).toEqual({
          primary: 0.5,
          secondary: 0.3,
          tertiary: 0.15,
          quaternary: 0.05,
        });
      });

      it('accepts distribution with floating point tolerance (0.01)', () => {
        const result = generateActivitiesBodySchema.parse({
          distribution: {
            primary: 0.33,
            secondary: 0.33,
            tertiary: 0.33,
            quaternary: 0.01,
          },
        });

        expect(result.distribution).toBeDefined();
      });

      it('rejects distribution not summing to 1.0', () => {
        expect(() =>
          generateActivitiesBodySchema.parse({
            distribution: {
              primary: 0.5,
              secondary: 0.3,
              tertiary: 0.1,
              quaternary: 0.05, // sum = 0.95
            },
          })
        ).toThrow('Distribution values must add up to 1.0');
      });

      it('rejects distribution with negative values', () => {
        expect(() =>
          generateActivitiesBodySchema.parse({
            distribution: {
              primary: 0.5,
              secondary: -0.1,
              tertiary: 0.4,
              quaternary: 0.2,
            },
          })
        ).toThrow();
      });

      it('rejects distribution with values greater than 1', () => {
        expect(() =>
          generateActivitiesBodySchema.parse({
            distribution: {
              primary: 1.5,
              secondary: 0.0,
              tertiary: 0.0,
              quaternary: 0.0,
            },
          })
        ).toThrow();
      });

      it('accepts distribution with zero values if sum is 1.0', () => {
        const result = generateActivitiesBodySchema.parse({
          distribution: {
            primary: 1.0,
            secondary: 0.0,
            tertiary: 0.0,
            quaternary: 0.0,
          },
        });

        expect(result.distribution?.primary).toBe(1.0);
      });

      it('allows distribution to be undefined', () => {
        const result = generateActivitiesBodySchema.parse({});

        expect(result.distribution).toBeUndefined();
      });
    });

    describe('timezone validation', () => {
      it('accepts valid IANA timezone', () => {
        const result = generateActivitiesBodySchema.parse({
          timezone: 'Europe/Warsaw',
        });

        expect(result.timezone).toBe('Europe/Warsaw');
      });

      it('accepts various valid IANA timezones', () => {
        const validTimezones = [
          'America/New_York',
          'Asia/Tokyo',
          'Australia/Sydney',
          'UTC',
          'Europe/London',
        ];

        validTimezones.forEach((tz) => {
          const result = generateActivitiesBodySchema.parse({
            timezone: tz,
          });

          expect(result.timezone).toBe(tz);
        });
      });

      it('trims whitespace from timezone', () => {
        const result = generateActivitiesBodySchema.parse({
          timezone: '  Europe/Warsaw  ',
        });

        expect(result.timezone).toBe('Europe/Warsaw');
      });

      it('rejects invalid IANA timezone', () => {
        expect(() =>
          generateActivitiesBodySchema.parse({
            timezone: 'Invalid/Timezone',
          })
        ).toThrow('timezone must be a valid IANA identifier');
      });

      it('rejects empty timezone after trimming', () => {
        expect(() =>
          generateActivitiesBodySchema.parse({
            timezone: '   ',
          })
        ).toThrow('timezone is required');
      });

      it('rejects timezone exceeding 64 characters', () => {
        const longTimezone = 'a'.repeat(65);
        expect(() =>
          generateActivitiesBodySchema.parse({
            timezone: longTimezone,
          })
        ).toThrow('timezone must not exceed 64 characters');
      });

      it('allows timezone to be undefined', () => {
        const result = generateActivitiesBodySchema.parse({});

        expect(result.timezone).toBeUndefined();
      });
    });

    describe('complete payload validation', () => {
      it('accepts valid complete payload', () => {
        const year = new Date().getFullYear() - 1;
        const result = generateActivitiesBodySchema.parse({
          primary_sports: ['Running', 'Cycling'],
          distribution: {
            primary: 0.6,
            secondary: 0.25,
            tertiary: 0.1,
            quaternary: 0.05,
          },
          timezone: 'Europe/Warsaw',
          year,
        });

        expect(result).toEqual({
          primary_sports: ['Running', 'Cycling'],
          distribution: {
            primary: 0.6,
            secondary: 0.25,
            tertiary: 0.1,
            quaternary: 0.05,
          },
          timezone: 'Europe/Warsaw',
          year,
        });
      });

      it('accepts empty payload (all fields optional)', () => {
        const result = generateActivitiesBodySchema.parse({});

        expect(result).toEqual({});
      });

      it('accepts partial payload with only primary_sports', () => {
        const result = generateActivitiesBodySchema.parse({
          primary_sports: ['Running'],
        });

        expect(result.primary_sports).toEqual(['Running']);
        expect(result.distribution).toBeUndefined();
        expect(result.timezone).toBeUndefined();
      });
    });

    describe('year validation', () => {
      const currentYear = new Date().getFullYear();

      it('accepts the current year', () => {
        const result = generateActivitiesBodySchema.parse({ year: currentYear });
        expect(result.year).toBe(currentYear);
      });

      it('accepts a future year', () => {
        const futureYear = currentYear + 1;
        const result = generateActivitiesBodySchema.parse({ year: futureYear });
        expect(result.year).toBe(futureYear);
      });

      it('rejects non-numeric year', () => {
        expect(() =>
          generateActivitiesBodySchema.parse({
            // @ts-expect-error intentional invalid type for test
            year: '2022',
          })
        ).toThrow('year must be a number');
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('provides detailed error messages for multiple validation failures', () => {
      expect(() =>
        listActivitiesQuerySchema.parse({
          from: 'invalid-date',
          page: -1,
          limit: 200,
          sort_by: 'invalid',
        })
      ).toThrowError(ZodError);
    });

    it('handles very large numbers for pagination gracefully', () => {
      expect(() =>
        listActivitiesQuerySchema.parse({
          page: Number.MAX_SAFE_INTEGER,
          limit: 1,
        })
      ).not.toThrow();
    });

    it('handles special characters in sport_type', () => {
      const result = listActivitiesQuerySchema.parse({
        sport_type: 'Trail-Running & Mountain/Hiking',
      });

      expect(result.sport_type).toBe('Trail-Running & Mountain/Hiking');
    });

    it('handles unicode characters in sport names', () => {
      const result = generateActivitiesBodySchema.parse({
        primary_sports: ['Bieganie 🏃', 'Pływanie 🏊'],
      });

      expect(result.primary_sports).toEqual(['Bieganie 🏃', 'Pływanie 🏊']);
    });
  });
});
