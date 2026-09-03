import Link from "next/link";
import Container from "@/components/layout/Container";

export default function FinalCTA() {
  return (
    <section className="py-20">

      <Container>

        <div className="
          rounded-3xl
          border border-border
          bg-muted/30
          px-6
          py-16
          text-center
          sm:px-12
        ">

          <h2 className="
            text-3xl
            font-bold
            tracking-tight
            sm:text-4xl
          ">
            Your next task starts here.
          </h2>

          <p className="
            mx-auto
            mt-4
            max-w-xl
            text-muted-foreground
          ">
            Explore WorkAbhi and find the
            simplest tool for your task.
          </p>

          <Link
            href="/tools"
            className="
              mt-7
              inline-flex
              rounded-2xl
              bg-primary
              px-6 py-3.5
              text-sm
              font-semibold
              text-primary-foreground
              hover:opacity-90
            "
          >
            Explore Free Tools
          </Link>

        </div>

      </Container>

    </section>
  );
}