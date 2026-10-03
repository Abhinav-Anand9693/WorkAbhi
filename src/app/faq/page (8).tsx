import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "FAQ & Help",
  description:
    "Find answers about WorkAbhi tools, browser-side processing, accounts, file handling, supported browsers, downloads, and troubleshooting.",
  alternates: { canonical: "/faq" },
  openGraph: { title: "WorkAbhi FAQ & Help", description: "Answers to common questions about WorkAbhi tools and workflows.", type: "website", url: "/faq" },
};

const faqs = [
  ["What is WorkAbhi?", "WorkAbhi is a collection of online utilities for calculations, images, PDFs, text, developer tasks, QR codes, security utilities, colors, dates, audio, and video."],
  ["Are WorkAbhi tools free?", "The current WorkAbhi tool experience is provided without a paid checkout or subscription requirement in the application reviewed for this release."],
  ["Do I need an account?", "The current application does not implement an account or authentication flow for using the tools."],
  ["Are files processed locally?", "Many current tools are designed for browser-side processing. Processing behavior can vary by tool, so check the individual tool page and its implementation before assuming that every future operation is local."],
  ["What happens to files I select?", "The reviewed application does not implement a general file-upload storage service for the tool inputs. Browser-side tools process selected data in the browser. Keep a backup of important originals."],
  ["Which browsers are supported?", "WorkAbhi relies on modern browser APIs for several image, PDF, audio, video, and file operations. Exact support can vary by tool and device. If a feature fails, try a current desktop browser and check whether the input itself is supported."],
  ["Why is a large file taking time?", "Media and document processing can be CPU- and memory-intensive. Large files, high resolutions, long videos, and complex PDFs can require more processing time and device resources."],
  ["Why did a tool fail?", "Failures can result from an unsupported format, browser capability, file size, device memory, malformed input, or an operation-specific limitation. Try a smaller or different input and report reproducible issues to WorkAbhi."],
  ["How do I download my result?", "Where a tool produces a downloadable result, use the download control shown after processing. Some tools may instead provide a copy, generated value, or another output appropriate to the operation."],
  ["Are there file-size limits?", "The practical limit can vary by tool, browser, device memory, and operation. The current application does not advertise one universal file-size limit for every tool."],
  ["How do I request a new tool?", "Use the Contact page after the owner has configured the real support address. Include the task, expected input, expected output, and why the utility would be useful."],
  ["Does WorkAbhi use analytics or advertising?", "The reviewed application does not contain an analytics integration or advertising script. This can change in a future release, so the Privacy Policy should be updated if the data practices change."],
];

export default function FAQPage() {
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <Container className="py-10 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "FAQ", href: "/faq" }]} />
      <header className="mt-10 max-w-3xl">
        <p className="text-sm font-semibold text-primary">Help & FAQ</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Questions about WorkAbhi?</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">Here are practical answers based on the current application. Tool-specific behavior can differ, so the individual tool page remains the best place to check a particular operation.</p>
      </header>

      <div className="mt-12 max-w-4xl divide-y divide-border rounded-3xl border border-border">
        {faqs.map(([question, answer]) => (
          <details key={question} className="group p-6">
            <summary className="cursor-pointer list-none pr-8 text-base font-semibold marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              {question}
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{answer}</p>
          </details>
        ))}
      </div>

      <section className="mt-12 flex flex-wrap gap-3">
        <Link href="/tools" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Browse all tools</Link>
        <Link href="/contact" className="rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:bg-muted">Contact WorkAbhi</Link>
      </section>
    </Container>
  );
}
