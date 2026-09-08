"use client";

import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  LockKeyhole,
  Image as ImageIcon,
  FileText,
  Calculator,
  Code2,
  Video,
  QrCode,
  Zap,
  Check,
  Search,
  Sparkles,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#020817] text-white">
      {/* =========================================================
          BACKGROUND
      ========================================================= */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-250px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-blue-600/[0.08] blur-[140px]" />

        <div className="absolute right-[-180px] top-[180px] h-[500px] w-[500px] rounded-full bg-cyan-500/[0.06] blur-[130px]" />

        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:56px_56px]" />

        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#020817] to-transparent" />
      </div>

      {/* =========================================================
          MAIN
      ========================================================= */}

      <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">

        <div className="grid min-h-[780px] items-center gap-14 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:py-20">

          {/* =====================================================
              LEFT — BRAND MESSAGE
          ===================================================== */}

          <div className="relative z-10 max-w-[650px]">

            {/* Eyebrow */}

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/15 bg-blue-500/[0.05] px-3 py-1.5">

              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,.9)]" />

              <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-blue-300 sm:text-[10px]">
                Private Tools · Built for Everyone
              </span>

            </div>

            {/* Headline */}

            <h1 className="text-[46px] font-bold leading-[0.96] tracking-[-0.055em] sm:text-[58px] md:text-[66px] lg:text-[70px] xl:text-[76px]">

              Everything you need.

              <br />

              <span className="bg-gradient-to-r from-blue-400 via-[#1683ff] to-cyan-400 bg-clip-text text-transparent">
                Nothing leaves your device.
              </span>

            </h1>

            {/* Description */}

            <p className="mt-7 max-w-[570px] text-[15px] leading-7 text-slate-300 sm:text-[17px]">
              Powerful browser-based tools for images, PDFs, videos,
              documents, calculations and more — designed to make everyday
              work faster, simpler and more private.
            </p>

            {/* CTA */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">

              <Link
                href="/tools"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-7 text-sm font-semibold shadow-[0_0_35px_rgba(37,99,235,.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_45px_rgba(37,99,235,.45)]"
              >
                Explore Free Tools

                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/tools"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.025] px-6 text-sm font-medium text-slate-200 backdrop-blur-xl transition-all duration-300 hover:border-blue-400/30 hover:bg-white/[0.05]"
              >
                <Search
                  size={15}
                  className="text-slate-400 group-hover:text-blue-400"
                />

                Find a Tool
              </Link>

            </div>

            {/* =================================================
                TRUST
            ================================================= */}

            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-[10px] text-slate-500">

              <div className="flex items-center gap-2">
                <Check size={13} className="text-blue-400" />
                No signup required
              </div>

              <div className="flex items-center gap-2">
                <Check size={13} className="text-blue-400" />
                Free to use
              </div>

              <div className="flex items-center gap-2">
                <Check size={13} className="text-blue-400" />
                Browser-based
              </div>

            </div>

            {/* =================================================
                STATS
            ================================================= */}

            <div className="mt-10 grid grid-cols-4 border-t border-white/[0.08] pt-6">

              <Stat
                value="400+"
                label="Free Tools"
              />

              <Stat
                value="0"
                label="Required Uploads"
              />

              <Stat
                value="100%"
                label="Client-Side"
              />

              <Stat
                value="∞"
                label="Privacy First"
                last
              />

            </div>

          </div>

          {/* =====================================================
              RIGHT — ORIGINAL PRODUCT / PLATFORM VISUAL
          ===================================================== */}

          <div className="relative z-10">

            {/* Main platform glow */}

            <div className="absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/[0.09] blur-[120px]" />

            {/* =================================================
                APP WINDOW
            ================================================= */}

            <div className="relative rounded-[24px] border border-white/[0.10] bg-[#071321]/90 p-2 shadow-[0_35px_100px_rgba(0,0,0,.55),0_0_80px_rgba(0,100,255,.10)] backdrop-blur-xl">

              {/* Browser top bar */}

              <div className="flex h-11 items-center border-b border-white/[0.06] px-4">

                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-400/60" />
                  <span className="h-2 w-2 rounded-full bg-yellow-400/60" />
                  <span className="h-2 w-2 rounded-full bg-green-400/60" />
                </div>

                <div className="mx-auto flex h-7 w-[45%] items-center justify-center rounded-lg border border-white/[0.05] bg-white/[0.025]">

                  <span className="text-[8px] text-slate-600">
                    workabhi.com/tools
                  </span>

                </div>

                <div className="w-10" />

              </div>

              {/* Application */}

              <div className="grid min-h-[480px] grid-cols-[155px_1fr] overflow-hidden rounded-b-[18px] bg-[#06111f] sm:grid-cols-[185px_1fr]">

                {/* =================================================
                    SIDEBAR
                ================================================= */}

                <aside className="border-r border-white/[0.06] bg-[#050e1a] p-3 sm:p-4">

                  {/* Logo */}

                  <div className="mb-7 flex items-center gap-2 px-2">

                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 text-[10px] font-bold shadow-[0_0_18px_rgba(37,99,235,.25)]">
                      W
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-white">
                        WorkAbhi
                      </p>

                      <p className="text-[7px] text-slate-600">
                        Free tools
                      </p>
                    </div>

                  </div>

                  {/* Search */}

                  <div className="mb-5 flex h-8 items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5">

                    <Search
                      size={11}
                      className="text-slate-600"
                    />

                    <span className="text-[8px] text-slate-600">
                      Search tools...
                    </span>

                  </div>

                  <SidebarItem
                    icon={<ImageIcon size={13} />}
                    active
                  >
                    Image Tools
                  </SidebarItem>

                  <SidebarItem icon={<FileText size={13} />}>
                    PDF Tools
                  </SidebarItem>

                  <SidebarItem icon={<Video size={13} />}>
                    Video Tools
                  </SidebarItem>

                  <SidebarItem icon={<Calculator size={13} />}>
                    Calculators
                  </SidebarItem>

                  <SidebarItem icon={<Code2 size={13} />}>
                    Developer Tools
                  </SidebarItem>

                  <SidebarItem icon={<QrCode size={13} />}>
                    QR Tools
                  </SidebarItem>

                  <div className="my-5 h-px bg-white/[0.05]" />

                  <div className="px-2 text-[7px] uppercase tracking-[0.15em] text-slate-700">
                    More
                  </div>

                  <div className="mt-3 space-y-2 px-2">

                    <div className="text-[8px] text-slate-600">
                      Text Tools
                    </div>

                    <div className="text-[8px] text-slate-600">
                      Security
                    </div>

                    <div className="text-[8px] text-slate-600">
                      File Utilities
                    </div>

                  </div>

                </aside>

                {/* =================================================
                    MAIN DASHBOARD
                ================================================= */}

                <main className="p-5 sm:p-7">

                  {/* Header */}

                  <div className="flex items-start justify-between">

                    <div>

                      <div className="flex items-center gap-2">

                        <Sparkles
                          size={14}
                          className="text-blue-400"
                        />

                        <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-blue-400">
                          Your workspace
                        </p>

                      </div>

                      <h2 className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
                        What do you want to do?
                      </h2>

                      <p className="mt-1 text-[9px] text-slate-500">
                        Choose a tool and get it done in seconds.
                      </p>

                    </div>

                    {/* Privacy badge */}

                    <div className="hidden items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.04] px-3 py-1.5 sm:flex">

                      <LockKeyhole
                        size={11}
                        className="text-cyan-400"
                      />

                      <span className="text-[8px] font-medium text-cyan-300">
                        Private Processing
                      </span>

                    </div>

                  </div>

                  {/* =================================================
                      FEATURED TOOL
                  ================================================= */}

                  <div className="mt-6 rounded-2xl border border-blue-400/[0.13] bg-gradient-to-br from-blue-500/[0.09] to-transparent p-4">

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                          <ImageIcon size={19} />
                        </div>

                        <div>

                          <p className="text-[11px] font-semibold text-white">
                            Image Compressor
                          </p>

                          <p className="mt-0.5 text-[8px] text-slate-500">
                            Reduce image size while keeping quality.
                          </p>

                        </div>

                      </div>

                      <div className="rounded-full bg-green-400/10 px-2 py-1 text-[7px] font-medium text-green-400">
                        Popular
                      </div>

                    </div>

                    {/* Upload area */}

                    <div className="mt-4 rounded-xl border border-dashed border-blue-400/20 bg-[#061322]/70 p-5 text-center">

                      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10">
                        <ArrowRight
                          size={15}
                          className="rotate-90 text-blue-400"
                        />
                      </div>

                      <p className="mt-2 text-[9px] font-medium text-slate-300">
                        Drop your image here
                      </p>

                      <p className="mt-1 text-[7px] text-slate-600">
                        Processed directly in your browser
                      </p>

                    </div>

                  </div>

                  {/* =================================================
                      TOOL GRID
                  ================================================= */}

                  <div className="mt-5">

                    <div className="mb-3 flex items-center justify-between">

                      <p className="text-[9px] font-semibold text-slate-300">
                        Explore tools
                      </p>

                      <span className="text-[7px] text-slate-600">
                        400+ available
                      </span>

                    </div>

                    <div className="grid grid-cols-3 gap-2">

                      <MiniTool
                        icon={<ImageIcon size={14} />}
                        title="Image"
                      />

                      <MiniTool
                        icon={<FileText size={14} />}
                        title="PDF"
                      />

                      <MiniTool
                        icon={<Calculator size={14} />}
                        title="Finance"
                      />

                      <MiniTool
                        icon={<Code2 size={14} />}
                        title="Developer"
                      />

                      <MiniTool
                        icon={<Video size={14} />}
                        title="Video"
                      />

                      <MiniTool
                        icon={<QrCode size={14} />}
                        title="QR Code"
                      />

                    </div>

                  </div>

                  {/* =================================================
                      PRIVACY FOOTER
                  ================================================= */}

                  <div className="mt-5 flex items-center gap-2 border-t border-white/[0.05] pt-4">

                    <ShieldCheck
                      size={15}
                      className="text-blue-400"
                    />

                    <div>

                      <p className="text-[8px] font-medium text-slate-300">
                        Your files stay on your device.
                      </p>

                      <p className="mt-0.5 text-[7px] text-slate-600">
                        No unnecessary uploads or storage.
                      </p>

                    </div>

                  </div>

                </main>

              </div>

            </div>

            {/* =================================================
                FLOATING PRIVACY CARD
            ================================================= */}

            <div className="absolute -right-4 top-[15%] hidden w-[155px] rounded-2xl border border-cyan-400/15 bg-[#071321]/90 p-4 shadow-[0_20px_50px_rgba(0,0,0,.45)] backdrop-blur-xl sm:block lg:-right-8">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/[0.07]">
                  <ShieldCheck
                    size={19}
                    className="text-cyan-300"
                  />
                </div>

                <div>
                  <p className="text-[9px] font-semibold">
                    Privacy First
                  </p>

                  <p className="mt-0.5 text-[7px] text-slate-600">
                    Local processing
                  </p>
                </div>

              </div>

              <div className="mt-3 h-px bg-white/[0.06]" />

              <div className="mt-3 space-y-2">

                <PrivacyPoint text="No file uploads" />
                <PrivacyPoint text="No account required" />
                <PrivacyPoint text="Instant processing" />

              </div>

            </div>

            {/* =================================================
                FLOATING TOOL COUNT
            ================================================= */}

            <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-white/[0.08] bg-[#071321]/95 px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,.4)] backdrop-blur-xl sm:block">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                  <Zap
                    size={17}
                    className="text-blue-400"
                  />
                </div>

                <div>

                  <p className="text-[12px] font-bold">
                    400+
                  </p>

                  <p className="text-[7px] text-slate-600">
                    tools ready to use
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

/* =============================================================
   STAT
============================================================= */

function Stat({
  value,
  label,
  last = false,
}: {
  value: string;
  label: string;
  last?: boolean;
}) {
  return (
    <div
      className={`min-w-0 px-3 sm:px-4 ${
        !last ? "border-r border-white/[0.08]" : ""
      } first:pl-0`}
    >
      <div className="text-[18px] font-semibold leading-none tracking-tight sm:text-[20px]">
        {value}
      </div>

      <p className="mt-2 max-w-[100px] text-[7px] leading-3 text-slate-500 sm:text-[8px] sm:leading-4">
        {label}
      </p>
    </div>
  );
}

/* =============================================================
   SIDEBAR ITEM
============================================================= */

function SidebarItem({
  children,
  icon,
  active = false,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={`mb-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-[8px] transition-all sm:text-[9px] ${
        active
          ? "bg-blue-500/12 text-blue-300 shadow-[inset_2px_0_0_#1683ff]"
          : "text-slate-500 hover:bg-white/[0.035] hover:text-slate-300"
      }`}
    >
      {icon}
      {children}
    </div>
  );
}

/* =============================================================
   MINI TOOL
============================================================= */

function MiniTool({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="group flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.018] px-3 py-2.5 transition-all hover:border-blue-400/15 hover:bg-blue-500/[0.04]">

      <div className="text-slate-500 transition-colors group-hover:text-blue-400">
        {icon}
      </div>

      <span className="text-[8px] text-slate-400 group-hover:text-slate-200">
        {title}
      </span>

    </div>
  );
}

/* =============================================================
   PRIVACY POINT
============================================================= */

function PrivacyPoint({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">

      <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-400/10">
        <Check
          size={8}
          className="text-green-400"
        />
      </div>

      <span className="text-[7px] text-slate-500">
        {text}
      </span>

    </div>
  );
}