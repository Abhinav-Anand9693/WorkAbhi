import { Check, LockKeyhole, Sparkles, Zap } from "lucide-react";
import Container from "@/components/layout/Container";

const benefits = [
  { title: "Free to use", text: "Core tools are available without requiring a subscription.", icon: Sparkles },
  { title: "Privacy-conscious", text: "Supported tools can process files locally in your browser.", icon: LockKeyhole },
  { title: "Fast workflow", text: "Simple tools avoid unnecessary steps and server round trips where possible.", icon: Zap },
  { title: "Task-focused", text: "Tools are organized around real tasks instead of making you hunt through menus.", icon: Check },
];

export default function WhyWorkAbhi() { return <section className="py-20 sm:py-24"><Container><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Why WorkAbhi</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">One place for the tools you actually need.</h2></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(({title,text,icon:Icon}) => <article key={title} className="rounded-2xl border border-border bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.025)]"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-primary"><Icon className="h-5 w-5" /></div><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div></Container></section>; }
