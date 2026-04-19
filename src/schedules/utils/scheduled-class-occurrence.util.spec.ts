import { RecurrenceFrequency } from '../../common/enums/recurrence-frequency.enum';
import {
  findNextOccurrence,
  resolveOccurrenceForDate,
} from './scheduled-class-occurrence.util';

describe('scheduled-class-occurrence util', () => {
  const recurringClass = {
    startsAt: new Date('2026-08-03T16:00:00.000Z'),
    endsAt: new Date('2026-08-03T17:20:00.000Z'),
    timezone: 'America/Bogota',
    recurrenceRule: {
      frequency: RecurrenceFrequency.WEEKLY,
      interval: 1,
      byDay: ['MO', 'WE'],
      untilDate: new Date('2026-08-31T23:59:59.000Z'),
      timezone: 'America/Bogota',
    },
  };

  it('finds the next occurrence using the recurrence rule instead of the original DTSTART', () => {
    const nextOccurrence = findNextOccurrence(
      recurringClass,
      new Date('2026-08-10T14:00:00.000Z'),
    );

    expect(nextOccurrence).not.toBeNull();
    expect(nextOccurrence?.startsAt.toISOString()).toBe(
      '2026-08-10T16:00:00.000Z',
    );
    expect(nextOccurrence?.endsAt.toISOString()).toBe(
      '2026-08-10T17:20:00.000Z',
    );
    expect(nextOccurrence?.isRecurring).toBe(true);
  });

  it('resolves today occurrence when the class repeats on the current weekday', () => {
    const todayOccurrence = resolveOccurrenceForDate(
      recurringClass,
      new Date('2026-08-12T12:00:00.000Z'),
    );

    expect(todayOccurrence).not.toBeNull();
    expect(todayOccurrence?.startsAt.toISOString()).toBe(
      '2026-08-12T16:00:00.000Z',
    );
    expect(todayOccurrence?.endsAt.toISOString()).toBe(
      '2026-08-12T17:20:00.000Z',
    );
  });
});
