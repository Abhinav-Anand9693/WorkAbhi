"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  addToDate,
  businessDaysBetween,
  calculateAge,
  dateDifference,
  dateToTimestamp,
  daysUntil,
  formatDateInput,
  generateMonthCalendar,
  generateYearCalendars,
  getISOWeekNumber,
  isLeapYear,
  randomChoice,
  randomDate,
  randomName,
  randomNumber,
  randomPassword,
  timestampToDate,
  workingDaysBetween,
} from "@/engine/date-time/dateTimeEngine";

interface P {
  toolId: string;
}

const T: Record<string, string> = {
  "leap-year-checker": "Leap Year Checker",
  "week-number-calculator": "Week Number Calculator",
  "date-difference": "Date Difference",
  "days-until-calculator": "Days Until Calculator",
  "date-to-timestamp": "Date to Timestamp",
  "timestamp-to-date": "Timestamp to Date",
  "random-number-generator": "Random Number Generator",
  "random-name-generator": "Random Name Generator",
  "random-password-generator": "Random Password Generator",
  "random-choice-picker": "Random Choice Picker",
  "stopwatch": "Stopwatch",
  "countdown-timer": "Countdown Timer",
  "age-calculator": "Age Calculator",
  "date-calculator": "Date Calculator",
  "working-days-calculator": "Working Days Calculator",
  "business-days-calculator": "Business Days Calculator",
  "pomodoro-timer": "Pomodoro Timer",
  "calendar-generator": "Calendar Generator",
  "monthly-calendar-generator": "Monthly Calendar Generator",
  "year-calendar-generator": "Year Calendar Generator",
  "random-date-generator": "Random Date Generator",
  "unix-timestamp-converter": "Unix Timestamp Converter",
};

const today = () => formatDateInput(new Date());

function F({
  label,
  value,
  onChange,
  type,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label}
      </span>

      <input
        type={type || "text"}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border bg-background px-4 py-3"
      />
    </label>
  );
}

function B({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border px-5 py-3 font-medium hover:bg-muted"
    >
      {children}
    </button>
  );
}

function R({ v }: { v: string }) {
  const [c, setC] = useState(false);

  return (
    <section className="rounded-2xl border p-5">
      <div className="flex justify-between">
        <b>Result</b>

        <button
          className="rounded-lg border px-4 py-2 text-sm"
          onClick={async () => {
            await navigator.clipboard.writeText(v);
            setC(true);
            setTimeout(() => setC(false), 1000);
          }}
        >
          {c ? "Copied" : "Copy"}
        </button>
      </div>

      <pre className="mt-4 whitespace-pre-wrap overflow-auto rounded-xl border p-4">
        {v}
      </pre>
    </section>
  );
}

export default function DateTimeTool({ toolId }: P) {
  const title =
    T[toolId] || "Date & Time Tool";

  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const [year, setYear] = useState(
    String(new Date().getFullYear()),
  );

  const [date, setDate] = useState(today);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);

  const [ts, setTs] = useState("");

  const [unit, setUnit] = useState<
    "milliseconds" | "seconds"
  >("milliseconds");

  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [dec, setDec] = useState("0");
  const [pass, setPass] = useState("16");

  const [choices, setChoices] = useState(
    "Option A\nOption B\nOption C",
  );

  const [yrs, setYrs] = useState("0");
  const [mos, setMos] = useState("0");
  const [dys, setDys] = useState("7");

  const [sw, setSw] = useState(0);
  const [swRun, setSwRun] = useState(false);

  const [cd, setCd] = useState(300);
  const [cdRun, setCdRun] = useState(false);

  const [pom, setPom] = useState(1500);
  const [pomRun, setPomRun] = useState(false);

  useEffect(() => {
    if (!cdRun) return;

    const id = setInterval(
      () =>
        setCd((v) => {
          if (v <= 1) {
            setCdRun(false);
            return 0;
          }

          return v - 1;
        }),
      1000,
    );

    return () => clearInterval(id);
  }, [cdRun]);

  useEffect(() => {
    if (!pomRun) return;

    const id = setInterval(
      () =>
        setPom((v) => {
          if (v <= 1) {
            setPomRun(false);
            return 0;
          }

          return v - 1;
        }),
      1000,
    );

    return () => clearInterval(id);
  }, [pomRun]);

  function process() {
    setError("");

    try {
      switch (toolId) {
        case "leap-year-checker":
          return setResult(
            `${year} is ${
              isLeapYear(+year) ? "" : "not "
            }a leap year.`,
          );

        case "week-number-calculator":
          return setResult(
            `ISO Week: ${getISOWeekNumber(
              new Date(date + "T00:00:00"),
            )}`,
          );

        case "date-difference": {
          const x = dateDifference(start, end);

          return setResult(
            `Total days: ${x.totalDays}\nAbsolute days: ${x.absoluteDays}\nWeeks: ${x.weeks}\nApprox. months: ${x.monthsApprox}\nApprox. years: ${x.yearsApprox}`,
          );
        }

        case "days-until-calculator":
          return setResult(
            `${daysUntil(date)} day(s)`,
          );

        case "date-to-timestamp":
          return setResult(
            String(dateToTimestamp(date, unit)),
          );

        case "timestamp-to-date":
        case "unix-timestamp-converter":
          return setResult(
            timestampToDate(
              ts,
              unit === "seconds"
                ? "seconds"
                : "milliseconds",
            ),
          );

        case "random-number-generator":
          return setResult(
            String(
              randomNumber(+min, +max, +dec),
            ),
          );

        case "random-name-generator":
          return setResult(randomName());

        case "random-password-generator":
          return setResult(randomPassword(+pass));

        case "random-choice-picker":
          return setResult(
            randomChoice(
              choices.split(/\r?\n/),
            ),
          );

        case "age-calculator": {
          const x = calculateAge(start, end);

          return setResult(
            `${x.years} years, ${x.months} months, ${x.days} days`,
          );
        }

        case "date-calculator":
          return setResult(
            addToDate(
              start,
              +yrs,
              +mos,
              +dys,
            ),
          );

        case "working-days-calculator":
          return setResult(
            String(
              workingDaysBetween(start, end),
            ),
          );

        case "business-days-calculator":
          return setResult(
            String(
              businessDaysBetween(start, end),
            ),
          );

        case "random-date-generator":
          return setResult(
            randomDate(start, end),
          );

        default:
          return;
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to process.",
      );
    }
  }

  const swStartedAtRef =
    useRef<number | null>(null);

  useEffect(() => {
    if (!swRun) return;

    const id = setInterval(() => {
      if (
        swStartedAtRef.current !== null
      ) {
        setSw(
          performance.now() -
            swStartedAtRef.current,
        );
      }
    }, 50);

    return () => clearInterval(id);
  }, [swRun]);

  const clock = (n: number) =>
    `${String(Math.floor(n / 60)).padStart(
      2,
      "0",
    )}:${String(n % 60).padStart(2, "0")}`;

  if (toolId === "stopwatch")
    return (
      <section className="rounded-2xl border p-8 text-center">
        <div className="text-5xl font-bold tabular-nums">
          {`${String(
            Math.floor(sw / 60000),
          ).padStart(
            2,
            "0",
          )}:${String(
            Math.floor(sw / 1000) % 60,
          ).padStart(
            2,
            "0",
          )}.${String(
            Math.floor(sw / 10) % 100,
          ).padStart(2, "0")}`}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <B
            onClick={() => {
              if (swRun) {
                if (
                  swStartedAtRef.current !==
                  null
                ) {
                  setSw(
                    performance.now() -
                      swStartedAtRef.current,
                  );
                }

                setSwRun(false);
              } else {
                swStartedAtRef.current =
                  performance.now() - sw;

                setSwRun(true);
              }
            }}
          >
            {swRun ? "Pause" : "Start"}
          </B>

          <B
            onClick={() => {
              setSwRun(false);
              swStartedAtRef.current = null;
              setSw(0);
            }}
          >
            Reset
          </B>
        </div>
      </section>
    );

  if (
    toolId === "countdown-timer" ||
    toolId === "pomodoro-timer"
  ) {
    const isP =
      toolId === "pomodoro-timer";

    const n = isP ? pom : cd;
    const run = isP ? pomRun : cdRun;
    const setRun = isP
      ? setPomRun
      : setCdRun;

    const setN = isP
      ? setPom
      : setCd;

    return (
      <section className="rounded-2xl border p-8 text-center">
        <h2 className="text-xl font-semibold">
          {title}
        </h2>

        <div className="mt-5 text-5xl font-bold tabular-nums">
          {clock(n)}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <B
            onClick={() =>
              setRun((v) => !v)
            }
          >
            {run ? "Pause" : "Start"}
          </B>

          <B
            onClick={() => {
              setRun(false);
              setN(isP ? 1500 : 300);
            }}
          >
            Reset
          </B>
        </div>
      </section>
    );
  }

  if (
    [
      "monthly-calendar-generator",
      "calendar-generator",
      "year-calendar-generator",
    ].includes(toolId)
  ) {
    const y = +year;

    const month =
      toolId ===
      "monthly-calendar-generator"
        ? new Date().getMonth() + 1
        : 0;

    const cs =
      toolId ===
      "monthly-calendar-generator"
        ? [
            generateMonthCalendar(
              y,
              month,
            ),
          ]
        : generateYearCalendars(y);

    return (
      <section className="space-y-5">
        <F
          label="Year"
          value={year}
          onChange={setYear}
          type="number"
        />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cs.map((days, i) => (
            <div
              className="rounded-2xl border p-4"
              key={i}
            >
              <b>
                {toolId ===
                "monthly-calendar-generator"
                  ? new Date(
                      y,
                      month - 1,
                    ).toLocaleString(
                      undefined,
                      {
                        month: "long",
                        year: "numeric",
                      },
                    )
                  : new Date(
                      y,
                      i,
                    ).toLocaleString(
                      undefined,
                      {
                        month: "long",
                        year: "numeric",
                      },
                    )}
              </b>

              <div className="mt-3 grid grid-cols-7 text-center text-sm">
                {days.map((x, j) => (
                  <span
                    key={j}
                    className={`p-2 ${
                      x.currentMonth
                        ? ""
                        : "opacity-30"
                    }`}
                  >
                    {x.day}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border p-5 sm:p-6">
        <h2 className="text-xl font-semibold">
          {title}
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Process this date and time task directly in your browser.
        </p>

        {toolId ===
          "leap-year-checker" && (
          <div className="mt-5">
            <F
              label="Year"
              value={year}
              onChange={setYear}
              type="number"
            />
          </div>
        )}

        {[
          "week-number-calculator",
          "days-until-calculator",
        ].includes(toolId) && (
          <div className="mt-5">
            <F
              label="Date"
              value={date}
              onChange={setDate}
              type="date"
            />
          </div>
        )}

        {[
          "date-difference",
          "age-calculator",
          "working-days-calculator",
          "business-days-calculator",
          "random-date-generator",
        ].includes(toolId) && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <F
              label={
                toolId === "age-calculator"
                  ? "Birth date"
                  : "Start date"
              }
              value={start}
              onChange={setStart}
              type="date"
            />

            <F
              label={
                toolId === "age-calculator"
                  ? "As of date"
                  : "End date"
              }
              value={end}
              onChange={setEnd}
              type="date"
            />
          </div>
        )}

        {["date-to-timestamp"].includes(
          toolId,
        ) && (
          <div className="mt-5">
            <F
              label="Date"
              value={date}
              onChange={setDate}
              type="date"
            />
          </div>
        )}

        {[
          "timestamp-to-date",
          "unix-timestamp-converter",
        ].includes(toolId) && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <F
              label="Timestamp"
              value={ts}
              onChange={setTs}
              type="number"
            />

            <label>
              Unit

              <select
                value={unit}
                onChange={(e) =>
                  setUnit(
                    e.target.value as typeof unit,
                  )
                }
                className="mt-2 w-full rounded-lg border px-4 py-3"
              >
                <option value="milliseconds">
                  Milliseconds
                </option>

                <option value="seconds">
                  Seconds
                </option>
              </select>
            </label>
          </div>
        )}

        {toolId ===
          "random-number-generator" && (
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <F
              label="Minimum"
              value={min}
              onChange={setMin}
              type="number"
            />

            <F
              label="Maximum"
              value={max}
              onChange={setMax}
              type="number"
            />

            <F
              label="Decimals"
              value={dec}
              onChange={setDec}
              type="number"
              min={0}
              max={12}
            />
          </div>
        )}

        {toolId ===
          "random-password-generator" && (
          <div className="mt-5">
            <F
              label="Length"
              value={pass}
              onChange={setPass}
              type="number"
              min={8}
              max={128}
            />
          </div>
        )}

        {toolId ===
          "random-choice-picker" && (
          <div className="mt-5">
            <label>
              Choices (one per line)

              <textarea
                value={choices}
                onChange={(e) =>
                  setChoices(e.target.value)
                }
                rows={8}
                className="mt-2 w-full rounded-xl border p-3"
              />
            </label>
          </div>
        )}

        {toolId === "date-calculator" && (
          <div className="mt-5 grid gap-4 sm:grid-cols-4">
            <F
              label="Start date"
              value={start}
              onChange={setStart}
              type="date"
            />

            <F
              label="Years"
              value={yrs}
              onChange={setYrs}
              type="number"
            />

            <F
              label="Months"
              value={mos}
              onChange={setMos}
              type="number"
            />

            <F
              label="Days"
              value={dys}
              onChange={setDys}
              type="number"
            />
          </div>
        )}

        <div className="mt-5">
          <B onClick={process}>
            Calculate / Generate
          </B>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </section>

      {result && <R v={result} />}
    </div>
  );
}