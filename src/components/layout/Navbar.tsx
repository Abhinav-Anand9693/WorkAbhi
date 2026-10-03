"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "./Container";
import { ChevronDown, Menu, X } from "lucide-react";

type DropdownName = "calculators" | "images" | "pdf" | "more" | null;

type DropdownItem = { name: string; href: string; highlight?: boolean };

const desktopGroups: Record<Exclude<DropdownName, null>, DropdownItem[]> = {
  calculators: [
    ["Basic Calculator", "basic-calculator"], ["Scientific Calculator", "scientific-calculator"],
    ["Percentage Calculator", "percentage-calculator"], ["Age Calculator", "age-calculator"],
    ["BMI Calculator", "bmi-calculator"], ["EMI Calculator", "emi-calculator"], ["SIP Calculator", "sip-calculator"],
    ["GST Calculator", "gst-calculator"], ["All Calculators", "tools/calculator"],
  ].map(([name, id], i) => ({ name, href: `/tool/${id}`, highlight: i === 8 })),
  images: [
    ["Image Compressor", "image-compressor"], ["Image Resizer", "image-resizer"], ["Image Cropper", "image-cropper"],
    ["Image Converter", "image-converter"], ["JPG to PNG", "jpg-to-png"], ["PNG to JPG", "png-to-jpg"],
    ["All Image Tools", "tools/image"],
  ].map(([name, id], i) => ({ name, href: i === 6 ? `/${id}` : `/tool/${id}`, highlight: i === 6 })),
  pdf: [
    ["Merge PDF", "merge-pdf"], ["Split PDF", "split-pdf"], ["Compress PDF", "compress-pdf"], ["JPG to PDF", "jpg-to-pdf"],
    ["PDF to JPG", "pdf-to-jpg"], ["PDF to Word", "pdf-to-word"], ["All PDF Tools", "tools/pdf"],
  ].map(([name, id], i) => ({ name, href: i === 6 ? `/${id}` : `/tool/${id}`, highlight: i === 6 })),
  more: [
    ["Text Tools", "tools/text"], ["Developer Tools", "tools/developer"], ["QR & Barcode", "tools/qr"],
    ["Security Tools", "tools/security"], ["Color Tools", "tools/color"], ["Date & Time", "tools/date-time"],
    ["Audio Tools", "tools/audio"], ["Video Tools", "tools/video"], ["View All Tools", "tools"],
  ].map(([name, id], i) => ({ name, href: `/${id}`, highlight: i === 8 })),
};

export default function Navbar() {
  const [openDropdown, setOpenDropdown] = useState<DropdownName>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeAll = () => { setOpenDropdown(null); setMobileOpen(false); };
  const toggle = (name: Exclude<DropdownName, null>) => setOpenDropdown((v) => v === name ? null : name);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-white/82 shadow-[0_1px_16px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <Container className="flex h-[4.25rem] items-center justify-between gap-5">
        <Link href="/" onClick={closeAll} className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          <Image src="/logo.png" alt="WorkAbhi" width={120} height={40} priority className="h-8 w-auto" />
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main navigation">
          <NavLink href="/tools">All Tools</NavLink>
          {(Object.keys(desktopGroups) as Exclude<DropdownName, null>[]).map((name) => (
            <div key={name} className="relative" onMouseEnter={() => setOpenDropdown(name)} onMouseLeave={() => setOpenDropdown(null)}>
              <button type="button" aria-expanded={openDropdown === name} aria-haspopup="true" onClick={() => toggle(name)}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                {name === "calculators" ? "Calculators" : name === "images" ? "Images" : name === "pdf" ? "PDFs" : "More"}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openDropdown === name ? "rotate-180" : ""}`} />
              </button>
              {openDropdown === name && <DropdownMenu title={name === "more" ? "More tools" : name} items={desktopGroups[name]} onNavigate={closeAll} />}
            </div>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/blog" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-slate-100 hover:text-foreground">Blog</Link>
          <Link href="/tools" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-blue-600/20 hover:-translate-y-px hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">Explore Tools</Link>
        </div>

        <button type="button" onClick={() => setMobileOpen((v) => !v)} aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen}
          className="rounded-lg p-2 text-muted-foreground hover:bg-slate-100 hover:text-foreground md:hidden">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>

      {mobileOpen && (
        <div className="border-t border-border/70 bg-white/96 shadow-lg backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6" aria-label="Mobile navigation">
            <MobileLink href="/tools" label="All Tools" onClick={closeAll} />
            {(Object.keys(desktopGroups) as Exclude<DropdownName, null>[]).map((name) => (
              <MobileDropdown key={name} title={name === "calculators" ? "Calculators" : name === "images" ? "Images" : name === "pdf" ? "PDFs" : "More"} isOpen={openDropdown === name} onClick={() => toggle(name)}>
                {desktopGroups[name].map((item) => <MobileLink key={item.href} href={item.href} label={item.name} onClick={closeAll} highlight={item.highlight} />)}
              </MobileDropdown>
            ))}
            <MobileLink href="/blog" label="Blog" onClick={closeAll} />
            <Link href="/tools" onClick={closeAll} className="mt-2 rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground">Explore Tools</Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-slate-100 hover:text-foreground">{children}</Link>;
}

function DropdownMenu({ title, items, onNavigate }: { title: string; items: DropdownItem[]; onNavigate: () => void }) {
  return (
    <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-2xl border border-border bg-white p-2 shadow-[0_20px_55px_rgba(15,23,42,0.14)]">
      <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</div>
      {items.map((item) => <Link key={item.href} href={item.href} onClick={onNavigate} className={`block rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50 ${item.highlight ? "mt-1 border-t border-border pt-3 font-semibold text-primary" : "text-foreground"}`}>{item.name}</Link>)}
    </div>
  );
}

function MobileDropdown({ title, isOpen, onClick, children }: { title: string; isOpen: boolean; onClick: () => void; children: React.ReactNode }) {
  return <div><button type="button" onClick={onClick} aria-expanded={isOpen} className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-medium hover:bg-slate-50">{title}<ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} /></button>{isOpen && <div className="ml-3 border-l border-border pl-3">{children}</div>}</div>;
}

function MobileLink({ href, label, onClick, highlight = false }: { href: string; label: string; onClick: () => void; highlight?: boolean }) {
  return <Link href={href} onClick={onClick} className={`block rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50 ${highlight ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}`}>{label}</Link>;
}
