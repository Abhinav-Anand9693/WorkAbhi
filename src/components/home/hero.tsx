import Link from "next/link";
import Container from "@/components/layout/Container";

export default function Hero() {
  return (
    <section className="
      relative
      overflow-hidden
      border-b
      border-border
    ">

      <div className="
        absolute inset-0
        -z-10
        bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.14),transparent_40%)]
      " />

      <Container className="
        py-24
        text-center
        sm:py-32
      ">

        <div className="
          mx-auto
          max-w-4xl
        ">

          <div className="
            inline-flex
            rounded-full
            border border-border
            bg-background
            px-4 py-2
            text-xs
            font-medium
            text-muted-foreground
            shadow-sm
          ">
            Free tools • No signup required
          </div>

          <h1 className="
            mt-7
            text-5xl
            font-bold
            tracking-tight
            sm:text-6xl
            lg:text-7xl
          ">
            Get more done.
            <br />
            <span className="text-primary">
              With WorkAbhi.
            </span>
          </h1>

          <p className="
            mx-auto
            mt-7
            max-w-2xl
            text-base
            leading-7
            text-muted-foreground
            sm:text-lg
          ">
            Fast, simple tools for calculations,
            images, PDFs, text, developer tasks
            and everyday work — all in one place.
          </p>

          <div className="
            mx-auto
            mt-9
            flex
            max-w-lg
            flex-col
            gap-3
            sm:flex-row
            sm:justify-center
          ">

            <Link
              href="/tools"
              className="
                rounded-2xl
                bg-primary
                px-6 py-4
                text-sm
                font-semibold
                text-primary-foreground
                shadow-lg
                hover:opacity-90
              "
            >
              Explore Free Tools
            </Link>

            <Link
              href="/tools/calculator"
              className="
                rounded-2xl
                border border-border
                bg-background
                px-6 py-4
                text-sm
                font-semibold
                hover:bg-muted
              "
            >
              Try a Calculator
            </Link>

          </div>

        </div>

      </Container>

    </section>
  );
}