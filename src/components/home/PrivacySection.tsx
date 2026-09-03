import Container from "@/components/layout/Container";

export default function PrivacySection() {
  return (
    <section className="
      bg-foreground
      py-20
      text-background
    ">

      <Container>

        <div className="
          grid
          gap-8
          lg:grid-cols-2
          lg:items-center
        ">

          <div>

            <p className="
              text-sm
              font-semibold
              text-background/60
            ">
              PRIVACY FIRST
            </p>

            <h2 className="
              mt-2
              text-3xl
              font-bold
              tracking-tight
            ">
              Your data should stay yours.
            </h2>

          </div>

          <p className="
            text-base
            leading-7
            text-background/70
          ">
            WorkAbhi is designed around
            browser-first processing. Whenever
            a tool can reasonably run locally,
            processing can happen directly on
            your device instead of unnecessarily
            uploading your files.
          </p>

        </div>

      </Container>

    </section>
  );
}