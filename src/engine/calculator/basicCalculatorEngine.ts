import {
  assertFinite,
  assertNonNegative,
  roundMoney,
  roundNumber
} from "./calculatorMath";

export function calculatePercentage(
  value: number,
  percentage: number
): number {
  assertFinite(value, percentage);

  return roundNumber((value * percentage) / 100);
}

export function calculatePercentageIncrease(
  oldValue: number,
  newValue: number
): number {
  assertFinite(oldValue, newValue);

  if (oldValue === 0)
    throw new Error("Original value cannot be zero.");

  return roundNumber(
    ((newValue - oldValue) / Math.abs(oldValue)) * 100
  );
}

export function calculatePercentageDecrease(
  oldValue: number,
  newValue: number
): number {
  assertFinite(oldValue, newValue);

  if (oldValue === 0)
    throw new Error("Original value cannot be zero.");

  return roundNumber(
    ((oldValue - newValue) / Math.abs(oldValue)) * 100
  );
}

export function calculateSimpleInterest(
  principal: number,
  rate: number,
  time: number
) {
  assertNonNegative(principal, rate, time);

  const interest = (principal * rate * time) / 100;

  return {
    interest: roundMoney(interest),
    amount: roundMoney(principal + interest)
  };
}

export function calculateCompoundInterest(
  principal: number,
  rate: number,
  time: number
) {
  assertNonNegative(principal, rate, time);

  const amount =
    principal * (1 + rate / 100) ** time;

  return {
    interest: roundMoney(amount - principal),
    amount: roundMoney(amount)
  };
}

export function calculateDiscount(
  price: number,
  discount: number
) {
  assertNonNegative(price, discount);

  if (discount > 100)
    throw new Error("Discount cannot exceed 100%.");

  const discountAmount = (price * discount) / 100;

  return {
    discountAmount: roundMoney(discountAmount),
    finalPrice: roundMoney(price - discountAmount)
  };
}

export function calculateProfitMargin(
  cost: number,
  selling: number
) {
  assertFinite(cost, selling);

  if (cost <= 0 || selling <= 0)
    throw new Error(
      "Cost and selling price must be greater than zero."
    );

  const profit = selling - cost;

  return {
    profit: roundMoney(profit),
    margin: roundNumber((profit / selling) * 100)
  };
}

export function calculateProfitLoss(
  cost: number,
  selling: number
) {
  assertFinite(cost, selling);

  if (cost <= 0 || selling < 0)
    throw new Error(
      "Cost price must be greater than zero and selling price cannot be negative."
    );

  const difference = selling - cost;

  return {
    difference: roundMoney(difference),
    percentage: roundNumber(
      (Math.abs(difference) / cost) * 100
    ),
    type:
      difference > 0
        ? "profit"
        : difference < 0
          ? "loss"
          : "no-profit-loss",
  };
}

export function calculateInflation(
  amount: number,
  rate: number,
  years: number
) {
  assertNonNegative(amount, rate, years);

  const futureValue =
    amount * (1 + rate / 100) ** years;

  return {
    futureValue: roundMoney(futureValue),
    increase: roundMoney(futureValue - amount)
  };
}