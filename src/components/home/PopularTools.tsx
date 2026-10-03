import Link from "next/link";
import { ArrowUpRight, Wrench } from "lucide-react";
import Container from "@/components/layout/Container";
import { getPopularTools } from "@/lib/toolRegistry";

export default function PopularTools() {
  const tools = getPopularTools();
  return <section className="py-20 sm:py-24"><Container>
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Popular tools</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Start with something useful</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Simple tools for calculations, images, documents and everyday tasks.</p></div><Link href="/tools" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-blue-700">View all tools <ArrowUpRight className="h-4 w-4" /></Link></div>
    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{tools.slice(0,8).map((tool) => <Link key={tool.id} href={`/tool/${tool.id}`} className="group flex min-h-[210px] flex-col rounded-2xl border border-border bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.025)] hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
      <div className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600"><Wrench className="h-3 w-3" />{tool.category}</span><ArrowUpRight className="h-4 w-4 text-slate-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" /></div>
      <h3 className="mt-7 text-lg font-semibold tracking-tight group-hover:text-primary">{tool.name}</h3><p className="mt-2 min-h-[72px] text-sm leading-6 text-muted-foreground">{tool.description}</p><span className="mt-auto pt-5 text-sm font-semibold text-slate-700 group-hover:text-primary">Open tool →</span>
    </Link>)}</div>
  </Container></section>;
}
