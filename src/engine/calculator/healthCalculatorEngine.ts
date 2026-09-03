export function calculateBMI(
  weightKg: number,
  heightCm: number
) {
  if (
    !Number.isFinite(weightKg) ||
    !Number.isFinite(heightCm) ||
    weightKg <= 0 ||
    heightCm <= 0
  ) {
    throw new Error(
      "Weight and height must be greater than zero."
    );
  }

  const heightMeters =
    heightCm / 100;

  const bmi =
    weightKg /
    Math.pow(
      heightMeters,
      2
    );

  let category =
    "Normal";

  if (bmi < 18.5) {
    category = "Underweight";
  } else if (bmi >= 25 && bmi < 30) {
    category = "Overweight";
  } else if (bmi >= 30) {
    category = "Obesity";
  }

  return {
    bmi,
    category
  };
}

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female"
) {
  if (
    weightKg <= 0 ||
    heightCm <= 0 ||
    age <= 0
  ) {
    throw new Error(
      "Please enter valid health values."
    );
  }

  const base =
    10 * weightKg +
    6.25 * heightCm -
    5 * age;

  const bmr =
    gender === "male"
      ? base + 5
      : base - 161;

  return {
    bmr
  };
}

export function calculateCalories(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female",
  activityMultiplier: number
) {
  const {
    bmr
  } = calculateBMR(
    weightKg,
    heightCm,
    age,
    gender
  );

  if (
    !Number.isFinite(
      activityMultiplier
    ) ||
    activityMultiplier <= 0
  ) {
    throw new Error(
      "Please select a valid activity level."
    );
  }

  return {
    bmr,
    maintenanceCalories:
      bmr *
      activityMultiplier
  };
}