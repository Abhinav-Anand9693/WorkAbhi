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

  // The UI supplies total weighted grade points and total credits.
  // GPA = sum(grade point × credit) / sum(credits).
  if (gradePoints > 10 * credits) {
    throw new Error(
      "Total weighted grade points cannot exceed 10 times the total credits."
    );
  }

  return {
    gpa:
      gradePoints / credits
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
      (value) =>
        value < 0 ||
        value > 10
    )
  ) {
    throw new Error(
      "Each semester GPA must be between 0 and 10."
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
