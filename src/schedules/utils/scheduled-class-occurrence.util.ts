import { RecurrenceFrequency } from '../../common/enums/recurrence-frequency.enum';

export interface RecurrenceRuleLike {
  frequency: RecurrenceFrequency;
  interval?: number | null;
  byDay?: string[] | null;
  untilDate?: Date | null;
  timezone?: string | null;
}

export interface ScheduledClassOccurrenceLike {
  startsAt: Date;
  endsAt: Date;
  timezone?: string | null;
  recurrenceRule?: RecurrenceRuleLike | null;
}

export interface ScheduledClassOccurrence {
  startsAt: Date;
  endsAt: Date;
  isRecurring: boolean;
}

interface LocalDateParts {
  year: number;
  month: number;
  day: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_INDEX: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

export function findNextOccurrence(
  scheduledClass: ScheduledClassOccurrenceLike,
  referenceDate = new Date(),
): ScheduledClassOccurrence | null {
  const timezone = resolveTimezone(scheduledClass);
  const startLocalDate = getLocalDateParts(scheduledClass.startsAt, timezone);
  const referenceLocalDate = getLocalDateParts(referenceDate, timezone);
  const finalDate = resolveFinalDate(scheduledClass, timezone);
  let currentLocalDate =
    compareLocalDates(referenceLocalDate, startLocalDate) > 0
      ? referenceLocalDate
      : startLocalDate;

  while (compareLocalDates(currentLocalDate, finalDate) <= 0) {
    const occurrence = resolveOccurrenceOnDate(
      scheduledClass,
      currentLocalDate,
      timezone,
    );

    if (occurrence && occurrence.endsAt >= referenceDate) {
      return occurrence;
    }

    currentLocalDate = addDays(currentLocalDate, 1);
  }

  return null;
}

export function resolveOccurrenceForDate(
  scheduledClass: ScheduledClassOccurrenceLike,
  referenceDate: Date,
): ScheduledClassOccurrence | null {
  const timezone = resolveTimezone(scheduledClass);
  const referenceLocalDate = getLocalDateParts(referenceDate, timezone);

  return resolveOccurrenceOnDate(scheduledClass, referenceLocalDate, timezone);
}

function resolveOccurrenceOnDate(
  scheduledClass: ScheduledClassOccurrenceLike,
  targetLocalDate: LocalDateParts,
  timezone: string,
) {
  const startLocalDate = getLocalDateParts(scheduledClass.startsAt, timezone);

  if (compareLocalDates(targetLocalDate, startLocalDate) < 0) {
    return null;
  }

  if (!occursOnDate(scheduledClass, targetLocalDate, timezone, startLocalDate)) {
    return null;
  }

  const startTimeParts = getLocalTimeParts(scheduledClass.startsAt, timezone);
  const occurrenceStartsAt = zonedDateTimeToUtc(
    targetLocalDate.year,
    targetLocalDate.month,
    targetLocalDate.day,
    startTimeParts.hour,
    startTimeParts.minute,
    startTimeParts.second,
    timezone,
  );
  const durationMs =
    scheduledClass.endsAt.getTime() - scheduledClass.startsAt.getTime();
  const occurrenceEndsAt = new Date(occurrenceStartsAt.getTime() + durationMs);
  const recurrenceUntilDate = scheduledClass.recurrenceRule?.untilDate ?? null;

  if (recurrenceUntilDate && occurrenceStartsAt > recurrenceUntilDate) {
    return null;
  }

  return {
    startsAt: occurrenceStartsAt,
    endsAt: occurrenceEndsAt,
    isRecurring: Boolean(scheduledClass.recurrenceRule),
  };
}

function occursOnDate(
  scheduledClass: ScheduledClassOccurrenceLike,
  targetLocalDate: LocalDateParts,
  timezone: string,
  startLocalDate: LocalDateParts,
) {
  const recurrenceRule = scheduledClass.recurrenceRule;

  if (!recurrenceRule) {
    return compareLocalDates(targetLocalDate, startLocalDate) === 0;
  }

  const interval = recurrenceRule.interval && recurrenceRule.interval > 0
    ? recurrenceRule.interval
    : 1;
  const diffDays = daysBetween(startLocalDate, targetLocalDate);

  switch (recurrenceRule.frequency) {
    case RecurrenceFrequency.DAILY:
      return diffDays % interval === 0;
    case RecurrenceFrequency.WEEKLY: {
      const recurrenceDays =
        recurrenceRule.byDay?.length
          ? recurrenceRule.byDay
              .map((day) => WEEKDAY_INDEX[day.toUpperCase()])
              .filter((value): value is number => value !== undefined)
          : [getWeekdayIndex(scheduledClass.startsAt, timezone)];

      return (
        Math.floor(diffDays / 7) % interval === 0 &&
        recurrenceDays.includes(getWeekdayIndex(targetLocalDate))
      );
    }
    case RecurrenceFrequency.MONTHLY: {
      const monthDiff =
        (targetLocalDate.year - startLocalDate.year) * 12 +
        (targetLocalDate.month - startLocalDate.month);

      return (
        targetLocalDate.day === startLocalDate.day &&
        monthDiff >= 0 &&
        monthDiff % interval === 0
      );
    }
    default:
      return false;
  }
}

function resolveFinalDate(
  scheduledClass: ScheduledClassOccurrenceLike,
  timezone: string,
) {
  const untilDate = scheduledClass.recurrenceRule?.untilDate;

  if (untilDate) {
    return getLocalDateParts(untilDate, timezone);
  }

  return getLocalDateParts(scheduledClass.endsAt, timezone);
}

function resolveTimezone(scheduledClass: ScheduledClassOccurrenceLike) {
  return (
    scheduledClass.recurrenceRule?.timezone ||
    scheduledClass.timezone ||
    'America/Bogota'
  );
}

function getLocalDateParts(date: Date, timezone: string): LocalDateParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date).reduce<Record<string, string>>(
    (accumulator, part) => {
      if (part.type !== 'literal') {
        accumulator[part.type] = part.value;
      }

      return accumulator;
    },
    {},
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

function getLocalTimeParts(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = formatter.formatToParts(date).reduce<Record<string, string>>(
    (accumulator, part) => {
      if (part.type !== 'literal') {
        accumulator[part.type] = part.value;
      }

      return accumulator;
    },
    {},
  );

  return {
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function getWeekdayIndex(date: Date | LocalDateParts, timezone?: string) {
  if ('year' in date) {
    return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
  }

  const localDate = getLocalDateParts(date, timezone || 'America/Bogota');
  return getWeekdayIndex(localDate);
}

function compareLocalDates(leftDate: LocalDateParts, rightDate: LocalDateParts) {
  return (
    Date.UTC(leftDate.year, leftDate.month - 1, leftDate.day) -
    Date.UTC(rightDate.year, rightDate.month - 1, rightDate.day)
  );
}

function addDays(localDate: LocalDateParts, daysToAdd: number): LocalDateParts {
  const nextDate = new Date(
    Date.UTC(localDate.year, localDate.month - 1, localDate.day + daysToAdd),
  );

  return {
    year: nextDate.getUTCFullYear(),
    month: nextDate.getUTCMonth() + 1,
    day: nextDate.getUTCDate(),
  };
}

function daysBetween(startDate: LocalDateParts, endDate: LocalDateParts) {
  return Math.floor(compareLocalDates(endDate, startDate) / DAY_MS);
}

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timezone: string,
) {
  const utcGuess = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second),
  );
  const offsetMilliseconds = getTimezoneOffsetMilliseconds(utcGuess, timezone);

  return new Date(utcGuess.getTime() - offsetMilliseconds);
}

function getTimezoneOffsetMilliseconds(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = formatter.formatToParts(date).reduce<Record<string, string>>(
    (accumulator, part) => {
      if (part.type !== 'literal') {
        accumulator[part.type] = part.value;
      }

      return accumulator;
    },
    {},
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - date.getTime();
}
