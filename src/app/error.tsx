"use client";

import Container from "@/components/layout/Container";

export default function ErrorPage({
  reset
}: {
  error: Error & {
    digest?: string;
  };

  reset: () => void;
}) {
  return (
    <Container className="
      flex
      min-h-[50vh]
      items-center
      justify-center
      text-center
    ">

      <div>

        <h1 className="
          text-3xl
          font-bold
        ">
          Something went wrong
        </h1>

        <p className="
          mt-3
          text-muted-foreground
        ">
          Please try again.
        </p>

        <button
          type="button"
          onClick={reset}
          className="
            mt-6
            rounded-xl
            bg-primary
            px-5 py-3
            text-sm
            font-semibold
            text-primary-foreground
          "
        >
          Try Again
        </button>

      </div>

    </Container>
  );
}