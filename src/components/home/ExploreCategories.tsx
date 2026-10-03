import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Container from "@/components/layout/Container";
import { categories } from "@/config/categories";
import { getToolsByCategory } from "@/lib/toolRegistry";

export default function ExploreCategories() { return <section className="border-y border-border bg-white/70 py-20 sm:py-24"><Container>
  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Explore by category</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Find the right tool faster</h2>
  <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{categories.map((category) => { const count = getToolsByCategory(category.id).length; return <Link key={category.id} href={`/tools/${category.id}`} className="group rounded-2xl border border-border bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.02)] hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
    <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{category.icon}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">{count} tools</span></div><h3 className="mt-7 font-semibold group-hover:text-primary">{category.name}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{category.description}</p><div className="mt-5 flex items-center gap-1 text-sm font-semibold text-slate-700 group-hover:text-primary">Explore <ArrowUpRight className="h-4 w-4" /></div>
  </Link>; })}</div>
</Container></section>; }
