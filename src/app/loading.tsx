import Container from "@/components/layout/Container";

export default function Loading() {
  return (
    <Container className="
      flex
      min-h-[50vh]
      items-center
      justify-center
    ">
      <p className="
        text-sm
        text-muted-foreground
      ">
        Loading WorkAbhi...
      </p>
    </Container>
  );
}