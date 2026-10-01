"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Container from "./Container";
import { ChevronDown, Menu, X } from "lucide-react";

type DropdownName = "calculators" | "images" | "pdf" | "more" | null;

type NavItem = {
  name: string;
  href: string;
  highlight?: boolean;
};

type NavDropdown = {
  id: Exclude<DropdownName, null>;
  title: string;
  items: NavItem[];
};

const NAV_DROPDOWNS: NavDropdown[] = [
  {
    id: "calculators",
    title: "Calculators",
    items: [
      { name: "Basic Calculator", href: "/tool/basic-calculator" },
      { name: "Scientific Calculator", href: "/tool/scientific-calculator" },
      { name: "Percentage Calculator", href: "/tool/percentage-calculator" },
      { name: "Age Calculator", href: "/tool/age-calculator" },
      { name: "BMI Calculator", href: "/tool/bmi-calculator" },
      { name: "EMI Calculator", href: "/tool/emi-calculator" },
      { name: "SIP Calculator", href: "/tool/sip-calculator" },
      { name: "GST Calculator", href: "/tool/gst-calculator" },
      {
        name: "All Calculators",
        href: "/tools/calculator",
        highlight: true,
      },
    ],
  },
  {
    id: "images",
    title: "Image Tools",
    items: [
      { name: "Image Compressor", href: "/tool/image-compressor" },
      { name: "Image Resizer", href: "/tool/image-resizer" },
      { name: "Image Cropper", href: "/tool/image-cropper" },
      { name: "Image Converter", href: "/tool/image-converter" },
      { name: "JPG to PNG", href: "/tool/jpg-to-png" },
      { name: "PNG to JPG", href: "/tool/png-to-jpg" },
      { name: "All Image Tools", href: "/tools/image", highlight: true },
    ],
  },
  {
    id: "pdf",
    title: "PDF Tools",
    items: [
      { name: "Merge PDF", href: "/tool/merge-pdf" },
      { name: "Split PDF", href: "/tool/split-pdf" },
      { name: "Compress PDF", href: "/tool/compress-pdf" },
      { name: "JPG to PDF", href: "/tool/jpg-to-pdf" },
      { name: "PDF to JPG", href: "/tool/pdf-to-jpg" },
      { name: "PDF to Word", href: "/tool/pdf-to-word" },
      { name: "All PDF Tools", href: "/tools/pdf", highlight: true },
    ],
  },
  {
    id: "more",
    title: "More Tools",
    items: [
      { name: "Text Tools", href: "/tools/text" },
      { name: "Developer Tools", href: "/tools/developer" },
      { name: "QR & Barcode", href: "/tools/qr" },
      { name: "Security Tools", href: "/tools/security" },
      { name: "Color Tools", href: "/tools/color" },
      { name: "Date & Time", href: "/tools/date-time" },
      { name: "Audio Tools", href: "/tools/audio" },
      { name: "Video Tools", href: "/tools/video" },
      { name: "View All Tools", href: "/tools", highlight: true },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getDropdownForPath(pathname: string): DropdownName {
  const match = NAV_DROPDOWNS.find((dropdown) =>
    dropdown.items.some((item) => isActivePath(pathname, item.href))
  );
  return match?.id ?? null;
}

export default function Navbar() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<DropdownName>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navbarRef = useRef<HTMLElement | null>(null);

  const closeAll = () => {
    setOpenDropdown(null);
    setMobileOpen(false);
  };

  const toggleDropdown = (name: Exclude<DropdownName, null>) => {
    setOpenDropdown((current) => (current === name ? null : name));
  };

  useEffect(() => {
    setOpenDropdown(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!openDropdown && !mobileOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && navbarRef.current?.contains(target)) return;
      closeAll();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAll();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdown, mobileOpen]);

  const activeDropdown = getDropdownForPath(pathname);

  return (
    <header
      ref={navbarRef}
      className="
        sticky top-0 z-50
        border-b border-border/70
        bg-background/95
        backdrop-blur-md
      "
    >
      <Container
        className="
          relative
          flex
          h-16
          items-center
          justify-between
          gap-4
        "
      >
        <Link
          href="/"
          onClick={closeAll}
          className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="WorkAbhi home"
        >
          <Image
            src="/logo.png"
            alt="WorkAbhi Logo"
            width={120}
            height={40}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex"
          aria-label="Main navigation"
        >
          <NavLink href="/tools" pathname={pathname}>
            All Tools
          </NavLink>

          {NAV_DROPDOWNS.map((dropdown) => {
            const isOpen = openDropdown === dropdown.id;
            const isActive = activeDropdown === dropdown.id;
            const menuId = `navbar-menu-${dropdown.id}`;

            return (
              <div key={dropdown.id} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => toggleDropdown(dropdown.id)}
                  aria-expanded={isOpen}
                  aria-haspopup="menu"
                  aria-controls={menuId}
                  className={`
                    flex items-center gap-1 rounded-lg px-3 py-2
                    text-sm font-medium transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                    ${
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                >
                  {dropdown.id === "pdf" ? "PDFs" : dropdown.title.replace(" Tools", "")}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <DropdownMenu
                    id={menuId}
                    title={dropdown.title}
                    items={dropdown.items}
                    pathname={pathname}
                    onNavigate={closeAll}
                  />
                )}
              </div>
            );
          })}
        </nav>

        <Link
          href="/tools"
          onClick={closeAll}
          className="
            hidden shrink-0 rounded-xl bg-primary px-4 py-2
            text-sm font-semibold text-primary-foreground
            transition-opacity hover:opacity-90
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
            md:block
          "
        >
          Explore Tools
        </Link>

        <button
          type="button"
          onClick={() => {
            setMobileOpen((current) => !current);
            setOpenDropdown(null);
          }}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          className="
            rounded-lg p-2 text-muted-foreground
            hover:bg-muted hover:text-foreground
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
            md:hidden
          "
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {mobileOpen && (
          <>
            <button
              type="button"
              aria-label="Close navigation overlay"
              onClick={closeAll}
              className="fixed inset-0 top-16 z-40 bg-black/20 md:hidden"
            />

            <div
              id="mobile-navigation"
              className="
                absolute left-0 right-0 top-16 z-50
                max-h-[calc(100vh-4rem)]
                overflow-y-auto
                border-b border-border
                bg-background
                shadow-lg
                md:hidden
              "
            >
              <nav
                className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4"
                aria-label="Mobile navigation"
              >
                <MobileLink
                  href="/tools"
                  label="All Tools"
                  pathname={pathname}
                  onClick={closeAll}
                />

                {NAV_DROPDOWNS.map((dropdown) => (
                  <MobileDropdown
                    key={dropdown.id}
                    title={dropdown.id === "pdf" ? "PDFs" : dropdown.title}
                    isOpen={openDropdown === dropdown.id}
                    isActive={activeDropdown === dropdown.id}
                    onClick={() => toggleDropdown(dropdown.id)}
                  >
                    {dropdown.items.map((item) => (
                      <MobileLink
                        key={item.href}
                        href={item.href}
                        label={item.name}
                        pathname={pathname}
                        onClick={closeAll}
                        highlight={item.highlight}
                      />
                    ))}
                  </MobileDropdown>
                ))}

                <Link
                  href="/tools"
                  onClick={closeAll}
                  className="
                    mt-3 rounded-xl bg-primary px-4 py-3 text-center
                    text-sm font-semibold text-primary-foreground
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  "
                >
                  Explore Tools
                </Link>
              </nav>
            </div>
          </>
        )}
      </Container>
    </header>
  );
}

function NavLink({
  href,
  pathname,
  children,
}: {
  href: string;
  pathname: string;
  children: ReactNode;
}) {
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      className={`
        shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
        ${
          active
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }
      `}
    >
      {children}
    </Link>
  );
}

function DropdownMenu({
  id,
  title,
  items,
  pathname,
  onNavigate,
}: {
  id: string;
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div
      id={id}
      role="menu"
      aria-label={title}
      className="
        absolute left-1/2 top-full z-50 mt-2 w-64
        -translate-x-1/2 rounded-xl border border-border
        bg-background p-2 shadow-xl
      "
    >
      <div className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>

      {items.map((item) => {
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            role="menuitem"
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`
              block rounded-lg px-3 py-2.5 text-sm transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
              ${
                item.highlight
                  ? "mt-1 border-t border-border pt-3 font-semibold text-primary hover:bg-muted"
                  : active
                    ? "bg-muted font-medium text-foreground"
                    : "text-foreground hover:bg-muted"
              }
            `}
          >
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}

function MobileDropdown({
  title,
  isOpen,
  isActive,
  onClick,
  children,
}: {
  title: string;
  isOpen: boolean;
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`
          flex w-full items-center justify-between rounded-lg px-3 py-3
          text-left text-sm font-medium
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${
            isActive
              ? "bg-muted text-foreground"
              : "text-foreground hover:bg-muted"
          }
        `}
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="ml-3 border-l border-border pl-3">
          {children}
        </div>
      )}
    </div>
  );
}

function MobileLink({
  href,
  label,
  pathname,
  onClick,
  highlight = false,
}: {
  href: string;
  label: string;
  pathname: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`
        block rounded-lg px-3 py-2.5 text-sm
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
        ${
          highlight
            ? "font-semibold text-primary"
            : active
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground"
        }
        hover:bg-muted hover:text-foreground
      `}
    >
      {label}
    </Link>
  );
}
