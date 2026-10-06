import type {
  CalculatorDefinition
} from "@/types/calculator";

export const calculatorDefinitions:
  CalculatorDefinition[] = [

  {
    toolId: "emi-calculator",
    title: "EMI Calculator",
    description:
      "Calculate monthly EMI, total interest and total loan payment.",
    engine: "financial",
    fields: [
      {
        id: "principal",
        label: "Loan Amount",
        type: "number",
        placeholder: "1000000",
        min: 1,
        suffix: "₹"
      },
      {
        id: "rate",
        label: "Annual Interest Rate",
        type: "number",
        placeholder: "8.5",
        min: 0,
        step: 0.01,
        suffix: "%"
      },
      {
        id: "months",
        label: "Loan Tenure",
        type: "number",
        placeholder: "60",
        min: 1,
        suffix: "months"
      }
    ]
  },

  {
    toolId: "loan-calculator",
    title: "Loan Calculator",
    description:
      "Estimate your monthly loan payment and total repayment.",
    engine: "financial",
    fields: [
      {
        id: "principal",
        label: "Loan Amount",
        type: "number",
        placeholder: "500000",
        min: 1,
        suffix: "₹"
      },
      {
        id: "rate",
        label: "Annual Interest Rate",
        type: "number",
        placeholder: "9",
        min: 0,
        step: 0.01,
        suffix: "%"
      },
      {
        id: "months",
        label: "Loan Tenure",
        type: "number",
        placeholder: "60",
        min: 1,
        suffix: "months"
      }
    ]
  },

  {
    toolId: "home-loan-calculator",
    title: "Home Loan Calculator",
    description:
      "Calculate your home loan EMI and total repayment.",
    engine: "financial",
    fields: [
      {
        id: "principal",
        label: "Home Loan Amount",
        type: "number",
        placeholder: "3000000",
        min: 1,
        suffix: "₹"
      },
      {
        id: "rate",
        label: "Interest Rate",
        type: "number",
        placeholder: "8.5",
        min: 0,
        step: 0.01,
        suffix: "%"
      },
      {
        id: "months",
        label: "Tenure",
        type: "number",
        placeholder: "240",
        min: 1,
        suffix: "months"
      }
    ]
  },

  {
    toolId: "car-loan-calculator",
    title: "Car Loan Calculator",
    description:
      "Calculate your car loan EMI and repayment.",
    engine: "financial",
    fields: [
      {
        id: "principal",
        label: "Car Loan Amount",
        type: "number",
        placeholder: "800000",
        min: 1,
        suffix: "₹"
      },
      {
        id: "rate",
        label: "Interest Rate",
        type: "number",
        placeholder: "9",
        min: 0,
        step: 0.01,
        suffix: "%"
      },
      {
        id: "months",
        label: "Tenure",
        type: "number",
        placeholder: "60",
        min: 1,
        suffix: "months"
      }
    ]
  },

  {
    toolId: "personal-loan-calculator",
    title: "Personal Loan Calculator",
    description:
      "Calculate personal loan EMI, interest and repayment.",
    engine: "financial",
    fields: [
      {
        id: "principal",
        label: "Loan Amount",
        type: "number",
        placeholder: "500000",
        min: 1,
        suffix: "₹"
      },
      {
        id: "rate",
        label: "Interest Rate",
        type: "number",
        placeholder: "12",
        min: 0,
        step: 0.01,
        suffix: "%"
      },
      {
        id: "months",
        label: "Tenure",
        type: "number",
        placeholder: "36",
        min: 1,
        suffix: "months"
      }
    ]
  },

  {
    toolId: "education-loan-calculator",
    title: "Education Loan Calculator",
    description:
      "Estimate education loan EMI and repayment.",
    engine: "financial",
    fields: [
      {
        id: "principal",
        label: "Loan Amount",
        type: "number",
        placeholder: "1000000",
        min: 1,
        suffix: "₹"
      },
      {
        id: "rate",
        label: "Interest Rate",
        type: "number",
        placeholder: "8",
        min: 0,
        step: 0.01,
        suffix: "%"
      },
      {
        id: "months",
        label: "Repayment Tenure",
        type: "number",
        placeholder: "120",
        min: 1,
        suffix: "months"
      }
    ]
  },

  {
    toolId: "sip-calculator",
    title: "SIP Calculator",
    description:
      "Estimate SIP maturity value and total investment.",
    engine: "investment",
    fields: [
      {
        id: "monthlyInvestment",
        label: "Monthly Investment",
        type: "number",
        placeholder: "5000",
        min: 1,
        suffix: "₹"
      },
      {
        id: "rate",
        label: "Expected Annual Return",
        type: "number",
        placeholder: "12",
        min: 0,
        step: 0.01,
        suffix: "%"
      },
      {
        id: "years",
        label: "Investment Period",
        type: "number",
        placeholder: "10",
        min: 1,
        suffix: "years"
      }
    ]
  },

  {
    toolId: "lumpsum-calculator",
    title: "Lumpsum Calculator",
    description:
      "Calculate future value of a lumpsum investment.",
    engine: "investment",
    fields: [
      {
        id: "principal",
        label: "Investment Amount",
        type: "number",
        placeholder: "100000",
        min: 1,
        suffix: "₹"
      },
      {
        id: "rate",
        label: "Expected Annual Return",
        type: "number",
        placeholder: "12",
        min: 0,
        step: 0.01,
        suffix: "%"
      },
      {
        id: "years",
        label: "Investment Period",
        type: "number",
        placeholder: "10",
        min: 1,
        suffix: "years"
      }
    ]
  },

  {
    toolId: "swp-calculator",
    title: "SWP Calculator",
    description:
      "Estimate withdrawals and remaining investment value.",
    engine: "investment",
    fields: [
      {
        id: "principal",
        label: "Initial Investment",
        type: "number",
        placeholder: "1000000",
        min: 1,
        suffix: "₹"
      },
      {
        id: "withdrawal",
        label: "Monthly Withdrawal",
        type: "number",
        placeholder: "10000",
        min: 1,
        suffix: "₹"
      },
      {
        id: "rate",
        label: "Expected Annual Return",
        type: "number",
        placeholder: "10",
        min: 0,
        step: 0.01,
        suffix: "%"
      },
      {
        id: "years",
        label: "Period",
        type: "number",
        placeholder: "10",
        min: 1,
        suffix: "years"
      }
    ]
  },

  {
    toolId: "mutual-fund-return-calculator",
    title: "Mutual Fund Return Calculator",
    description:
      "Estimate mutual fund investment returns.",
    engine: "investment",
    fields: [
      {
        id: "principal",
        label: "Investment Amount",
        type: "number",
        placeholder: "100000",
        min: 1,
        suffix: "₹"
      },
      {
        id: "rate",
        label: "Expected Annual Return",
        type: "number",
        placeholder: "12",
        min: 0,
        step: 0.01,
        suffix: "%"
      },
      {
        id: "years",
        label: "Investment Period",
        type: "number",
        placeholder: "5",
        min: 1,
        suffix: "years"
      }
    ]
  },

  {
    toolId: "fd-calculator",
    title: "FD Calculator",
    description:
      "Calculate fixed deposit maturity amount and interest.",
    engine: "deposit",
    fields: [
      {
        id: "principal",
        label: "Deposit Amount",
        type: "number",
        placeholder: "100000",
        min: 1,
        suffix: "₹"
      },
      {
        id: "rate",
        label: "Interest Rate",
        type: "number",
        placeholder: "7",
        min: 0,
        step: 0.01,
        suffix: "%"
      },
      {
        id: "years",
        label: "Tenure",
        type: "number",
        placeholder: "5",
        min: 1,
        suffix: "years"
      },
      {
        id: "frequency",
        label: "Compounding Frequency",
        type: "select",
        options: [
          {
            label: "Quarterly",
            value: "4"
          },
          {
            label: "Monthly",
            value: "12"
          },
          {
            label: "Half Yearly",
            value: "2"
          },
          {
            label: "Yearly",
            value: "1"
          }
        ]
      }
    ]
  },

  {
    toolId: "rd-calculator",
    title: "RD Calculator",
    description:
      "Calculate recurring deposit maturity amount.",
    engine: "deposit",
    fields: [
      {
        id: "monthlyDeposit",
        label: "Monthly Deposit",
        type: "number",
        placeholder: "5000",
        min: 1,
        suffix: "₹"
      },
      {
        id: "rate",
        label: "Annual Interest Rate",
        type: "number",
        placeholder: "7",
        min: 0,
        step: 0.01,
        suffix: "%"
      },
      {
        id: "months",
        label: "Tenure",
        type: "number",
        placeholder: "60",
        min: 1,
        suffix: "months"
      }
    ]
  },

  {
    toolId: "ppf-calculator",
    title: "PPF Calculator",
    description:
      "Estimate PPF maturity value and interest.",
    engine: "investment",
    fields: [
      {
        id: "annualDeposit",
        label: "Annual Deposit",
        type: "number",
        placeholder: "150000",
        min: 1,
        suffix: "₹"
      },
      {
        id: "rate",
        label: "Annual Interest Rate",
        type: "number",
        placeholder: "7.1",
        min: 0,
        step: 0.01,
        suffix: "%"
      },
      {
        id: "years",
        label: "Investment Period",
        type: "number",
        placeholder: "15",
        min: 1,
        suffix: "years"
      }
    ]
  },

  {
    toolId: "nps-calculator",
    title: "NPS Calculator",
    description:
      "Estimate NPS corpus based on monthly contributions.",
    engine: "investment",
    fields: [
      {
        id: "monthlyInvestment",
        label: "Monthly Contribution",
        type: "number",
        placeholder: "5000",
        min: 1,
        suffix: "₹"
      },
      {
        id: "rate",
        label: "Expected Annual Return",
        type: "number",
        placeholder: "10",
        min: 0,
        step: 0.01,
        suffix: "%"
      },
      {
        id: "years",
        label: "Investment Period",
        type: "number",
        placeholder: "25",
        min: 1,
        suffix: "years"
      }
    ]
  },

  {
    toolId: "gst-calculator",
    title: "GST Calculator",
    description:
      "Calculate GST amount, inclusive price and exclusive price.",
    engine: "tax",
    fields: [
      {
        id: "amount",
        label: "Amount",
        type: "number",
        placeholder: "10000",
        min: 0,
        suffix: "₹"
      },
      {
        id: "rate",
        label: "GST Rate",
        type: "number",
        placeholder: "18",
        min: 0,
        step: 0.01,
        suffix: "%"
      },
      {
        id: "mode",
        label: "Amount Type",
        type: "select",
        options: [
          {
            label: "Add GST",
            value: "exclusive"
          },
          {
            label: "Remove GST",
            value: "inclusive"
          }
        ]
      }
    ]
  },

  {
    toolId: "income-tax-calculator",
    title: "Income Tax Calculator",
    description:
      "Estimate income tax using a simplified slab-based calculation.",
    engine: "tax",
    fields: [
      {
        id: "income",
        label: "Annual Income",
        type: "number",
        placeholder: "1000000",
        min: 0,
        suffix: "₹"
      },
      {
        id: "deductions",
        label: "Deductions",
        type: "number",
        placeholder: "100000",
        min: 0,
        suffix: "₹"
      }
    ]
  },

  {
    toolId: "salary-calculator",
    title: "Salary Calculator",
    description:
      "Estimate monthly take-home salary from annual CTC.",
    engine: "tax",
    fields: [
      {
        id: "ctc",
        label: "Annual CTC",
        type: "number",
        placeholder: "1200000",
        min: 0,
        suffix: "₹"
      },
      {
        id: "deductions",
        label: "Annual Deductions",
        type: "number",
        placeholder: "50000",
        min: 0,
        suffix: "₹"
      }
    ]
  },

  {
    toolId: "percentage-calculator",
    title: "Percentage Calculator",
    description:
      "Calculate a percentage of a number.",
    engine: "basic",
    fields: [
      {
        id: "value",
        label: "Value",
        type: "number",
        placeholder: "1000"
      },
      {
        id: "percentage",
        label: "Percentage",
        type: "number",
        placeholder: "10",
        suffix: "%"
      }
    ]
  },

  {
    toolId: "percentage-increase-calculator",
    title: "Percentage Increase Calculator",
    description:
      "Calculate percentage increase between two values.",
    engine: "basic",
    fields: [
      {
        id: "oldValue",
        label: "Original Value",
        type: "number",
        placeholder: "100"
      },
      {
        id: "newValue",
        label: "New Value",
        type: "number",
        placeholder: "125"
      }
    ]
  },

  {
    toolId: "percentage-decrease-calculator",
    title: "Percentage Decrease Calculator",
    description:
      "Calculate percentage decrease between two values.",
    engine: "basic",
    fields: [
      {
        id: "oldValue",
        label: "Original Value",
        type: "number",
        placeholder: "100"
      },
      {
        id: "newValue",
        label: "New Value",
        type: "number",
        placeholder: "75"
      }
    ]
  },

  {
    toolId: "simple-interest-calculator",
    title: "Simple Interest Calculator",
    description:
      "Calculate simple interest and total amount.",
    engine: "basic",
    fields: [
      {
        id: "principal",
        label: "Principal",
        type: "number",
        placeholder: "100000",
        suffix: "₹"
      },
      {
        id: "rate",
        label: "Interest Rate",
        type: "number",
        placeholder: "8",
        suffix: "%"
      },
      {
        id: "time",
        label: "Time",
        type: "number",
        placeholder: "5",
        suffix: "years"
      }
    ]
  },

  {
    toolId: "compound-interest-calculator",
    title: "Compound Interest Calculator",
    description:
      "Calculate compound interest and total amount.",
    engine: "basic",
    fields: [
      {
        id: "principal",
        label: "Principal",
        type: "number",
        placeholder: "100000",
        suffix: "₹"
      },
      {
        id: "rate",
        label: "Interest Rate",
        type: "number",
        placeholder: "8",
        suffix: "%"
      },
      {
        id: "time",
        label: "Time",
        type: "number",
        placeholder: "5",
        suffix: "years"
      }
    ]
  },

  {
    toolId: "discount-calculator",
    title: "Discount Calculator",
    description:
      "Calculate discount amount and final selling price.",
    engine: "basic",
    fields: [
      {
        id: "price",
        label: "Original Price",
        type: "number",
        placeholder: "5000",
        suffix: "₹"
      },
      {
        id: "discount",
        label: "Discount",
        type: "number",
        placeholder: "20",
        suffix: "%"
      }
    ]
  },

  {
    toolId: "profit-margin-calculator",
    title: "Profit Margin Calculator",
    description:
      "Calculate profit margin from cost and selling price.",
    engine: "basic",
    fields: [
      {
        id: "cost",
        label: "Cost Price",
        type: "number",
        placeholder: "1000",
        suffix: "₹"
      },
      {
        id: "selling",
        label: "Selling Price",
        type: "number",
        placeholder: "1500",
        suffix: "₹"
      }
    ]
  },

  {
    toolId: "profit-loss-calculator",
    title: "Profit & Loss Calculator",
    description:
      "Calculate profit, loss and percentage.",
    engine: "basic",
    fields: [
      {
        id: "cost",
        label: "Cost Price",
        type: "number",
        placeholder: "1000",
        suffix: "₹"
      },
      {
        id: "selling",
        label: "Selling Price",
        type: "number",
        placeholder: "1200",
        suffix: "₹"
      }
    ]
  },

  {
    toolId: "inflation-calculator",
    title: "Inflation Calculator",
    description:
      "Estimate the future value of money after inflation.",
    engine: "basic",
    fields: [
      {
        id: "amount",
        label: "Current Amount",
        type: "number",
        placeholder: "100000",
        suffix: "₹"
      },
      {
        id: "rate",
        label: "Inflation Rate",
        type: "number",
        placeholder: "6",
        suffix: "%"
      },
      {
        id: "years",
        label: "Years",
        type: "number",
        placeholder: "10",
        suffix: "years"
      }
    ]
  },

  {
    toolId: "age-calculator",
    title: "Age Calculator",
    description:
      "Calculate age from date of birth.",
    engine: "date",
    fields: [
      {
        id: "birthDate",
        label: "Date of Birth",
        type: "date"
      },
      {
        id: "targetDate",
        label: "Calculate Age On",
        type: "date"
      }
    ]
  },

  {
    toolId: "date-difference-calculator",
    title: "Date Difference Calculator",
    description:
      "Calculate the difference between two dates.",
    engine: "date",
    fields: [
      {
        id: "startDate",
        label: "Start Date",
        type: "date"
      },
      {
        id: "endDate",
        label: "End Date",
        type: "date"
      }
    ]
  },

  {
    toolId: "time-duration-calculator",
    title: "Time Duration Calculator",
    description:
      "Calculate the duration between two times.",
    engine: "date",
    fields: [
      {
        id: "startTime",
        label: "Start Time",
        type: "number",
        placeholder: "9.5",
        suffix: "hours"
      },
      {
        id: "endTime",
        label: "End Time",
        type: "number",
        placeholder: "17.5",
        suffix: "hours"
      }
    ]
  },

  {
    toolId: "bmi-calculator",
    title: "BMI Calculator",
    description:
      "Calculate body mass index from height and weight.",
    engine: "health",
    fields: [
      {
        id: "weight",
        label: "Weight",
        type: "number",
        placeholder: "70",
        min: 1,
        suffix: "kg"
      },
      {
        id: "height",
        label: "Height",
        type: "number",
        placeholder: "175",
        min: 1,
        suffix: "cm"
      }
    ]
  },

  {
    toolId: "bmr-calculator",
    title: "BMR Calculator",
    description:
      "Calculate basal metabolic rate.",
    engine: "health",
    fields: [
      {
        id: "weight",
        label: "Weight",
        type: "number",
        placeholder: "70",
        min: 1,
        suffix: "kg"
      },
      {
        id: "height",
        label: "Height",
        type: "number",
        placeholder: "175",
        min: 1,
        suffix: "cm"
      },
      {
        id: "age",
        label: "Age",
        type: "number",
        placeholder: "25",
        min: 1,
        suffix: "years"
      },
      {
        id: "gender",
        label: "Gender",
        type: "select",
        options: [
          {
            label: "Male",
            value: "male"
          },
          {
            label: "Female",
            value: "female"
          }
        ]
      }
    ]
  },

  {
    toolId: "calorie-calculator",
    title: "Calorie Calculator",
    description:
      "Estimate daily calorie needs using BMR and activity level.",
    engine: "health",
    fields: [
      {
        id: "weight",
        label: "Weight",
        type: "number",
        placeholder: "70",
        suffix: "kg"
      },
      {
        id: "height",
        label: "Height",
        type: "number",
        placeholder: "175",
        suffix: "cm"
      },
      {
        id: "age",
        label: "Age",
        type: "number",
        placeholder: "25",
        suffix: "years"
      },
      {
        id: "gender",
        label: "Gender",
        type: "select",
        options: [
          {
            label: "Male",
            value: "male"
          },
          {
            label: "Female",
            value: "female"
          }
        ]
      },
      {
        id: "activity",
        label: "Activity Level",
        type: "select",
        options: [
          {
            label: "Sedentary",
            value: "1.2"
          },
          {
            label: "Lightly Active",
            value: "1.375"
          },
          {
            label: "Moderately Active",
            value: "1.55"
          },
          {
            label: "Very Active",
            value: "1.725"
          },
          {
            label: "Extra Active",
            value: "1.9"
          }
        ]
      }
    ]
  },

 {
  toolId: "gpa-calculator",
  title: "GPA Calculator",
  description:
    "Calculate GPA from subject grade points and credit hours.",
  engine: "education",
  fields: [
    {
      id: "gradePoint1",
      label: "Subject 1 Grade Point",
      type: "number",
      placeholder: "8.5"
    },
    {
      id: "credit1",
      label: "Subject 1 Credits",
      type: "number",
      placeholder: "4"
    },
    {
      id: "gradePoint2",
      label: "Subject 2 Grade Point",
      type: "number",
      placeholder: "9"
    },
    {
      id: "credit2",
      label: "Subject 2 Credits",
      type: "number",
      placeholder: "3"
    },
    {
      id: "gradePoint3",
      label: "Subject 3 Grade Point",
      type: "number",
      placeholder: "8"
    },
    {
      id: "credit3",
      label: "Subject 3 Credits",
      type: "number",
      placeholder: "4"
    },
    {
      id: "gradePoint4",
      label: "Subject 4 Grade Point",
      type: "number",
      placeholder: "8.5"
    },
    {
      id: "credit4",
      label: "Subject 4 Credits",
      type: "number",
      placeholder: "3"
    }
  ]
},
  {
    toolId: "cgpa-calculator",
    title: "CGPA Calculator",
    description:
      "Calculate CGPA from semester GPAs.",
    engine: "education",
    fields: [
      {
        id: "semester1",
        label: "Semester 1 GPA",
        type: "number",
        placeholder: "8.2"
      },
      {
        id: "semester2",
        label: "Semester 2 GPA",
        type: "number",
        placeholder: "8.5"
      },
      {
        id: "semester3",
        label: "Semester 3 GPA",
        type: "number",
        placeholder: "8.7"
      },
      {
        id: "semester4",
        label: "Semester 4 GPA",
        type: "number",
        placeholder: "8.4"
      }
    ]
  }
];