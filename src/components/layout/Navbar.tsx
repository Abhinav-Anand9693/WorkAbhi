"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "./Container";
import { ChevronDown, Menu, X } from "lucide-react";

type DropdownName = "calculators" | "images" | "pdf" | "more" | null;

export default function Navbar() {
  const [openDropdown, setOpenDropdown] =
    useState<DropdownName>(null);

  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleDropdown = (name: DropdownName) => {
    setOpenDropdown((current) =>
      current === name ? null : name
    );
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
  };

  const closeMobile = () => {
    setMobileOpen(false);
    setOpenDropdown(null);
  };

  return (
    <header
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
          gap-6
        "
      >
        {/* =========================
            LOGO
        ========================== */}
        <Link
          href="/"
          onClick={closeMobile}
          className="shrink-0"
        >
          <Image
            src="/logo.png"
            alt="Workabhi Logo"
            width={120}
            height={40}
            priority
            className="h-8 w-auto"
          />
        </Link>

        {/* =========================
            DESKTOP NAVBAR
        ========================== */}
        <nav
          className="
            hidden
            items-center
            gap-1
            md:flex
          "
          aria-label="Main navigation"
        >
          {/* ALL TOOLS */}
          <Link
            href="/tools"
            className="
              rounded-lg
              px-3
              py-2
              text-sm
              font-medium
              text-muted-foreground
              transition-colors
              hover:bg-muted
              hover:text-foreground
            "
          >
            All Tools
          </Link>

          {/* =========================
              CALCULATORS DROPDOWN
          ========================== */}
          <div
  className="relative"
  onMouseEnter={() =>
    setOpenDropdown("calculators")
  }
  onMouseLeave={closeDropdown}
>
  <button
    type="button"
              aria-expanded={
                openDropdown === "calculators"
              }
              aria-haspopup="true"
              className="
                flex
                items-center
                gap-1
                rounded-lg
                px-3
                py-2
                text-sm
                font-medium
                text-muted-foreground
                transition-colors
                hover:bg-muted
                hover:text-foreground
              "
            >
              Calculators

              <ChevronDown
                className={`
                  h-4
                  w-4
                  transition-transform
                  ${
                    openDropdown === "calculators"
                      ? "rotate-180"
                      : ""
                  }
                `}
              />
            </button>

            {openDropdown === "calculators" && (
              <DropdownMenu
                title="Calculators"
                items={[
                  {
                    name: "Basic Calculator",
                    href: "/tool/basic-calculator",
                  },
                  {
                    name: "Scientific Calculator",
                    href: "/tool/scientific-calculator",
                  },
                  {
                    name: "Percentage Calculator",
                    href: "/tool/percentage-calculator",
                  },
                  {
                    name: "Age Calculator",
                    href: "/tool/age-calculator",
                  },
                  {
                    name: "BMI Calculator",
                    href: "/tool/bmi-calculator",
                  },
                  {
                    name: "EMI Calculator",
                    href: "/tool/emi-calculator",
                  },
                  {
                    name: "SIP Calculator",
                    href: "/tool/sip-calculator",
                  },
                  {
                    name: "GST Calculator",
                    href: "/tool/gst-calculator",
                  },
                  {
                    name: "All Calculators",
                    href: "/tools/calculator",
                    highlight: true,
                  },
                ]}
                onNavigate={closeDropdown}
              />
            )}
          </div>

          {/* =========================
              IMAGE DROPDOWN
          ========================== */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                toggleDropdown("images")
              }
              aria-expanded={
                openDropdown === "images"
              }
              aria-haspopup="true"
              className="
                flex
                items-center
                gap-1
                rounded-lg
                px-3
                py-2
                text-sm
                font-medium
                text-muted-foreground
                transition-colors
                hover:bg-muted
                hover:text-foreground
              "
            >
              Images

              <ChevronDown
                className={`
                  h-4
                  w-4
                  transition-transform
                  ${
                    openDropdown === "images"
                      ? "rotate-180"
                      : ""
                  }
                `}
              />
            </button>

            {openDropdown === "images" && (
              <DropdownMenu
                title="Image Tools"
                items={[
                  {
                    name: "Image Compressor",
                    href: "/tool/image-compressor",
                  },
                  {
                    name: "Image Resizer",
                    href: "/tool/image-resizer",
                  },
                  {
                    name: "Image Cropper",
                    href: "/tool/image-cropper",
                  },
                  {
                    name: "Image Converter",
                    href: "/tool/image-converter",
                  },
                  {
                    name: "JPG to PNG",
                    href: "/tool/jpg-to-png",
                  },
                  {
                    name: "PNG to JPG",
                    href: "/tool/png-to-jpg",
                  },
                  {
                    name: "All Image Tools",
                    href: "/tools/image",
                    highlight: true,
                  },
                ]}
                onNavigate={closeDropdown}
              />
            )}
          </div>

          {/* =========================
              PDF DROPDOWN
          ========================== */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                toggleDropdown("pdf")
              }
              aria-expanded={
                openDropdown === "pdf"
              }
              aria-haspopup="true"
              className="
                flex
                items-center
                gap-1
                rounded-lg
                px-3
                py-2
                text-sm
                font-medium
                text-muted-foreground
                transition-colors
                hover:bg-muted
                hover:text-foreground
              "
            >
              PDFs

              <ChevronDown
                className={`
                  h-4
                  w-4
                  transition-transform
                  ${
                    openDropdown === "pdf"
                      ? "rotate-180"
                      : ""
                  }
                `}
              />
            </button>

            {openDropdown === "pdf" && (
              <DropdownMenu
                title="PDF Tools"
                items={[
                  {
                    name: "Merge PDF",
                    href: "/tool/merge-pdf",
                  },
                  {
                    name: "Split PDF",
                    href: "/tool/split-pdf",
                  },
                  {
                    name: "Compress PDF",
                    href: "/tool/compress-pdf",
                  },
                  {
                    name: "JPG to PDF",
                    href: "/tool/jpg-to-pdf",
                  },
                  {
                    name: "PDF to JPG",
                    href: "/tool/pdf-to-jpg",
                  },
                  {
                    name: "PDF to Word",
                    href: "/tool/pdf-to-word",
                  },
                  {
                    name: "All PDF Tools",
                    href: "/tools/pdf",
                    highlight: true,
                  },
                ]}
                onNavigate={closeDropdown}
              />
            )}
          </div>

          {/* =========================
              MORE DROPDOWN
          ========================== */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                toggleDropdown("more")
              }
              aria-expanded={
                openDropdown === "more"
              }
              aria-haspopup="true"
              className="
                flex
                items-center
                gap-1
                rounded-lg
                px-3
                py-2
                text-sm
                font-medium
                text-muted-foreground
                transition-colors
                hover:bg-muted
                hover:text-foreground
              "
            >
              More

              <ChevronDown
                className={`
                  h-4
                  w-4
                  transition-transform
                  ${
                    openDropdown === "more"
                      ? "rotate-180"
                      : ""
                  }
                `}
              />
            </button>

            {openDropdown === "more" && (
              <DropdownMenu
                title="More Tools"
                items={[
                  {
                    name: "Text Tools",
                    href: "/tools/text",
                  },
                  {
                    name: "Developer Tools",
                    href: "/tools/developer",
                  },
                  {
                    name: "QR & Barcode",
                    href: "/tools/qr",
                  },
                  {
                    name: "Security Tools",
                    href: "/tools/security",
                  },
                  {
                    name: "Color Tools",
                    href: "/tools/color",
                  },
                  {
                    name: "Date & Time",
                    href: "/tools/date-time",
                  },
                  {
                    name: "Audio Tools",
                    href: "/tools/audio",
                  },
                  {
                    name: "Video Tools",
                    href: "/tools/video",
                  },
                  {
                    name: "View All Tools",
                    href: "/tools",
                    highlight: true,
                  },
                ]}
                onNavigate={closeDropdown}
              />
            )}
          </div>
        </nav>

        {/* =========================
            DESKTOP CTA
        ========================== */}
        <Link
          href="/tools"
          className="
            hidden
            rounded-xl
            bg-primary
            px-4
            py-2
            text-sm
            font-semibold
            text-primary-foreground
            transition-opacity
            hover:opacity-90
            md:block
          "
        >
          Explore Tools
        </Link>

        {/* =========================
            MOBILE MENU BUTTON
        ========================== */}
        <button
          type="button"
          onClick={() =>
            setMobileOpen((current) => !current)
          }
          aria-label={
            mobileOpen
              ? "Close menu"
              : "Open menu"
          }
          aria-expanded={mobileOpen}
          className="
            rounded-lg
            p-2
            text-muted-foreground
            hover:bg-muted
            hover:text-foreground
            md:hidden
          "
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        {/* =========================
            MOBILE NAVIGATION
        ========================== */}
        {mobileOpen && (
          <div
            className="
              absolute
              left-0
              right-0
              top-16
              border-b
              border-border
              bg-background
              shadow-lg
              md:hidden
            "
          >
            <nav
              className="
                mx-auto
                flex
                max-w-7xl
                flex-col
                gap-1
                px-4
                py-4
              "
              aria-label="Mobile navigation"
            >
              {/* All Tools */}
              <MobileLink
                href="/tools"
                label="All Tools"
                onClick={closeMobile}
              />

              {/* Calculators */}
              <MobileDropdown
                title="Calculators"
                isOpen={
                  openDropdown === "calculators"
                }
                onClick={() =>
                  toggleDropdown("calculators")
                }
              >
                <MobileLink
                  href="/tool/basic-calculator"
                  label="Basic Calculator"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tool/scientific-calculator"
                  label="Scientific Calculator"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tool/percentage-calculator"
                  label="Percentage Calculator"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tool/age-calculator"
                  label="Age Calculator"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tool/bmi-calculator"
                  label="BMI Calculator"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tool/emi-calculator"
                  label="EMI Calculator"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tool/sip-calculator"
                  label="SIP Calculator"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tools/calculator"
                  label="View All Calculators"
                  onClick={closeMobile}
                  highlight
                />
              </MobileDropdown>

              {/* Images */}
              <MobileDropdown
                title="Images"
                isOpen={
                  openDropdown === "images"
                }
                onClick={() =>
                  toggleDropdown("images")
                }
              >
                <MobileLink
                  href="/tool/image-compressor"
                  label="Image Compressor"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tool/image-resizer"
                  label="Image Resizer"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tool/image-cropper"
                  label="Image Cropper"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tool/image-converter"
                  label="Image Converter"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tools/image"
                  label="View All Image Tools"
                  onClick={closeMobile}
                  highlight
                />
              </MobileDropdown>

              {/* PDFs */}
              <MobileDropdown
                title="PDFs"
                isOpen={
                  openDropdown === "pdf"
                }
                onClick={() =>
                  toggleDropdown("pdf")
                }
              >
                <MobileLink
                  href="/tool/merge-pdf"
                  label="Merge PDF"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tool/split-pdf"
                  label="Split PDF"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tool/compress-pdf"
                  label="Compress PDF"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tool/jpg-to-pdf"
                  label="JPG to PDF"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tools/pdf"
                  label="View All PDF Tools"
                  onClick={closeMobile}
                  highlight
                />
              </MobileDropdown>

              {/* More */}
              <MobileDropdown
                title="More"
                isOpen={
                  openDropdown === "more"
                }
                onClick={() =>
                  toggleDropdown("more")
                }
              >
                <MobileLink
                  href="/tools/text"
                  label="Text Tools"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tools/developer"
                  label="Developer Tools"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tools/qr"
                  label="QR & Barcode"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tools/security"
                  label="Security Tools"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tools/color"
                  label="Color Tools"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tools/date-time"
                  label="Date & Time"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tools/audio"
                  label="Audio Tools"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tools/video"
                  label="Video Tools"
                  onClick={closeMobile}
                />

                <MobileLink
                  href="/tools"
                  label="View All Tools"
                  onClick={closeMobile}
                  highlight
                />
              </MobileDropdown>

              {/* Mobile CTA */}
              <Link
                href="/tools"
                onClick={closeMobile}
                className="
                  mt-3
                  rounded-xl
                  bg-primary
                  px-4
                  py-3
                  text-center
                  text-sm
                  font-semibold
                  text-primary-foreground
                "
              >
                Explore Tools
              </Link>
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
}

/* =====================================
   DESKTOP DROPDOWN COMPONENT
===================================== */

type DropdownItem = {
  name: string;
  href: string;
  highlight?: boolean;
};

function DropdownMenu({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: DropdownItem[];
  onNavigate: () => void;
}) {
  return (
    <div
      className="
        absolute
        left-1/2
        top-full
        z-50
        mt-2
        w-64
        -translate-x-1/2
        rounded-xl
        border
        border-border
        bg-background
        p-2
        shadow-xl
      "
    >
      <div
        className="
          px-3
          pb-2
          pt-1
          text-xs
          font-semibold
          uppercase
          tracking-wider
          text-muted-foreground
        "
      >
        {title}
      </div>

      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={`
            block
            rounded-lg
            px-3
            py-2.5
            text-sm
            transition-colors
            ${
              item.highlight
                ? "mt-1 border-t border-border pt-3 font-semibold text-primary hover:bg-muted"
                : "text-foreground hover:bg-muted"
            }
          `}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}

/* =====================================
   MOBILE DROPDOWN
===================================== */

function MobileDropdown({
  title,
  isOpen,
  onClick,
  children,
}: {
  title: string;
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        aria-expanded={isOpen}
        className="
          flex
          w-full
          items-center
          justify-between
          rounded-lg
          px-3
          py-3
          text-left
          text-sm
          font-medium
          text-foreground
          hover:bg-muted
        "
      >
        {title}

        <ChevronDown
          className={`
            h-4
            w-4
            transition-transform
            ${isOpen ? "rotate-180" : ""}
          `}
        />
      </button>

      {isOpen && (
        <div
          className="
            ml-3
            border-l
            border-border
            pl-3
          "
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* =====================================
   MOBILE LINK
===================================== */

function MobileLink({
  href,
  label,
  onClick,
  highlight = false,
}: {
  href: string;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        block
        rounded-lg
        px-3
        py-2.5
        text-sm
        ${
          highlight
            ? "font-semibold text-primary"
            : "text-muted-foreground"
        }
        hover:bg-muted
        hover:text-foreground
      `}
    >
      {label}
    </Link>
  );
}