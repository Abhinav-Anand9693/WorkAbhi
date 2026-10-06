export function assertFinite(...values: number[]): void {
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("Please enter valid numbers.");
  }
}

export function assertNonNegative(...values: number[]): void {
  assertFinite(...values);

  if (values.some((value) => value < 0)) {
    throw new Error("Values cannot be negative.");
  }
}

export function roundMoney(
  value: number,
  decimals = 2
): number {
  if (!Number.isFinite(value))
    throw new Error(
      "Calculation produced an invalid result."
    );

  const factor = 10 ** decimals;

  return (
    Math.round((value + Number.EPSILON) * factor) /
    factor
  );
}

export function roundNumber(
  value: number,
  decimals = 6
): number {
  if (!Number.isFinite(value))
    throw new Error(
      "Calculation produced an invalid result."
    );

  const factor = 10 ** decimals;

  return (
    Math.round((value + Number.EPSILON) * factor) /
    factor
  );
}