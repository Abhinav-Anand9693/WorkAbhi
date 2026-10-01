export function calculateAge(
  birthDate: string,
  targetDate: string
) {
  const birth =
    parseDate(birthDate);

  const target =
    parseDate(targetDate);

  if (target < birth) {
    throw new Error(
      "Target date cannot be before birth date."
    );
  }

  let years =
    target.getFullYear() -
    birth.getFullYear();

  let months =
    target.getMonth() -
    birth.getMonth();

  let days =
    target.getDate() -
    birth.getDate();

  if (days < 0) {
    months--;

    const previousMonth =
      new Date(
        target.getFullYear(),
        target.getMonth(),
        0
      );

    days +=
      previousMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const milliseconds =
    target.getTime() -
    birth.getTime();

  const totalDays =
    Math.floor(
      milliseconds /
        (1000 * 60 * 60 * 24)
    );

  return {
    years,
    months,
    days,
    totalDays
  };
}

export function calculateDateDifference(
  startDate: string,
  endDate: string
) {
  const start =
    parseDate(startDate);

  const end =
    parseDate(endDate);

  const milliseconds =
    end.getTime() -
    start.getTime();

  const days =
    Math.abs(
      Math.floor(
        milliseconds /
          (1000 * 60 * 60 * 24)
      )
    );

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
    !Number.isFinite(end)
  ) {
    throw new Error(
      "Please enter valid times."
    );
  }

  if (
    start < 0 ||
    end < 0 ||
    start > 24 ||
    end > 24
  ) {
    throw new Error(
      "Time must be between 0 and 24 hours."
    );
  }

  let duration =
    end - start;

  if (duration < 0) {
    duration += 24;
  }

  // Convert once to whole minutes so the displayed result can never
  // become an invalid value such as 9 hours 60 minutes.
  const totalMinutes =
    Math.round(duration * 60);

  return {
    hours: Math.floor(
      totalMinutes / 60
    ),
    minutes:
      totalMinutes % 60,
    decimalHours:
      totalMinutes / 60
  };
}

function parseDate(
  value: string
): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(
      "Please enter a valid date."
    );
  }

  const date =
    new Date(`${value}T00:00:00`);

  if (
    Number.isNaN(
      date.getTime()
    ) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error(
      "Please enter a valid date."
    );
  }

  return date;
}
