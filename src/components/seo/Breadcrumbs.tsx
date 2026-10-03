import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs({
  items
}: {
  items: Array<{ name: string; href: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground/50" />
            )}
            <Link
              href={item.href}
              aria-current={index === items.length - 1 ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground ${
                index === items.length - 1 ? "font-medium text-foreground" : ""
              }`}
            >
              {index === 0 && <Home aria-hidden="true" className="h-3.5 w-3.5" />}
              {item.name}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
