"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  FileImage,
  FileText,
  LockKeyhole,
  Monitor,
  MousePointer2,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";

export default function Hero() {
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden border-b border-slate-200 bg-slate-50"
    >
      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Blue glow */}
        <div className="absolute left-[5%] top-[-180px] h-[520px] w-[520px] rounded-full bg-blue-400/[0.13] blur-[110px]" />

        {/* Violet glow */}
        <div className="absolute right-[-100px] top-[-100px] h-[500px] w-[500px] rounded-full bg-violet-400/[0.12] blur-[110px]" />

        {/* Cyan glow */}
        <div className="absolute bottom-[-220px] left-[35%] h-[450px] w-[450px] rounded-full bg-cyan-400/[0.08] blur-[110px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgb(37 99 235) 1px, transparent 1px), linear-gradient(to bottom, rgb(37 99 235) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        {/* Top gradient */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-50/80 to-transparent" />

        {/* Moving scan */}
        <div className="absolute left-[-20%] top-[28%] h-px w-[140%] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent motion-safe:animate-[heroScan_8s_linear_infinite]" />

        {/* Decorative dots */}
        <div className="absolute left-[12%] top-[25%] h-1.5 w-1.5 rounded-full bg-blue-500/50 motion-safe:animate-pulse" />

        <div className="absolute right-[15%] top-[35%] h-1.5 w-1.5 rounded-full bg-violet-500/50 motion-safe:animate-ping" />

        <div className="absolute bottom-[20%] left-[30%] h-1 w-1 rounded-full bg-cyan-500/50 motion-safe:animate-pulse" />
      </div>

      {/* =====================================================
          HERO CONTAINER
      ====================================================== */}

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="grid items-center gap-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20">
          {/* =================================================
              LEFT
          ================================================== */}

          <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            {/* Badge */}
            <div className="motion-safe:animate-[heroFadeUp_0.7s_ease-out_both] mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-xl">
              <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-blue-100">
                <span className="absolute h-5 w-5 rounded-full bg-blue-400/20 motion-safe:animate-ping" />

                <LockKeyhole className="relative h-3 w-3 text-blue-600" />
              </span>

              Privacy-first online tools

              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Heading */}
            <h1
              id="hero-heading"
              className="motion-safe:animate-[heroFadeUp_0.7s_0.08s_ease-out_both] text-balance text-[2.7rem] font-bold leading-[1.03] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[4.25rem]"
            >
              Your files.
              <br />

              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Your device.
              </span>

              <br />

              <span className="text-slate-900">
                Your privacy.
              </span>
            </h1>

            {/* Description */}
            <p className="motion-safe:animate-[heroFadeUp_0.7s_0.16s_ease-out_both] mx-auto mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
              Powerful tools that work directly in your
              browser — without making your files travel
              somewhere they don't need to.
            </p>

            {/* Privacy Card */}
            <div className="motion-safe:animate-[heroFadeUp_0.7s_0.24s_ease-out_both] group relative mx-auto mt-7 max-w-xl overflow-hidden rounded-2xl border border-blue-200/70 bg-white/80 p-4 text-left shadow-[0_12px_40px_-20px_rgba(37,99,235,0.25)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_18px_50px_-20px_rgba(37,99,235,0.3)] lg:mx-0"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-70" />

              <div className="flex gap-3.5">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20">
                  <ShieldCheck className="relative h-5 w-5 text-white" />
                </div>

                <div>
                  <p className="text-sm font-semibold leading-6 text-slate-900 sm:text-[15px]">
                    You don't need to trust us—we don't
                    receive the document.
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                    For supported client-side tools, your
                    files are processed locally in your
                    browser and don't need to be uploaded
                    to our servers.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="motion-safe:animate-[heroFadeUp_0.7s_0.32s_ease-out_both] mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/tools"
                className="group relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-blue-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <span className="absolute inset-y-0 -left-full w-1/2 skew-x-[-20deg] bg-white/20 transition-all duration-700 group-hover:left-[130%]" />

                <span className="relative">
                  Explore Free Tools
                </span>

                <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <button
                type="button"
                onClick={() => setShowPrivacy((value) => !value)}
                aria-expanded={showPrivacy}
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:text-blue-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {showPrivacy ? (
                  <X className="h-4 w-4" />
                ) : (
                  <ShieldCheck className="h-4 w-4 text-blue-600 transition-transform duration-300 group-hover:scale-110" />
                )}

                {showPrivacy
                  ? "Close"
                  : "How Privacy Works"}
              </button>
            </div>

            {/* Inline Privacy */}
            <div
              className={`grid transition-all duration-500 ease-out ${
                showPrivacy
                  ? "mt-5 grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-blue-50/80 via-white to-violet-50/70 p-4 text-left shadow-sm sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 shadow-sm">
                      <Monitor className="h-4 w-4 text-white" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        The processing happens where your
                        file already is.
                      </p>

                      <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:text-sm">
                        For supported browser-based tools,
                        your browser handles the processing
                        locally. You choose a file, the
                        browser processes it, and you download
                        the result.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-semibold">
                    <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-600 shadow-sm">
                      Your file
                    </span>

                    <ArrowRight className="h-3 w-3 text-blue-500" />

                    <span className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-blue-700 shadow-sm">
                      Your browser
                    </span>

                    <ArrowRight className="h-3 w-3 text-indigo-500" />

                    <span className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-violet-700 shadow-sm">
                      Download
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust points */}
            <div className="motion-safe:animate-[heroFadeUp_0.7s_0.4s_ease-out_both] mt-8 flex flex-wrap justify-center gap-x-5 gap-y-3 text-xs text-slate-500 lg:justify-start">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Processed locally
              </div>

              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                No unnecessary uploads
              </div>

              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-violet-500" />
                No signup for basic tools
              </div>
            </div>
          </div>

          {/* =================================================
              RIGHT VISUAL
          ================================================== */}

          <div
            className="motion-safe:animate-[heroFadeUp_0.9s_0.2s_ease-out_both] relative mx-auto w-full max-w-xl"
            aria-label="Visual showing local browser processing"
          >
            {/* Color aura */}
            <div className="absolute left-1/2 top-1/2 h-[75%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-400/20 via-indigo-400/15 to-violet-400/20 blur-[80px]" />

            {/* Top floating badge */}
            <div className="motion-safe:animate-[heroFloat_5s_ease-in-out_infinite] absolute -right-1 -top-5 z-20 hidden items-center gap-2 rounded-xl border border-blue-100 bg-white/90 px-3 py-2.5 shadow-xl shadow-blue-900/5 backdrop-blur-xl sm:flex lg:-right-5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Zap className="h-4 w-4 text-white" />
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-800">
                  Fast processing
                </p>

                <p className="text-[9px] text-slate-500">
                  Powered by your browser
                </p>
              </div>
            </div>

            {/* Browser */}
            <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/90 shadow-[0_35px_90px_-30px_rgba(30,64,175,0.28)] backdrop-blur-xl">
              {/* Browser bar */}
              <div className="flex h-12 items-center border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/60 px-4">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </div>

                <div className="mx-auto hidden h-7 max-w-sm flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white/80 sm:flex">
                  <LockKeyhole className="mr-1.5 h-3 w-3 text-emerald-500" />

                  <span className="text-[10px] font-medium text-slate-500">
                    workabhi.com/tools
                  </span>
                </div>

                <div className="w-12" />
              </div>

              {/* Browser body */}
              <div className="bg-gradient-to-br from-white via-blue-50/20 to-violet-50/20 p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 shadow-sm">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>

                      <p className="text-xs font-bold text-slate-800">
                        WorkAbhi
                      </p>
                    </div>

                    <p className="mt-2 text-[10px] text-slate-500">
                      Private image processing
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 motion-safe:animate-ping" />

                      <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
                    </span>

                    <span className="text-[9px] font-bold text-emerald-700">
                      ON DEVICE
                    </span>
                  </div>
                </div>

                {/* Processing card */}
                <div className="relative mt-6 overflow-hidden rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
                  {/* animated top line */}
                  <div className="absolute left-0 top-0 h-0.5 w-1/3 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 motion-safe:animate-[heroProgress_3s_linear_infinite]" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-slate-800">
                        Processing your file
                      </p>

                      <p className="mt-1 text-[9px] text-slate-500">
                        Everything happens inside your browser
                      </p>
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                      <LockKeyhole className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>

                  {/* Flow */}
                  <div className="relative mt-7 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1.5 sm:gap-3">
                    {/* File */}
                    <div className="group rounded-xl border border-slate-200 bg-slate-50 p-3 text-center transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                        <FileImage className="h-5 w-5 text-blue-600" />
                      </div>

                      <p className="mt-2 truncate text-[9px] font-bold text-slate-700">
                        image.jpg
                      </p>

                      <p className="mt-0.5 text-[8px] text-slate-400">
                        2.4 MB
                      </p>
                    </div>

                    <div className="relative flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-indigo-400" />

                      <span className="absolute h-1.5 w-1.5 rounded-full bg-indigo-500 motion-safe:animate-[heroDot_2s_linear_infinite]" />
                    </div>

                    {/* Browser */}
                    <div className="relative rounded-xl border border-indigo-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-3 text-center shadow-sm">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20">
                        <Monitor className="h-5 w-5 text-white" />
                      </div>

                      <p className="mt-2 text-[9px] font-bold text-indigo-900">
                        Your browser
                      </p>

                      <p className="mt-0.5 text-[8px] font-semibold text-indigo-600">
                        Processing
                      </p>

                      <span className="absolute -inset-px rounded-xl border border-indigo-300/40 motion-safe:animate-pulse" />
                    </div>

                    <div className="relative flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-violet-400" />

                      <span className="absolute h-1.5 w-1.5 rounded-full bg-violet-500 motion-safe:animate-[heroDot_2s_1s_linear_infinite]" />
                    </div>

                    {/* Result */}
                    <div className="group rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/15">
                        <Check className="h-5 w-5 text-white" />
                      </div>

                      <p className="mt-2 text-[9px] font-bold text-emerald-800">
                        Ready
                      </p>

                      <p className="mt-0.5 text-[8px] text-emerald-600">
                        Download
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[9px] font-medium text-slate-500">
                        Local processing
                      </span>

                      <span className="text-[9px] font-bold text-blue-600">
                        84%
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="relative h-full w-[84%] overflow-hidden rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500">
                        <div className="absolute inset-y-0 left-0 w-1/3 bg-white/30 motion-safe:animate-[heroShimmer_1.5s_linear_infinite]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom cards */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="group flex items-center gap-2 rounded-xl border border-emerald-100 bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-sm">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-bold text-slate-700">
                        File stays local
                      </p>

                      <p className="mt-0.5 text-[8px] text-slate-400">
                        No unnecessary upload
                      </p>
                    </div>
                  </div>

                  <div className="group flex items-center gap-2 rounded-xl border border-violet-100 bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-sm">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                      <MousePointer2 className="h-4 w-4 text-violet-600" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-bold text-slate-700">
                        Simple workflow
                      </p>

                      <p className="mt-0.5 text-[8px] text-slate-400">
                        Process &amp; download
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom floating privacy */}
            <div className="motion-safe:animate-[heroFloat_6s_0.5s_ease-in-out_infinite] absolute -bottom-5 -left-2 z-20 hidden items-center gap-2.5 rounded-xl border border-blue-100 bg-white/95 px-3.5 py-3 shadow-xl shadow-blue-900/10 backdrop-blur-xl sm:flex lg:-left-7">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-800">
                  Privacy-first
                </p>

                <p className="text-[9px] text-slate-500">
                  Where your files already are
                </p>
              </div>
            </div>

            {/* Upload badge */}
            <div className="absolute bottom-[18%] -right-2 z-20 hidden items-center gap-2 rounded-lg border border-violet-100 bg-white/95 px-3 py-2 shadow-lg shadow-violet-900/10 backdrop-blur-xl lg:flex">
              <Upload className="h-3.5 w-3.5 text-violet-600" />

              <span className="text-[9px] font-semibold text-slate-700">
                No unnecessary upload
              </span>
            </div>
          </div>
        </div>

        {/* =====================================================
            TRUST BAR
        ====================================================== */}

        <div className="motion-safe:animate-[heroFadeUp_0.8s_0.55s_ease-out_both] mx-auto mt-16 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-4 rounded-2xl border border-slate-200 bg-white/70 px-5 py-5 text-xs text-slate-500 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Privacy-first
          </div>

          <div className="hidden h-4 w-px bg-slate-200 sm:block" />

          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-blue-500" />
            Browser-based
          </div>

          <div className="hidden h-4 w-px bg-slate-200 sm:block" />

          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Fast &amp; simple
          </div>

          <div className="hidden h-4 w-px bg-slate-200 sm:block" />

          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-violet-500" />
            Images &amp; documents
          </div>
        </div>
      </div>

      {/* =====================================================
          ANIMATIONS
      ====================================================== */}

      <style jsx>{`
        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heroFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes heroProgress {
          0% {
            transform: translateX(-100%);
          }

          100% {
            transform: translateX(400%);
          }
        }

        @keyframes heroShimmer {
          from {
            transform: translateX(-150%);
          }

          to {
            transform: translateX(450%);
          }
        }

        @keyframes heroDot {
          0% {
            transform: translateX(-8px);
            opacity: 0;
          }

          25% {
            opacity: 1;
          }

          75% {
            opacity: 1;
          }

          100% {
            transform: translateX(8px);
            opacity: 0;
          }
        }

        @keyframes heroScan {
          from {
            transform: translateX(-20%);
          }

          to {
            transform: translateX(20%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </section>
  );
}