"use client";

import { useMemo, useState } from "react";

import {
  calculatorDefinitions
} from "@/config/calculators";

import {
  calculateEMI
} from "@/engine/calculator/financialCalculatorEngine";

import {
  calculateSIP,
  calculateLumpsum,
  calculateSWP,
  calculatePPF,
  calculateNPS
} from "@/engine/calculator/investmentCalculatorEngine";

import {
  calculateFD,
  calculateRD
} from "@/engine/calculator/depositCalculatorEngine";

import {
  calculateGST,
  calculateIncomeTax,
  calculateSalary
} from "@/engine/calculator/taxCalculatorEngine";

import {
  calculatePercentage,
  calculatePercentageIncrease,
  calculatePercentageDecrease,
  calculateSimpleInterest,
  calculateCompoundInterest,
  calculateDiscount,
  calculateProfitMargin,
  calculateProfitLoss,
  calculateInflation
} from "@/engine/calculator/basicCalculatorEngine";

import {
  calculateAge,
  calculateDateDifference,
  calculateTimeDuration
} from "@/engine/calculator/dateCalculatorEngine";

import {
  calculateBMI,
  calculateBMR,
  calculateCalories
} from "@/engine/calculator/healthCalculatorEngine";

import {
  calculateGPA,
  calculateCGPA
} from "@/engine/calculator/educationCalculatorEngine";

interface Props {
  toolId: string;
}

type Values = Record<
  string,
  string
>;

type ResultValue =
  | string
  | number;

type Result = Record<
  string,
  ResultValue
>;

export default function CalculatorTool({
  toolId
}: Props) {
  const definition =
    useMemo(
      () =>
        calculatorDefinitions.find(
          (calculator) =>
            calculator.toolId ===
            toolId
        ),
      [toolId]
    );

  const [values, setValues] =
    useState<Values>({});

  const [result, setResult] =
    useState<Result | null>(
      null
    );

  const [error, setError] =
    useState("");

  if (!definition) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8">
        Calculator configuration not found.
      </div>
    );
  }

  function update(
    fieldId: string,
    value: string
  ) {
    setValues(
      (current) => ({
        ...current,
        [fieldId]: value
      })
    );
  }

  function number(
    fieldId: string
  ) {
    const value =
      Number(values[fieldId]);

    if (
      !Number.isFinite(value)
    ) {
      throw new Error(
        `Please enter a valid value for ${fieldId}.`
      );
    }

    return value;
  }

  function calculate() {
    try {
      setError("");
      setResult(null);

      let output: Result;

      switch (toolId) {

        case "emi-calculator":
        case "loan-calculator":
        case "home-loan-calculator":
        case "car-loan-calculator":
        case "personal-loan-calculator":
        case "education-loan-calculator": {
          output =
            calculateEMI(
              number("principal"),
              number("rate"),
              number("months")
            );

          break;
        }

        case "sip-calculator": {
          output =
            calculateSIP(
              number(
                "monthlyInvestment"
              ),
              number("rate"),
              number("years")
            );

          break;
        }

        case "lumpsum-calculator":
        case "mutual-fund-return-calculator": {
          output =
            calculateLumpsum(
              number("principal"),
              number("rate"),
              number("years")
            );

          break;
        }

        case "swp-calculator": {
          output =
            calculateSWP(
              number("principal"),
              number("withdrawal"),
              number("rate"),
              number("years")
            );

          break;
        }

        case "ppf-calculator": {
          output =
            calculatePPF(
              number("annualDeposit"),
              number("rate"),
              number("years")
            );

          break;
        }

        case "nps-calculator": {
          output =
            calculateNPS(
              number(
                "monthlyInvestment"
              ),
              number("rate"),
              number("years")
            );

          break;
        }

        case "fd-calculator": {
          output =
            calculateFD(
              number("principal"),
              number("rate"),
              number("years"),
              Number(
                values.frequency ?? "4"
              )
            );

          break;
        }

        case "rd-calculator": {
          output =
            calculateRD(
              number(
                "monthlyDeposit"
              ),
              number("rate"),
              number("months")
            );

          break;
        }

        case "gst-calculator": {
          output =
            calculateGST(
              number("amount"),
              number("rate"),
              (values.mode ??
                "exclusive") as
                | "exclusive"
                | "inclusive"
            );

          break;
        }

        case "income-tax-calculator": {
          output =
            calculateIncomeTax(
              number("income"),
              number("deductions")
            );

          break;
        }

        case "salary-calculator": {
          output =
            calculateSalary(
              number("ctc"),
              number("deductions")
            );

          break;
        }

        case "percentage-calculator": {
          output = {
            result:
              calculatePercentage(
                number("value"),
                number("percentage")
              )
          };

          break;
        }

        case "percentage-increase-calculator": {
          output = {
            percentageIncrease:
              calculatePercentageIncrease(
                number("oldValue"),
                number("newValue")
              )
          };

          break;
        }

        case "percentage-decrease-calculator": {
          output = {
            percentageDecrease:
              calculatePercentageDecrease(
                number("oldValue"),
                number("newValue")
              )
          };

          break;
        }

        case "simple-interest-calculator": {
          output =
            calculateSimpleInterest(
              number("principal"),
              number("rate"),
              number("time")
            );

          break;
        }

        case "compound-interest-calculator": {
          output =
            calculateCompoundInterest(
              number("principal"),
              number("rate"),
              number("time")
            );

          break;
        }

        case "discount-calculator": {
          output =
            calculateDiscount(
              number("price"),
              number("discount")
            );

          break;
        }

        case "profit-margin-calculator": {
          output =
            calculateProfitMargin(
              number("cost"),
              number("selling")
            );

          break;
        }

        case "profit-loss-calculator": {
          output =
            calculateProfitLoss(
              number("cost"),
              number("selling")
            );

          break;
        }

        case "inflation-calculator": {
          output =
            calculateInflation(
              number("amount"),
              number("rate"),
              number("years")
            );

          break;
        }

        case "age-calculator": {
          output =
            calculateAge(
              values.birthDate ?? "",
              values.targetDate ??
                ""
            );

          break;
        }

        case "date-difference-calculator": {
          output =
            calculateDateDifference(
              values.startDate ?? "",
              values.endDate ?? ""
            );

          break;
        }

        case "time-duration-calculator": {
          output =
            calculateTimeDuration(
              number("startTime"),
              number("endTime")
            );

          break;
        }

        case "bmi-calculator": {
          output =
            calculateBMI(
              number("weight"),
              number("height")
            );

          break;
        }

        case "bmr-calculator": {
          output =
            calculateBMR(
              number("weight"),
              number("height"),
              number("age"),
              (values.gender ??
                "male") as
                | "male"
                | "female"
            );

          break;
        }

        case "calorie-calculator": {
          output =
            calculateCalories(
              number("weight"),
              number("height"),
              number("age"),
              (values.gender ??
                "male") as
                | "male"
                | "female",
              number("activity")
            );

          break;
        }

        case "gpa-calculator": {
          output =
            calculateGPA(
              number("gradePoints"),
              number("credits")
            );

          break;
        }

        case "cgpa-calculator": {
          output =
            calculateCGPA([
              number("semester1"),
              number("semester2"),
              number("semester3"),
              number("semester4")
            ]);

          break;
        }

        default:
          throw new Error(
            "This calculator is not available yet."
          );
      }

      setResult(output);

    } catch (calculationError) {
      setResult(null);

      setError(
        calculationError instanceof Error
          ? calculationError.message
          : "Unable to calculate the result."
      );
    }
  }

  function reset() {
    setValues({});
    setResult(null);
    setError("");
  }

  function formatValue(
    key: string,
    value: ResultValue
  ) {
    if (
      typeof value ===
      "number"
    ) {
      const moneyKeys = [
        "monthlyEMI",
        "totalInterest",
        "totalPayment",
        "principal",
        "interest",
        "amount",
        "maturity",
        "invested",
        "returns",
        "futureValue",
        "increase",
        "discountAmount",
        "finalPrice",
        "profit",
        "annualCTC",
        "annualDeductions",
        "annualTakeHome",
        "monthlyTakeHome",
        "baseAmount",
        "gst",
        "total"
      ];

      if (
        moneyKeys.includes(key)
      ) {
        return `₹${value.toLocaleString(
          "en-IN",
          {
            maximumFractionDigits: 2
          }
        )}`;
      }

      return value.toLocaleString(
        "en-IN",
        {
          maximumFractionDigits: 2
        }
      );
    }

    return value;
  }

  return (
    <div className="
      grid
      gap-6
      lg:grid-cols-[1fr_0.8fr]
    ">

      <section className="
        rounded-2xl
        border border-border
        bg-card
        p-5
        shadow-sm
        sm:p-7
      ">

        <div className="space-y-5">

          {definition.fields.map(
            (field) => {

              const value =
                values[field.id] ??
                "";

              return (
                <label
                  key={field.id}
                  className="block"
                >

                  <span className="
                    mb-2
                    block
                    text-sm
                    font-medium
                  ">
                    {field.label}
                  </span>

                  {field.type ===
                    "select" ? (

                    <select
                      value={value}
                      onChange={(event) =>
                        update(
                          field.id,
                          event.target.value
                        )
                      }
                      className="
                        w-full
                        rounded-xl
                        border
                        border-border
                        bg-background
                        px-4
                        py-3
                        text-sm
                        outline-none
                        focus:border-primary
                        focus:ring-4
                        focus:ring-primary/10
                      "
                    >

                      <option value="">
                        Select an option
                      </option>

                      {field.options?.map(
                        (option) => (
                          <option
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {option.label}
                          </option>
                        )
                      )}

                    </select>

                  ) : (

                    <div className="relative">

                      <input
                        type={
                          field.type
                        }
                        value={value}
                        placeholder={
                          field.placeholder
                        }
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        onChange={(event) =>
                          update(
                            field.id,
                            event.target.value
                          )
                        }
                        className="
                          w-full
                          rounded-xl
                          border
                          border-border
                          bg-background
                          px-4
                          py-3
                          text-sm
                          outline-none
                          focus:border-primary
                          focus:ring-4
                          focus:ring-primary/10
                        "
                      />

                      {field.suffix && (
                        <span className="
                          pointer-events-none
                          absolute
                          right-4
                          top-1/2
                          -translate-y-1/2
                          text-xs
                          text-muted-foreground
                        ">
                          {field.suffix}
                        </span>
                      )}

                    </div>

                  )}

                </label>
              );
            }
          )}

          {error && (
            <div
              role="alert"
              className="
                rounded-xl
                border
                border-red-200
                bg-red-50
                p-4
                text-sm
                text-red-700
              "
            >
              {error}
            </div>
          )}

          <div className="
            flex
            flex-col
            gap-3
            sm:flex-row
          ">

            <button
              type="button"
              onClick={calculate}
              className="
                rounded-xl
                bg-primary
                px-5
                py-3
                text-sm
                font-semibold
                text-primary-foreground
                hover:opacity-90
              "
            >
              Calculate
            </button>

            <button
              type="button"
              onClick={reset}
              className="
                rounded-xl
                border
                border-border
                px-5
                py-3
                text-sm
                font-semibold
                hover:bg-muted
              "
            >
              Reset
            </button>

          </div>

        </div>

      </section>

      <section className="
        rounded-2xl
        border border-border
        bg-card
        p-5
        shadow-sm
        sm:p-7
      ">

        <h2 className="
          text-lg
          font-semibold
        ">
          Calculation Result
        </h2>

        {!result && (
          <p className="
            mt-4
            text-sm
            leading-6
            text-muted-foreground
          ">
            Enter your values and click
            Calculate to see your result.
          </p>
        )}

        {result && (
          <div className="
            mt-5
            grid
            gap-3
          ">

            {Object.entries(
              result
            ).map(
              ([key, value]) => (
                <div
                  key={key}
                  className="
                    rounded-xl
                    border
                    border-border
                    bg-muted/30
                    p-4
                  "
                >

                  <p className="
                    text-xs
                    capitalize
                    text-muted-foreground
                  ">
                    {key
                      .replace(
                        /([A-Z])/g,
                        " $1"
                      )
                      .trim()}
                  </p>

                  <p className="
                    mt-1
                    text-xl
                    font-bold
                  ">
                    {formatValue(
                      key,
                      value
                    )}
                  </p>

                </div>
              )
            )}

          </div>
        )}

      </section>

    </div>
  );
}