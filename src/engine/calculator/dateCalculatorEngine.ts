function parseDateOnly(
  value: string
): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match)
    throw new Error("Please enter a valid date.");

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const check = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  )
    throw new Error("Please enter a valid date.");

  return { year, month, day };
}

function daySerial(
  value: {
    year: number;
    month: number;
    day: number;
  }
): number {
  return (
    Date.UTC(
      value.year,
      value.month - 1,
      value.day
    ) / 86400000
  );
}

export function calculateAge(
  birthDate: string,
  targetDate: string
) {
  const birth = parseDateOnly(birthDate);
  const target = parseDateOnly(targetDate);

  if (daySerial(target) < daySerial(birth))
    throw new Error(
      "Target date cannot be before birth date."
    );

  let years = target.year - birth.year;

  let anniversaryMonth = birth.month;
  let anniversaryDay = birth.day;

  if (
    birth.month === 2 &&
    birth.day === 29 &&
    !isLeap(target.year)
  )
    anniversaryDay = 28;

  if (
    target.month < anniversaryMonth ||
    (target.month === anniversaryMonth &&
      target.day < anniversaryDay)
  )
    years -= 1;

  const anchorYear = birth.year + years;

  const anchorDay =
    birth.month === 2 &&
    birth.day === 29 &&
    !isLeap(anchorYear)
      ? 28
      : birth.day;

  const anchor = {
    year: anchorYear,
    month: birth.month,
    day: anchorDay
  };

  let months =
    (target.year - anchor.year) * 12 +
    target.month -
    anchor.month;

  if (target.day < anchor.day)
    months -= 1;

  months = Math.max(0, months);

  const monthAnchor = addMonths(
    anchor,
    months
  );

  const days =
    daySerial(target) -
    daySerial(monthAnchor);

  return {
    years,
    months,
    days,
    totalDays: Math.floor(
      daySerial(target) - daySerial(birth)
    )
  };
}

export function calculateDateDifference(
  startDate: string,
  endDate: string
) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  const days =
    daySerial(end) -
    daySerial(start);

  return {
    days,
    weeks: days / 7,
    hours: days * 24,
    minutes: days * 24 * 60
  };
}

export function calculateTimeDuration(
  start: number,
  end: number
) {
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end < 0 ||
    start >= 24 ||
    end >= 24
  )
    throw new Error(
      "Time must be between 0:00 and 23:59."
    );

  let duration = end - start;

  if (duration < 0)
    duration += 24;

  const hours = Math.floor(duration);

  const minutes = Math.round(
    (duration - hours) * 60
  );

  if (minutes === 60)
    return {
      hours: (hours + 1) % 24,
      minutes: 0,
      decimalHours: hours + 1
    };

  return {
    hours,
    minutes,
    decimalHours: duration
  };
}

function addMonths(
  date: {
    year: number;
    month: number;
    day: number;
  },
  months: number
) {
  const d = new Date(
    Date.UTC(
      date.year,
      date.month - 1 + months,
      1
    )
  );

  const max = new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();

  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: Math.min(date.day, max)
  };
}

function isLeap(year: number) {
  return (
    year % 4 === 0 &&
    (year % 100 !== 0 ||
      year % 400 === 0)
  );
}