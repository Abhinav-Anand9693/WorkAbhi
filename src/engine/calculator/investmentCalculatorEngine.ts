import {
  assertFinite,
  roundMoney
} from "./calculatorMath";

export interface InvestmentResult {
  invested: number;
  returns: number;
  maturity: number;
}

function validateInvestment(
  ...values: number[]
): void {
  assertFinite(...values);

  if (
    values.some((value) => value < 0)
  )
    throw new Error(
      "Investment values cannot be negative."
    );
}

export function calculateSIP(
  monthlyInvestment: number,
  annualRate: number,
  years: number
): InvestmentResult {
  validateInvestment(
    monthlyInvestment,
    annualRate,
    years
  );

  if (
    monthlyInvestment <= 0 ||
    years <= 0
  )
    throw new Error(
      "Monthly investment and period must be greater than zero."
    );

  const months = Math.round(
    years * 12
  );

  if (months <= 0)
    throw new Error(
      "Investment period is too short."
    );

  const monthlyRate =
    annualRate / 12 / 100;

  const maturity =
    monthlyRate === 0
      ? monthlyInvestment * months
      : monthlyInvestment *
        (((1 + monthlyRate) **
          months -
          1) /
          monthlyRate) *
        (1 + monthlyRate);

  const invested =
    monthlyInvestment * months;

  return {
    invested: roundMoney(invested),
    returns: roundMoney(
      maturity - invested
    ),
    maturity: roundMoney(maturity)
  };
}

export function calculateLumpsum(
  principal: number,
  annualRate: number,
  years: number
): InvestmentResult {
  validateInvestment(
    principal,
    annualRate,
    years
  );

  if (
    principal <= 0 ||
    years <= 0
  )
    throw new Error(
      "Investment amount and period must be greater than zero."
    );

  const maturity =
    principal *
    (1 + annualRate / 100) **
      years;

  return {
    invested: roundMoney(principal),
    returns: roundMoney(
      maturity - principal
    ),
    maturity: roundMoney(maturity)
  };
}

export function calculateSWP(
  principal: number,
  monthlyWithdrawal: number,
  annualRate: number,
  years: number
) {
  validateInvestment(
    principal,
    monthlyWithdrawal,
    annualRate,
    years
  );

  if (
    principal <= 0 ||
    years <= 0
  )
    throw new Error(
      "Initial investment and period must be greater than zero."
    );

  let balance = principal;
  let totalWithdrawn = 0;

  const months = Math.round(
    years * 12
  );

  const monthlyRate =
    annualRate / 12 / 100;

  for (
    let month = 0;
    month < months;
    month += 1
  ) {
    balance *= 1 + monthlyRate;

    const withdrawal = Math.min(
      monthlyWithdrawal,
      balance
    );

    balance -= withdrawal;
    totalWithdrawn += withdrawal;

    if (balance <= 0)
      break;
  }

  return {
    initialInvestment:
      roundMoney(principal),
    totalWithdrawn:
      roundMoney(totalWithdrawn),
    remainingBalance:
      roundMoney(balance)
  };
}

/** PPF estimate: assumes the supplied annual contribution is made at the beginning of each financial year. */

export function calculatePPF(
  annualDeposit: number,
  annualRate: number,
  years: number
) {
  validateInvestment(
    annualDeposit,
    annualRate,
    years
  );

  if (
    annualDeposit <= 0 ||
    years <= 0 ||
    !Number.isInteger(years)
  )
    throw new Error(
      "Annual deposit and period must be valid positive values."
    );

  let balance = 0;

  for (
    let year = 0;
    year < years;
    year += 1
  )
    balance =
      (balance + annualDeposit) *
      (1 + annualRate / 100);

  const invested =
    annualDeposit * years;

  return {
    invested: roundMoney(invested),
    interest: roundMoney(
      balance - invested
    ),
    maturity: roundMoney(balance)
  };
}

export function calculateNPS(
  monthlyInvestment: number,
  annualRate: number,
  years: number
): InvestmentResult {
  return calculateSIP(
    monthlyInvestment,
    annualRate,
    years
  );
}