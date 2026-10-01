export function calculateFD(
  principal: number,
  annualRate: number,
  years: number,
  frequency = 4
) {
  validate(
    principal,
    annualRate,
    years
  );

  if (
    !Number.isFinite(frequency) ||
    frequency <= 0
  ) {
    throw new Error(
      "Invalid compounding frequency."
    );
  }

  const maturity =
    principal *
    Math.pow(
      1 +
        annualRate /
          100 /
          frequency,
      frequency * years
    );

  return {
    principal,
    interest:
      maturity - principal,
    maturity
  };
}

export function calculateRD(
  monthlyDeposit: number,
  annualRate: number,
  months: number
) {
  validate(
    monthlyDeposit,
    annualRate,
    months
  );

  if (
    !Number.isInteger(months) ||
    months <= 0
  ) {
    throw new Error(
      "RD tenure must be a whole number of months greater than zero."
    );
  }

  // Estimate using monthly compounding with each deposit made at the
  // beginning of its month. The convention is deterministic and avoids
  // the earlier off-by-one ambiguity in the accumulation loop.
  const monthlyRate =
    annualRate / 12 / 100;

  const growth =
    1 + monthlyRate;

  let maturity =
    0;

  for (
    let month = 0;
    month < months;
    month++
  ) {
    maturity =
      (maturity +
        monthlyDeposit) *
      growth;
  }

  const invested =
    monthlyDeposit * months;

  return {
    invested,
    interest:
      maturity - invested,
    maturity
  };
}

function validate(
  ...values: number[]
) {
  if (
    values.some(
      (value) =>
        !Number.isFinite(value) ||
        value < 0
    )
  ) {
    throw new Error(
      "Please enter valid deposit values."
    );
  }
}
