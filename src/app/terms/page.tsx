import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the WorkAbhi terms covering use of the tools, user responsibilities, content, service availability, limitations, and changes.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "WorkAbhi Terms of Service", description: "Terms governing use of WorkAbhi online tools.", type: "website", url: "/terms" },
};

export default function TermsPage() {
  return (
    <Container className="py-10 sm:py-16">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Terms", href: "/terms" }]} />
      <header className="mt-10 max-w-4xl">
        <p className="text-sm font-semibold text-primary">Terms of Service</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Rules for using WorkAbhi</h1>
        <p className="mt-5 text-muted-foreground">Last updated: October 3, 2026</p>
      </header>

      <article className="workabhi-prose mt-10 max-w-4xl">
        <p>These terms describe the intended use of the current WorkAbhi website and its online utilities. They should be reviewed and completed by the owner with the appropriate legal details before being treated as a final legal agreement.</p>
        <h2>1. Acceptance of terms</h2><p>By using WorkAbhi, you agree to use the website and its tools in accordance with applicable law and these terms. If you do not agree, do not use the service.</p>
        <h2>2. Description of the service</h2><p>WorkAbhi provides online utilities for tasks such as calculations, image processing, PDF operations, text transformation, developer utilities, QR generation, audio, video, and related workflows. Individual tools may have different input, output, browser, or processing limitations.</p>
        <h2>3. Permitted use</h2><p>You may use the service for lawful personal, educational, professional, and business tasks that are appropriate for the relevant tool.</p>
        <h2>4. Prohibited use</h2><p>You must not use WorkAbhi to violate laws, infringe intellectual property rights, distribute harmful material, interfere with the service, attempt unauthorized access, or abuse the website or its infrastructure.</p>
        <h2>5. User responsibilities</h2><p>You are responsible for the files, text, data, and other content you choose to process. You should maintain appropriate backups and verify important outputs before relying on them.</p>
        <h2>6. Uploaded and generated content</h2><p>WorkAbhi does not claim ownership of your original files merely because you process them using a tool. You are responsible for having the necessary rights to use the content you provide and for checking the output before distribution.</p>
        <h2>7. Intellectual property</h2><p>The WorkAbhi website, branding, original interface, software, written content, and other site materials are owned by or licensed to the service owner except where third-party rights apply. Do not copy or redistribute site materials in ways that violate applicable rights.</p>
        <h2>8. Third-party services</h2><p>The application may depend on third-party libraries, hosting, browsers, or infrastructure. Those providers can have their own terms and policies. The current application does not intentionally route ordinary tool inputs through a general external processing API.</p>
        <h2>9. Service availability</h2><p>WorkAbhi is provided as an online service and may be unavailable because of maintenance, deployment, browser limitations, infrastructure issues, or other technical conditions. No uninterrupted availability is promised.</p>
        <h2>10. Tool accuracy and processing limitations</h2><p>Calculators, converters, generators, and document/media tools are provided as utilities and should be independently checked when the result has financial, legal, medical, safety, compliance, or other significant consequences. Results can depend on input assumptions and implementation limitations.</p>
        <h2>11. Disclaimers</h2><p>The service is provided without a promise that every tool will meet every particular requirement, work with every file, or remain unchanged. Where a specific professional decision depends on an output, obtain appropriate professional review.</p>
        <h2>12. Limitation of liability</h2><p>To the extent permitted by applicable law, the service owner should not be responsible for indirect, incidental, special, consequential, or other losses arising from use of the service. The exact legal language and enforceability depend on the governing jurisdiction and should be reviewed by qualified counsel.</p>
        <h2>13. Changes to the service</h2><p>WorkAbhi may add, modify, suspend, or remove tools and site features as the product develops.</p>
        <h2>14. Changes to these terms</h2><p>These terms may be updated when the service or its legal requirements change. The updated version should include a new last-updated date.</p>
        <h2>15. Termination</h2><p>The owner may restrict access to the service where necessary to protect the website, users, infrastructure, or legal rights, subject to applicable law.</p>
        <h2>16. Governing law</h2><p><strong>[GOVERNING LAW / JURISDICTION]</strong> — This placeholder must be completed by the owner before publication.</p>
        <h2>17. Contact</h2><p><strong>[CONTACT EMAIL]</strong> — Replace this placeholder with the actual support or legal contact address.</p>
        <p>This page is general product terms content and is not legal advice.</p>
      </article>
    </Container>
  );
}
