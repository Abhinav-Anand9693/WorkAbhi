import {
  assertFinite,
  roundMoney
} from "./calculatorMath";

export type TaxRegime = "new" | "old";

function slabTax(
  income: number,
  slabs: Array<{
    upTo: number;
    rate: number;
  }>
): number {
  let tax = 0;
  let lower = 0;

  for (const slab of slabs) {
    const taxable = Math.max(
      0,
      Math.min(income, slab.upTo) - lower
    );

    tax += taxable * slab.rate;
    lower = slab.upTo;

    if (income <= slab.upTo)
      break;
  }

  return tax;
}

/** AY 2026-27 estimate for resident individuals. Does not model special-rate income, capital gains, surcharge or every deduction/exemption. */

export function calculateIncomeTax(
  income: number,
  deductions: number,
  regime: TaxRegime = "new"
) {
  assertFinite(income, deductions);

  if (
    income < 0 ||
    deductions < 0 ||
    deductions > income
  )
    throw new Error(
      "Income and deductions must be valid, and deductions cannot exceed income."
    );

  const taxableIncome = Math.max(
    0,
    income - deductions
  );

  let baseTax: number;
  let rebate = 0;

  if (regime === "new") {
    baseTax = slabTax(taxableIncome, [
      { upTo: 400000, rate: 0 },
      { upTo: 800000, rate: 0.05 },
      { upTo: 1200000, rate: 0.1 },
      { upTo: 1600000, rate: 0.15 },
      { upTo: 2000000, rate: 0.2 },
      { upTo: 2400000, rate: 0.25 },
      {
        upTo: Number.POSITIVE_INFINITY,
        rate: 0.3
      }
    ]);

    if (taxableIncome <= 1200000)
      rebate = Math.min(
        baseTax,
        60000
      );
  } else {
    baseTax = slabTax(taxableIncome, [
      { upTo: 250000, rate: 0 },
      { upTo: 500000, rate: 0.05 },
      { upTo: 1000000, rate: 0.2 },
      {
        upTo: Number.POSITIVE_INFINITY,
        rate: 0.3
      }
    ]);

    if (taxableIncome <= 500000)
      rebate = Math.min(
        baseTax,
        12500
      );
  }

  const taxAfterRebate = Math.max(
    0,
    baseTax - rebate
  );

  const cess = taxAfterRebate * 0.04;
  const totalTax =
    taxAfterRebate + cess;

  return {
    grossIncome: roundMoney(income),
    deductions: roundMoney(deductions),
    taxableIncome: roundMoney(
      taxableIncome
    ),
    regime,
    baseTax: roundMoney(baseTax),
    rebate: roundMoney(rebate),
    cess: roundMoney(cess),
    estimatedTax: roundMoney(totalTax),
    estimatedAfterTaxIncome:
      roundMoney(income - totalTax),
    taxYear: "AY 2026-27"
  };
}

export function calculateGST(
  amount: number,
  rate: number,
  mode: "exclusive" | "inclusive"
) {
  assertFinite(amount, rate);

  if (amount < 0 || rate < 0)
    throw new Error(
      "Please enter valid GST values."
    );

  if (mode === "exclusive") {
    const gst =
      (amount * rate) / 100;

    return {
      baseAmount: roundMoney(amount),
      gst: roundMoney(gst),
      total: roundMoney(
        amount + gst
      )
    };
  }

  if (rate === -100)
    throw new Error(
      "GST rate cannot be -100%."
    );

  const baseAmount =
    amount / (1 + rate / 100);

  const gst =
    amount - baseAmount;

  return {
    baseAmount: roundMoney(
      baseAmount
    ),
    gst: roundMoney(gst),
    total: roundMoney(amount)
  };
}

export function calculateSalary(
  ctc: number,
  deductions: number
) {
  assertFinite(ctc, deductions);

  if (
    ctc < 0 ||
    deductions < 0 ||
    deductions > ctc
  )
    throw new Error(
      "CTC and deductions must be valid, and deductions cannot exceed CTC."
    );

  const annualTakeHome =
    ctc - deductions;

  return {
    annualCTC: roundMoney(ctc),
    annualDeductions:
      roundMoney(deductions),
    annualTakeHome:
      roundMoney(annualTakeHome),
    monthlyTakeHome:
      roundMoney(
        annualTakeHome / 12
      )
  };
}