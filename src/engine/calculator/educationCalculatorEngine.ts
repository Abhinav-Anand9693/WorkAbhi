export function calculateGPA(
  gradePoints: number,
  credits: number
) {
  if (
    !Number.isFinite(gradePoints) ||
    !Number.isFinite(credits) ||
    gradePoints < 0 ||
    credits <= 0
  ) {
    throw new Error(
      "Please enter valid GPA values."
    );
  }

  return {
    gpa: gradePoints
  };
}

export function calculateCGPA(
  semesterValues: number[]
) {
  const values =
    semesterValues.filter(
      (value) =>
        Number.isFinite(value)
    );

  if (!values.length) {
    throw new Error(
      "Please enter at least one semester GPA."
    );
  }

  if (
    values.some(
      (value) => value < 0
    )
  ) {
    throw new Error(
      "GPA cannot be negative."
    );
  }

  const total =
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    );

  return {
    cgpa:
      total / values.length
  };
}