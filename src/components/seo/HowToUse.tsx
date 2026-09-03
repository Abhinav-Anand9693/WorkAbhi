export default function HowToUse({
  steps
}: {
  steps: string[];
}) {
  return (
    <section className="mt-16">

      <h2 className="
        text-2xl
        font-bold
      ">
        How to Use
      </h2>

      <ol className="
        mt-6
        space-y-3
      ">

        {steps.map(
          (step, index) => (
            <li
              key={step}
              className="
                flex
                gap-4
                rounded-xl
                border
                border-border
                p-4
              "
            >

              <span className="
                font-semibold
                text-primary
              ">
                {index + 1}
              </span>

              <span className="
                text-sm
                leading-6
              ">
                {step}
              </span>

            </li>
          )
        )}

      </ol>

    </section>
  );
}