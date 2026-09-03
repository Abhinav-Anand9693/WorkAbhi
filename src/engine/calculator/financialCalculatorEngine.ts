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
  if (
    principal <= 0 ||
    annualRate < 0 ||
    tenureMonths <= 0 ||
    !Number.isFinite(principal) ||
    !Number.isFinite(annualRate) ||
    !Number.isFinite(tenureMonths)
  ) {
    throw new Error(
      "Please enter valid loan values."
    );
  }

  const monthlyRate =
    annualRate / 12 / 100;

  const monthlyEMI =
    monthlyRate === 0
      ? principal / tenureMonths
      : (principal *
          monthlyRate *
          Math.pow(
            1 + monthlyRate,
            tenureMonths
          )) /
        (Math.pow(
          1 + monthlyRate,
          tenureMonths
        ) - 1);

  const totalPayment =
    monthlyEMI * tenureMonths;

  return {
    monthlyEMI,
    totalInterest:
      totalPayment - principal,
    totalPayment
  };
}