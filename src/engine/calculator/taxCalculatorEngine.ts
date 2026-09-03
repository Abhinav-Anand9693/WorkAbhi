export function calculateGST(
  amount: number,
  rate: number,
  mode:
    | "exclusive"
    | "inclusive"
) {
  if (
    !Number.isFinite(amount) ||
    !Number.isFinite(rate) ||
    amount < 0 ||
    rate < 0
  ) {
    throw new Error(
      "Please enter valid GST values."
    );
  }

  if (mode === "exclusive") {
    const gst =
      (amount * rate) / 100;

    return {
      baseAmount: amount,
      gst,
      total: amount + gst
    };
  }

  const baseAmount =
    amount /
    (1 + rate / 100);

  const gst =
    amount - baseAmount;

  return {
    baseAmount,
    gst,
    total: amount
  };
}

export function calculateIncomeTax(
  income: number,
  deductions: number
) {
  if (
    !Number.isFinite(income) ||
    !Number.isFinite(deductions) ||
    income < 0 ||
    deductions < 0
  ) {
    throw new Error(
      "Please enter valid income values."
    );
  }

  const taxableIncome =
    Math.max(
      0,
      income - deductions
    );

  /*
   * Simplified estimate only.
   *
   * This is intentionally not presented
   * as an official tax filing calculation.
   */

  let tax = 0;

  if (taxableIncome > 1500000) {
    tax +=
      (taxableIncome - 1500000) *
      0.3;

    tax +=
      500000 * 0.2;

    tax +=
      500000 * 0.15;

    tax +=
      250000 * 0.1;
  } else if (
    taxableIncome > 1000000
  ) {
    tax +=
      (taxableIncome - 1000000) *
      0.2;

    tax +=
      500000 * 0.15;

    tax +=
      250000 * 0.1;
  } else if (
    taxableIncome > 750000
  ) {
    tax +=
      (taxableIncome - 750000) *
      0.1;

    tax +=
      500000 * 0.15;
  } else if (
    taxableIncome > 500000
  ) {
    tax +=
      (taxableIncome - 500000) *
      0.05;
  }

  return {
    grossIncome: income,
    deductions,
    taxableIncome,
    estimatedTax: tax,
    estimatedAfterTaxIncome:
      income - tax
  };
}

export function calculateSalary(
  ctc: number,
  deductions: number
) {
  if (
    !Number.isFinite(ctc) ||
    !Number.isFinite(deductions) ||
    ctc < 0 ||
    deductions < 0
  ) {
    throw new Error(
      "Please enter valid salary values."
    );
  }

  const annualTakeHome =
    Math.max(
      0,
      ctc - deductions
    );

  return {
    annualCTC: ctc,
    annualDeductions:
      deductions,
    annualTakeHome,
    monthlyTakeHome:
      annualTakeHome / 12
  };
}