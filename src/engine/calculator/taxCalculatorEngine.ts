const NEW_REGIME_SLABS = [
  { upper: 400000, rate: 0 },
  { upper: 800000, rate: 0.05 },
  { upper: 1200000, rate: 0.1 },
  { upper: 1600000, rate: 0.15 },
  { upper: 2000000, rate: 0.2 },
  { upper: 2400000, rate: 0.25 },
  { upper: Infinity, rate: 0.3 }
] as const;

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

  if (mode !== "exclusive" && mode !== "inclusive") {
    throw new Error(
      "Please select a valid GST mode."
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

/**
 * AY 2026-27 estimate for an individual under the new tax regime.
 * The caller's deductions are treated as eligible deductions supplied by
 * the user; this calculator does not attempt to infer eligibility.
 *
 * The official AY 2026-27 new-regime slabs are 0% up to ₹4L, then 5%, 10%,
 * 15%, 20%, 25% and 30% across the published bands. Section 87A rebate,
 * surcharge and 4% health & education cess are included.
 */
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

  if (deductions > income) {
    throw new Error(
      "Deductions cannot exceed gross income."
    );
  }

  const taxableIncome =
    Math.max(
      0,
      income - deductions
    );

  const slabTax =
    calculateNewRegimeSlabTax(
      taxableIncome
    );

  const rebate =
    taxableIncome <= 1200000
      ? Math.min(
          slabTax,
          60000
        )
      : 0;

  const taxAfterRebate =
    Math.max(
      0,
      slabTax - rebate
    );

  const surchargeRate =
    getSurchargeRate(
      taxableIncome
    );

  let surcharge =
    taxAfterRebate *
    surchargeRate;

  surcharge =
    applyMarginalRelief(
      taxableIncome,
      taxAfterRebate,
      surcharge
    );

  const cess =
    (taxAfterRebate + surcharge) *
    0.04;

  const totalTax =
    taxAfterRebate +
    surcharge +
    cess;

  return {
    grossIncome: income,
    deductions,
    taxableIncome,
    estimatedTax: totalTax,
    incomeTaxBeforeRebate: slabTax,
    rebate,
    surcharge,
    cess,
    estimatedAfterTaxIncome:
      Math.max(0, income - totalTax)
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

  if (deductions > ctc) {
    throw new Error(
      "Annual deductions cannot exceed annual CTC."
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

function calculateNewRegimeSlabTax(
  income: number
): number {
  let tax = 0;
  let previousUpper = 0;

  for (const slab of NEW_REGIME_SLABS) {
    const taxableAtThisRate =
      Math.max(
        0,
        Math.min(
          income,
          slab.upper
        ) - previousUpper
      );

    tax +=
      taxableAtThisRate *
      slab.rate;

    previousUpper =
      slab.upper;

    if (income <= slab.upper) {
      break;
    }
  }

  return tax;
}

function getSurchargeRate(
  income: number
): number {
  if (income > 20000000) {
    return 0.25;
  }

  if (income > 10000000) {
    return 0.15;
  }

  if (income > 5000000) {
    return 0.1;
  }

  return 0;
}

function applyMarginalRelief(
  income: number,
  taxAfterRebate: number,
  surcharge: number
): number {
  if (income <= 5000000) {
    return surcharge;
  }

  const thresholds = [
    5000000,
    10000000,
    20000000
  ];

  for (const threshold of thresholds) {
    if (income <= threshold) {
      continue;
    }

    const thresholdTax =
      Math.max(
        0,
        calculateNewRegimeSlabTax(
          threshold
        ) -
          (threshold <= 1200000
            ? Math.min(
                calculateNewRegimeSlabTax(
                  threshold
                ),
                60000
              )
            : 0)
      );

    const thresholdSurcharge =
      threshold === 5000000
        ? 0
        : threshold === 10000000
          ? thresholdTax * 0.1
          : thresholdTax * 0.15;

    const maximumTaxWithMarginalRelief =
      thresholdTax +
      thresholdSurcharge +
      (income - threshold);

    return Math.min(
      surcharge,
      Math.max(
        0,
        maximumTaxWithMarginalRelief -
          taxAfterRebate
      )
    );
  }

  return surcharge;
}
