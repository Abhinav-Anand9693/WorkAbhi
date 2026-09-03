import Link from "next/link";
import Container from "@/components/layout/Container";

export default function NotFound() {
  return (
    <Container className="
      flex
      min-h-[60vh]
      flex-col
      items-center
      justify-center
      text-center
    ">

      <span className="
        text-sm
        font-semibold
        text-primary
      ">
        404
      </span>

      <h1 className="
        mt-2
        text-4xl
        font-bold
      ">
        Tool not found
      </h1>

      <p className="
        mt-4
        max-w-md
        text-muted-foreground
      ">
        The WorkAbhi tool you requested
        does not exist.
      </p>

      <Link
        href="/tools"
        className="
          mt-7
          rounded-xl
          bg-primary
          px-5 py-3
          text-sm
          font-semibold
          text-primary-foreground
        "
      >
        Explore Tools
      </Link>

    </Container>
  );
}