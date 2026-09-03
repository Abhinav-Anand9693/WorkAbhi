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

  const monthlyRate =
    annualRate / 12 / 100;

  let maturity = 0;

  for (
    let month = 0;
    month < months;
    month++
  ) {
    maturity +=
      monthlyDeposit;

    maturity *=
      1 + monthlyRate;
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