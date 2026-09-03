import Link from "next/link";

export default function Breadcrumbs({
  items
}: {
  items: Array<{
    name: string;
    href: string;
  }>;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="
        text-sm
        text-muted-foreground
      "
    >
      <ol className="
        flex
        flex-wrap
        items-center
        gap-2
      ">

        {items.map(
          (item, index) => (
            <li
              key={item.href}
              className="
                flex
                items-center
                gap-2
              "
            >

              {index > 0 && (
                <span>/</span>
              )}

              <Link
                href={item.href}
                className="hover:text-foreground"
              >
                {item.name}
              </Link>

            </li>
          )
        )}

      </ol>
    </nav>
  );
}