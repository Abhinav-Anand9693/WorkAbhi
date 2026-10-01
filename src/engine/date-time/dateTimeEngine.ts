const DAY = 86400000;

export function parseDateInput(v: string): Date {
  const [y, m, d] = v.split("-").map(Number);

  const x = new Date(y, m - 1, d);

  if (
    !v ||
    !Number.isInteger(y) ||
    !Number.isInteger(m) ||
    !Number.isInteger(d) ||
    x.getFullYear() != y ||
    x.getMonth() != m - 1 ||
    x.getDate() != d
  ) {
    throw new Error("Invalid date.");
  }

  x.setHours(0, 0, 0, 0);

  return x;
}

export function formatDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isLeapYear(y: number) {
  return (
    Number.isInteger(y) &&
    (y % 400 === 0 || (y % 4 === 0 && y % 100 !== 0))
  );
}

export function getISOWeekNumber(d: Date) {
  const x = new Date(d);

  x.setHours(0, 0, 0, 0);

  const day = x.getDay() || 7;

  x.setDate(x.getDate() + 4 - day);

  const y = new Date(x.getFullYear(), 0, 1);

  return Math.ceil(((x.getTime() - y.getTime()) / DAY + 1) / 7);
}

export function dateDifference(a: string, b: string) {
  const x = parseDateInput(a);
  const y = parseDateInput(b);
  const days = Math.round((y.getTime() - x.getTime()) / DAY);
  const n = Math.abs(days);

  return {
    totalDays: days,
    absoluteDays: n,
    weeks: Math.floor(n / 7),
    monthsApprox: Math.floor(n / 30),
    yearsApprox: Math.floor(n / 365),
  };
}

export function daysUntil(v: string, from?: string) {
  const a = parseDateInput(v);
  const b = from ? parseDateInput(from) : new Date();

  b.setHours(0, 0, 0, 0);

  return Math.ceil((a.getTime() - b.getTime()) / DAY);
}

export function dateToTimestamp(
  v: string,
  u: "milliseconds" | "seconds" = "milliseconds",
) {
  const n = parseDateInput(v).getTime();

  return u === "seconds" ? Math.floor(n / 1000) : n;
}

export function timestampToDate(
  v: string,
  u: "milliseconds" | "seconds" = "milliseconds",
) {
  const n = Number(v);

  if (!Number.isFinite(n)) {
    throw new Error("Invalid timestamp.");
  }

  const d = new Date(u === "seconds" ? n * 1000 : n);

  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid timestamp.");
  }

  return d.toString();
}

function rand(max: number) {
  const a = new Uint32Array(1);
  const lim = 0x100000000 - (0x100000000 % max);

  do crypto.getRandomValues(a);
  while (a[0] >= lim);

  return a[0] % max;
}

export function randomNumber(
  min: number,
  max: number,
  dec = 0,
) {
  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    min > max
  ) {
    throw new Error("Invalid range.");
  }

  const s =
    10 ** Math.min(12, Math.max(0, Math.floor(dec)));

  const a = Math.ceil(min * s);
  const b = Math.floor(max * s);

  if (a > b) {
    throw new Error("Invalid range.");
  }

  return (a + rand(b - a + 1)) / s;
}

const NAMES = [
  "Aarav",
  "Aanya",
  "Aditya",
  "Anaya",
  "Arjun",
  "Diya",
  "Ishaan",
  "Isha",
  "Kabir",
  "Kiara",
  "Krishna",
  "Meera",
  "Neel",
  "Nisha",
  "Riya",
  "Rohan",
  "Sara",
  "Vihaan",
  "Zoya",
  "Aiden",
  "Alex",
  "Chloe",
  "Daniel",
  "Emma",
  "Ethan",
  "Grace",
  "Jack",
  "Liam",
  "Mia",
  "Noah",
  "Olivia",
  "Ryan",
  "Sophia",
  "Thomas",
  "William",
];

export function randomName() {
  return NAMES[rand(NAMES.length)];
}

export function randomPassword(len = 16) {
  const c =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

  const n = Math.min(128, Math.max(8, Math.floor(len)));
  const a = new Uint32Array(n);

  crypto.getRandomValues(a);

  return Array.from(a, (x) => c[x % c.length]).join("");
}

export function randomChoice(v: string[]) {
  const a = v.map((x) => x.trim()).filter(Boolean);

  if (!a.length) {
    throw new Error("Enter at least one choice.");
  }

  return a[rand(a.length)];
}

export function calculateAge(b: string, a?: string) {
  const x = parseDateInput(b);
  const y = a ? parseDateInput(a) : new Date();

  y.setHours(0, 0, 0, 0);

  if (x > y) {
    throw new Error("Birth date cannot be in the future.");
  }

  let Y = y.getFullYear() - x.getFullYear();
  let M = y.getMonth() - x.getMonth();
  let D = y.getDate() - x.getDate();

  if (D < 0) {
    M--;
    D += new Date(
      y.getFullYear(),
      y.getMonth(),
      0,
    ).getDate();
  }

  if (M < 0) {
    Y--;
    M += 12;
  }

  return {
    years: Y,
    months: M,
    days: D,
  };
}

export function addToDate(
  v: string,
  y: number,
  m: number,
  d: number,
) {
  const x = parseDateInput(v);

  x.setFullYear(x.getFullYear() + Math.trunc(y));
  x.setMonth(x.getMonth() + Math.trunc(m));
  x.setDate(x.getDate() + Math.trunc(d));

  return formatDateInput(x);
}

export function workingDaysBetween(
  a: string,
  b: string,
) {
  let x = parseDateInput(a);
  let y = parseDateInput(b);

  if (x > y) {
    [x, y] = [y, x];
  }

  let n = 0;

  for (
    ;
    x <= y;
    x.setDate(x.getDate() + 1)
  ) {
    const w = x.getDay();

    if (w !== 0 && w !== 6) {
      n++;
    }
  }

  return n;
}

export function businessDaysBetween(
  a: string,
  b: string,
) {
  return workingDaysBetween(a, b);
}

export function generateMonthCalendar(
  y: number,
  m: number,
) {
  const first = new Date(y, m - 1, 1);
  const out: any[] = [];

  for (
    let i = first.getDay() - 1;
    i >= 0;
    i--
  ) {
    const d = new Date(
      y,
      m - 2,
      new Date(y, m - 1, 0).getDate() - i,
    );

    out.push({
      date: d,
      day: d.getDate(),
      currentMonth: false,
    });
  }

  for (
    let d = 1;
    d <= new Date(y, m, 0).getDate();
    d++
  ) {
    out.push({
      date: new Date(y, m - 1, d),
      day: d,
      currentMonth: true,
    });
  }

  let d = 1;

  while (out.length % 7) {
    const x = new Date(y, m, d++);

    out.push({
      date: x,
      day: x.getDate(),
      currentMonth: false,
    });
  }

  return out;
}

export function generateYearCalendars(y: number) {
  return Array.from(
    { length: 12 },
    (_, i) => generateMonthCalendar(y, i + 1),
  );
}

export function randomDate(
  a: string,
  b: string,
) {
  const x = parseDateInput(a);
  const y = parseDateInput(b);

  if (x > y) {
    throw new Error(
      "Start date must be before end date.",
    );
  }

  x.setDate(
    x.getDate() +
      randomNumber(
        0,
        Math.round(
          (y.getTime() - x.getTime()) / DAY,
        ),
      ),
  );

  return formatDateInput(x);
}