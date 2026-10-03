import Link from "next/link";
import Container from "./Container";

const columns = [
  { title: "Tools", links: [["All Tools", "/tools"], ["Calculators", "/tools/calculator"], ["Image Tools", "/tools/image"], ["PDF Tools", "/tools/pdf"], ["Developer Tools", "/tools/developer"]] },
  { title: "Explore", links: [["Text Tools", "/tools/text"], ["Video Tools", "/tools/video"], ["Audio Tools", "/tools/audio"], ["Security Tools", "/tools/security"], ["Date & Time", "/tools/date-time"]] },
  { title: "WorkAbhi", links: [["About", "/about"], ["Blog", "/blog"], ["FAQ", "/faq"], ["Contact", "/contact"], ["Privacy", "/privacy"], ["Terms", "/terms"]] },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <Container className="grid gap-12 py-14 lg:grid-cols-[1.5fr_2fr] lg:py-16">
        <div>
          <Link href="/" className="text-xl font-bold tracking-tight">Work<span className="text-primary">Abhi</span></Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">Free online tools for everyday work, calculations, images, PDFs, text, developers and more.</p>
          <div className="mt-5 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">Privacy-conscious browser-first tools</div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((column) => <div key={column.title}><h2 className="text-sm font-semibold">{column.title}</h2><div className="mt-4 space-y-2.5">{column.links.map(([label, href]) => <Link key={href} href={href} className="block text-sm text-muted-foreground hover:text-foreground">{label}</Link>)}</div></div>)}
        </div>
      </Container>
      <div className="border-t border-border bg-slate-50/70"><Container className="flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} WorkAbhi. All rights reserved.</span><span>Built for simple, useful work.</span></Container></div>
    </footer>
  );
}
