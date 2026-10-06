import {
  assertFinite,
  roundMoney
} from "./calculatorMath";

export interface EMIResult {
  monthlyEMI: number;
  totalInterest: number;
  totalPayment: number;
}

export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
): EMIResult {
  assertFinite(
    principal,
    annualRate,
    tenureMonths
  );

  if (
    principal <= 0 ||
    annualRate < 0 ||
    tenureMonths <= 0 ||
    !Number.isInteger(tenureMonths)
  ) {
    throw new Error(
      "Loan amount and tenure must be positive; interest rate cannot be negative."
    );
  }

  const monthlyRate =
    annualRate / 12 / 100;

  const monthlyEMI =
    monthlyRate === 0
      ? principal / tenureMonths
      : principal *
        monthlyRate *
        ((1 + monthlyRate) **
          tenureMonths) /
        (((1 + monthlyRate) **
          tenureMonths) -
          1);

  const totalPayment =
    monthlyEMI * tenureMonths;

  return {
    monthlyEMI: roundMoney(
      monthlyEMI
    ),

    totalInterest: roundMoney(
      totalPayment - principal
    ),

    totalPayment: roundMoney(
      totalPayment
    )
  };
}