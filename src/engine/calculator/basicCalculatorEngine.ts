export function calculatePercentage(
  value: number,
  percentage: number
): number {
  validateNumbers(value, percentage);

  return (value * percentage) / 100;
}

export function calculatePercentageIncrease(
  oldValue: number,
  newValue: number
): number {
  validateNumbers(oldValue, newValue);

  if (oldValue === 0) {
    throw new Error(
      "Original value cannot be zero."
    );
  }

  return (
    ((newValue - oldValue) /
      Math.abs(oldValue)) *
    100
  );
}

export function calculatePercentageDecrease(
  oldValue: number,
  newValue: number
): number {
  validateNumbers(oldValue, newValue);

  if (oldValue === 0) {
    throw new Error(
      "Original value cannot be zero."
    );
  }

  return (
    ((oldValue - newValue) /
      Math.abs(oldValue)) *
    100
  );
}

export function calculateSimpleInterest(
  principal: number,
  rate: number,
  time: number
) {
  validateNonNegative(
    principal,
    rate,
    time
  );

  const interest =
    (principal * rate * time) /
    100;

  return {
    interest,
    amount: principal + interest
  };
}

export function calculateCompoundInterest(
  principal: number,
  rate: number,
  time: number
) {
  validateNonNegative(
    principal,
    rate,
    time
  );

  const amount =
    principal *
    Math.pow(
      1 + rate / 100,
      time
    );

  return {
    interest: amount - principal,
    amount
  };
}

export function calculateDiscount(
  price: number,
  discount: number
) {
  validateNonNegative(
    price,
    discount
  );

  if (discount > 100) {
    throw new Error(
      "Discount percentage must be between 0 and 100."
    );
  }

  const discountAmount =
    (price * discount) / 100;

  return {
    discountAmount,
    finalPrice:
      price - discountAmount
  };
}

export function calculateProfitMargin(
  cost: number,
  selling: number
) {
  if (
    !Number.isFinite(cost) ||
    !Number.isFinite(selling) ||
    cost <= 0 ||
    selling <= 0
  ) {
    throw new Error(
      "Cost price and selling price must be greater than zero."
    );
  }

  const profit =
    selling - cost;

  const margin =
    (profit / selling) * 100;

  return {
    profit,
    margin
  };
}

export function calculateProfitLoss(
  cost: number,
  selling: number
) {
  if (
    !Number.isFinite(cost) ||
    !Number.isFinite(selling) ||
    cost <= 0 ||
    selling < 0
  ) {
    throw new Error(
      "Cost price must be greater than zero and selling price cannot be negative."
    );
  }

  const difference =
    selling - cost;

  const percentage =
    (Math.abs(difference) /
      cost) *
    100;

  return {
    difference,
    percentage,
    type:
      difference > 0
        ? "profit"
        : difference < 0
          ? "loss"
          : "no-profit-loss"
  };
}

export function calculateInflation(
  amount: number,
  rate: number,
  years: number
) {
  validateNonNegative(
    amount,
    rate,
    years
  );

  const futureValue =
    amount *
    Math.pow(
      1 + rate / 100,
      years
    );

  return {
    futureValue,
    increase:
      futureValue - amount
  };
}

function validateNumbers(
  ...values: number[]
) {
  if (
    values.some(
      (value) =>
        !Number.isFinite(value)
    )
  ) {
    throw new Error(
      "Please enter valid numbers."
    );
  }
}

function validateNonNegative(
  ...values: number[]
) {
  validateNumbers(...values);

  if (
    values.some(
      (value) => value < 0
    )
  ) {
    throw new Error(
      "Values cannot be negative."
    );
  }
}
