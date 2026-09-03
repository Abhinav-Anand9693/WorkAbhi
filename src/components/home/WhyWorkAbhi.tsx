import Container from "@/components/layout/Container";

const benefits = [
  {
    title: "Free",
    text: "Use the platform without requiring a subscription."
  },
  {
    title: "Private",
    text: "Supported tools can process files locally in your browser."
  },
  {
    title: "Fast",
    text: "Simple tools avoid unnecessary server round trips."
  },
  {
    title: "Useful",
    text: "Tools are organized around real tasks and workflows."
  }
];

export default function WhyWorkAbhi() {
  return (
    <section className="py-20">

      <Container>

        <div className="max-w-2xl">

          <p className="
            text-sm
            font-semibold
            text-primary
          ">
            WHY WORKABHI
          </p>

          <h2 className="
            mt-2
            text-3xl
            font-bold
            tracking-tight
          ">
            One place for the tools you actually need.
          </h2>

        </div>

        <div className="
          mt-10
          grid
          gap-4
          sm:grid-cols-2
          lg:grid-cols-4
        ">

          {benefits.map((benefit) => (
            <article
              key={benefit.title}
              className="
                rounded-2xl
                border border-border
                bg-card
                p-6
              "
            >

              <h3 className="font-semibold">
                {benefit.title}
              </h3>

              <p className="
                mt-3
                text-sm
                leading-6
                text-muted-foreground
              ">
                {benefit.text}
              </p>

            </article>
          ))}

        </div>

      </Container>

    </section>
  );
}