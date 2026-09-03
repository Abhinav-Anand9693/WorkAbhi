import Container from "@/components/layout/Container";

const steps = [
  [
    "01",
    "Choose a tool",
    "Find the tool you need from the directory."
  ],
  [
    "02",
    "Add your input",
    "Enter information or upload a supported file."
  ],
  [
    "03",
    "Process",
    "WorkAbhi runs the appropriate tool engine."
  ],
  [
    "04",
    "Get your result",
    "Review, copy or download your result."
  ]
];

export default function HowItWorks() {
  return (
    <section className="py-20">

      <Container>

        <div className="mx-auto max-w-2xl text-center">

          <p className="
            text-sm
            font-semibold
            text-primary
          ">
            HOW IT WORKS
          </p>

          <h2 className="
            mt-2
            text-3xl
            font-bold
          ">
            Simple from start to finish.
          </h2>

        </div>

        <div className="
          mt-10
          grid
          gap-4
          md:grid-cols-4
        ">

          {steps.map(
            ([number, title, text]) => (
              <article
                key={number}
                className="
                  rounded-2xl
                  border border-border
                  p-6
                "
              >

                <span className="
                  text-sm
                  font-bold
                  text-primary
                ">
                  {number}
                </span>

                <h3 className="
                  mt-4
                  font-semibold
                ">
                  {title}
                </h3>

                <p className="
                  mt-2
                  text-sm
                  leading-6
                  text-muted-foreground
                ">
                  {text}
                </p>

              </article>
            )
          )}

        </div>

      </Container>

    </section>
  );
}