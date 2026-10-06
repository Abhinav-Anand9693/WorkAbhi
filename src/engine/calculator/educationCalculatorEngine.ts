import {
  assertFinite,
  roundNumber
} from "./calculatorMath";

export interface GPASubject {
  gradePoint: number;
  credits: number;
}

export function calculateGPA(
  subjects: GPASubject[]
): {
  gpa: number;
  totalCredits: number;
} {
  if (!subjects.length)
    throw new Error(
      "Please add at least one subject."
    );

  let weighted = 0;
  let credits = 0;

  for (const subject of subjects) {
    assertFinite(
      subject.gradePoint,
      subject.credits
    );

    if (
      subject.gradePoint < 0 ||
      subject.credits <= 0
    )
      throw new Error(
        "Grade points cannot be negative and credits must be greater than zero."
      );

    weighted +=
      subject.gradePoint *
      subject.credits;

    credits += subject.credits;
  }

  return {
    gpa: roundNumber(
      weighted / credits,
      2
    ),
    totalCredits: roundNumber(
      credits,
      2
    )
  };
}

export function calculateCGPA(
  semesterValues: number[]
): {
  cgpa: number;
  semesters: number;
} {
  if (!semesterValues.length)
    throw new Error(
      "Please enter at least one semester GPA."
    );

  assertFinite(...semesterValues);

  if (
    semesterValues.some(
      (value) => value < 0
    )
  )
    throw new Error(
      "GPA cannot be negative."
    );

  return {
    cgpa: roundNumber(
      semesterValues.reduce(
        (sum, value) =>
          sum + value,
        0
      ) / semesterValues.length,
      2
    ),
    semesters:
      semesterValues.length
  };
}