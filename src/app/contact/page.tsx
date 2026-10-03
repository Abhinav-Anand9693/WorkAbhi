import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "Contact WorkAbhi",
  description:
    "Contact WorkAbhi about bugs, tool feedback, feature requests, general questions, and business inquiries.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact WorkAbhi", description: "How to contact WorkAbhi about tools, bugs, feedback, and business inquiries.", type: "website", url: "/contact" },
};

export default function ContactPage() {
  return (
    <Container className="py-10 sm:py-16">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Contact", href: "/contact" }]} />
      <header className="mt-10 max-w-3xl">
        <p className="text-sm font-semibold text-primary">Contact WorkAbhi</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Questions, bugs, feedback, or ideas?</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">Use the appropriate contact route below. The current codebase does not include a configured backend email or contact-form submission service, so this page does not present a form that would appear to send a message when no delivery system exists.</p>
      </header>

      <section className="mt-12 grid gap-5 md:grid-cols-2">
        {[
          ["Bug reports", "Tell us which tool you used, what input you tried, what happened, and which browser/device you were using."],
          ["Tool feedback", "Share confusing controls, missing options, output issues, or other practical improvements."],
          ["Feature requests", "Describe the task you want WorkAbhi to support and, when possible, the input and output you expect."],
          ["Business inquiries", "Use this route for partnerships, commercial questions, or other business communication."],
        ].map(([title, text]) => (
          <div key={title} className="rounded-2xl border border-border p-6">
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-3xl border border-amber-500/30 bg-amber-500/5 p-7">
        <h2 className="text-xl font-bold">Owner setup required before launch</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">No real contact address is present in the current project. Replace the placeholder below with a monitored address before publishing this page as the site&apos;s support contact.</p>
        <p className="mt-5 rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm">[CONTACT EMAIL]</p>
      </section>

      <section className="mt-12 max-w-3xl">
        <h2 className="text-2xl font-bold">What to include in a bug report</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          <li>The exact WorkAbhi tool URL.</li>
          <li>What you expected to happen.</li>
          <li>What actually happened.</li>
          <li>File type and approximate file size when a file is involved.</li>
          <li>Browser, operating system, and device details when relevant.</li>
          <li>Steps that reproduce the problem.</li>
        </ul>
      </section>
    </Container>
  );
}
