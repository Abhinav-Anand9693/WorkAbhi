import {
  assertFinite,
  roundMoney
} from "./calculatorMath";

export function calculateFD(
  principal: number,
  annualRate: number,
  years: number,
  frequency = 4
) {
  assertFinite(
    principal,
    annualRate,
    years,
    frequency
  );

  if (
    principal <= 0 ||
    annualRate < 0 ||
    years <= 0 ||
    frequency <= 0
  )
    throw new Error(
      "Please enter valid fixed-deposit values."
    );

  const maturity =
    principal *
    (1 + annualRate / 100 / frequency) **
      (frequency * years);

  return {
    principal: roundMoney(principal),
    interest: roundMoney(
      maturity - principal
    ),
    maturity: roundMoney(maturity)
  };
}

/** RD estimate using monthly deposits and monthly equivalent compounding. Actual bank RD maturity can differ by product conventions. */

export function calculateRD(
  monthlyDeposit: number,
  annualRate: number,
  months: number
) {
  assertFinite(
    monthlyDeposit,
    annualRate,
    months
  );

  if (
    monthlyDeposit <= 0 ||
    annualRate < 0 ||
    months <= 0 ||
    !Number.isInteger(months)
  )
    throw new Error(
      "Monthly deposit and tenure must be valid positive values."
    );

  const monthlyRate =
    annualRate / 12 / 100;

  let maturity = 0;

  for (
    let month = 0;
    month < months;
    month += 1
  ) {
    maturity += monthlyDeposit;
    maturity *= 1 + monthlyRate;
  }

  const invested =
    monthlyDeposit * months;

  return {
    invested: roundMoney(invested),
    interest: roundMoney(
      maturity - invested
    ),
    maturity: roundMoney(maturity)
  };
}