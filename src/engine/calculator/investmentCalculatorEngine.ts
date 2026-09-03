export interface InvestmentResult {
  invested: number;
  returns: number;
  maturity: number;
}

export function calculateSIP(
  monthlyInvestment: number,
  annualRate: number,
  years: number
): InvestmentResult {
  validate(
    monthlyInvestment,
    annualRate,
    years
  );

  const months =
    years * 12;

  const monthlyRate =
    annualRate / 12 / 100;

  let maturity: number;

  if (monthlyRate === 0) {
    maturity =
      monthlyInvestment * months;
  } else {
    maturity =
      monthlyInvestment *
      (((Math.pow(
        1 + monthlyRate,
        months
      ) - 1) /
        monthlyRate) *
        (1 + monthlyRate));
  }

  const invested =
    monthlyInvestment * months;

  return {
    invested,
    returns:
      maturity - invested,
    maturity
  };
}

export function calculateLumpsum(
  principal: number,
  annualRate: number,
  years: number
): InvestmentResult {
  validate(
    principal,
    annualRate,
    years
  );

  const maturity =
    principal *
    Math.pow(
      1 + annualRate / 100,
      years
    );

  return {
    invested: principal,
    returns:
      maturity - principal,
    maturity
  };
}

export function calculateSWP(
  principal: number,
  monthlyWithdrawal: number,
  annualRate: number,
  years: number
) {
  validate(
    principal,
    monthlyWithdrawal,
    annualRate,
    years
  );

  let balance = principal;

  const months =
    years * 12;

  const monthlyRate =
    annualRate / 12 / 100;

  let totalWithdrawn = 0;

  for (
    let month = 0;
    month < months;
    month++
  ) {
    balance *=
      1 + monthlyRate;

    balance -=
      monthlyWithdrawal;

    totalWithdrawn +=
      monthlyWithdrawal;

    if (balance <= 0) {
      balance = 0;
      break;
    }
  }

  return {
    initialInvestment: principal,
    totalWithdrawn,
    remainingBalance: balance
  };
}

export function calculatePPF(
  annualDeposit: number,
  annualRate: number,
  years: number
) {
  validate(
    annualDeposit,
    annualRate,
    years
  );

  let balance = 0;

  for (
    let year = 0;
    year < years;
    year++
  ) {
    balance +=
      annualDeposit;

    balance *=
      1 + annualRate / 100;
  }

  return {
    invested:
      annualDeposit * years,
    interest:
      balance -
      annualDeposit * years,
    maturity: balance
  };
}

export function calculateNPS(
  monthlyInvestment: number,
  annualRate: number,
  years: number
) {
  return calculateSIP(
    monthlyInvestment,
    annualRate,
    years
  );
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
      "Please enter valid investment values."
    );
  }

  if (
    values.length >= 3 &&
    values[values.length - 1] <= 0
  ) {
    throw new Error(
      "Investment period must be greater than zero."
    );
  }
}