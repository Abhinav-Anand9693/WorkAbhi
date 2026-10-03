import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read how WorkAbhi currently handles files, browser-side processing, cookies, analytics, advertising, contact information, and other data.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "WorkAbhi Privacy Policy", description: "How WorkAbhi currently handles data and browser-side tool processing.", type: "website", url: "/privacy" },
};

const updated = "October 3, 2026";

export default function PrivacyPage() {
  return (
    <Container className="py-10 sm:py-16">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Privacy", href: "/privacy" }]} />
      <header className="mt-10 max-w-4xl">
        <p className="text-sm font-semibold text-primary">Privacy Policy</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">How WorkAbhi currently handles your information</h1>
        <p className="mt-5 text-muted-foreground">Last updated: {updated}</p>
      </header>

      <article className="workabhi-prose mt-10 max-w-4xl">
        <p>This policy describes the current WorkAbhi application as implemented in the reviewed codebase. It is intended to be updated if the product&apos;s data practices change.</p>

        <h2>1. Information processed</h2>
        <p>WorkAbhi provides browser-based utilities. The current application code reviewed for this release does not contain an intentional analytics system, advertising script, authentication system, cookie-based preference system, localStorage usage, IndexedDB usage, or general-purpose server API used to receive tool inputs.</p>
        <p>Individual tools may inspect data that you select in your browser because that data is required to perform the requested operation. The application should be understood on a per-tool basis rather than as a promise that every future feature will always process data locally.</p>

        <h2>2. Files and user content</h2>
        <p>For supported browser-side tools, files are selected by you and processed by the application running in your browser. The reviewed code does not implement a general file-upload service for sending tool inputs to a WorkAbhi storage backend.</p>
        <p>Keep an original copy of important files before using any transformation tool. Browser processing can also be affected by device memory, browser capabilities, file size, and the operation being performed.</p>

        <h2>3. Browser/local processing</h2>
        <p>WorkAbhi is designed around browser-first processing where technically practical. This is a product architecture choice, not a guarantee that every operation or future feature will always be local. Tool pages should be considered the source of the specific processing behavior for that tool.</p>

        <h2>4. Cookies and local storage</h2>
        <p>The reviewed application does not intentionally set cookies or use localStorage or IndexedDB for the current tool experience. Your browser, hosting provider, or other infrastructure may still maintain standard technical information as part of delivering a web request.</p>

        <h2>5. Analytics</h2>
        <p>No Google Analytics, gtag, or comparable analytics integration was found in the reviewed application code. If analytics are introduced later, this policy should be updated before or when that functionality is deployed.</p>

        <h2>6. Advertising</h2>
        <p>No AdSense, ad network script, or advertising integration was found in the reviewed application code. WorkAbhi therefore does not currently describe advertising cookies or advertising profiles as part of this product&apos;s implemented data flow.</p>

        <h2>7. Third-party services</h2>
        <p>The application includes client-side libraries needed for features such as media, PDF, image, QR, and data processing. The presence of a library in the application does not by itself mean that your file is sent to that library&apos;s company or an external server. The reviewed application did not reveal a general external API used to upload tool content.</p>
        <p>The site is deployed using web hosting infrastructure. Standard infrastructure providers can process technical request information needed to operate and secure a website, including information such as IP address, request timing, user agent, and error information according to their own policies.</p>

        <h2>8. Contact information</h2>
        <p>The current application does not contain a configured backend contact form or email delivery service. Before launch, replace the contact placeholder on the Contact page and in this policy with the owner&apos;s real support address.</p>
        <p><strong>Owner contact:</strong> [CONTACT EMAIL]</p>

        <h2>9. Data retention</h2>
        <p>WorkAbhi does not currently implement a general-purpose database for storing the files processed by its browser tools. Standard web hosting or security logs may be retained by infrastructure providers according to their applicable policies and configurations.</p>

        <h2>10. Security</h2>
        <p>WorkAbhi uses browser-side processing for many supported operations and avoids unnecessary server-side file handling in the current architecture. No website can promise absolute security, so do not use an online tool for highly sensitive information unless the specific workflow and environment are appropriate for that information.</p>

        <h2>11. Children&apos;s privacy</h2>
        <p>WorkAbhi is a general-purpose tools website and is not intentionally designed to collect personal information from children. The current application does not include a child-directed account or profile system.</p>

        <h2>12. International users</h2>
        <p>WorkAbhi may be accessed from different countries. Where standard web infrastructure processes technical request information, that processing can occur in locations selected by the relevant infrastructure provider.</p>

        <h2>13. Changes to this policy</h2>
        <p>This policy should be updated when WorkAbhi adds material data practices such as analytics, advertising, authentication, server-side file processing, external APIs, contact submissions, or persistent user accounts.</p>

        <h2>14. Legal/business details to complete</h2>
        <p>The following information must be supplied by the owner before publication as a final legal document:</p>
        <ul><li>[LEGAL BUSINESS NAME]</li><li>[CONTACT EMAIL]</li><li>[GOVERNING LAW / JURISDICTION, IF APPLICABLE]</li><li>[BUSINESS ADDRESS, IF REQUIRED]</li></ul>
        <p>This page describes the observed application implementation and is not legal advice.</p>
      </article>
    </Container>
  );
}
