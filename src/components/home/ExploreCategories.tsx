import Link from "next/link";
import Container from "@/components/layout/Container";
import { categories } from "@/config/categories";
import { getToolsByCategory } from "@/lib/toolRegistry";

export default function ExploreCategories() {
  return (
    <section className="
      border-y
      border-border
      bg-muted/30
      py-20
    ">

      <Container>

        <p className="
          text-sm
          font-semibold
          text-primary
        ">
          EXPLORE BY CATEGORY
        </p>

        <h2 className="
          mt-2
          text-3xl
          font-bold
          tracking-tight
        ">
          Find the right tool faster
        </h2>

        <div className="
          mt-10
          grid
          gap-4
          sm:grid-cols-2
          lg:grid-cols-3
          xl:grid-cols-4
        ">

          {categories.map((category) => {

            const count =
              getToolsByCategory(
                category.id
              ).length;

            return (
              <Link
                key={category.id}
                href={`/tools/${category.id}`}
                className="
                  group
                  rounded-2xl
                  border border-border
                  bg-background
                  p-5
                  transition
                  hover:-translate-y-0.5
                  hover:shadow-md
                "
              >

                <div className="
                  flex
                  items-center
                  justify-between
                ">

                  <span className="
                    rounded-xl
                    border border-border
                    px-3 py-2
                    text-xs
                  ">
                    {category.icon}
                  </span>

                  <span className="
                    text-xs
                    text-muted-foreground
                  ">
                    {count} tools
                  </span>

                </div>

                <h3 className="
                  mt-5
                  font-semibold
                  group-hover:text-primary
                ">
                  {category.name}
                </h3>

                <p className="
                  mt-2
                  text-sm
                  leading-6
                  text-muted-foreground
                ">
                  {category.description}
                </p>

              </Link>
            );
          })}

        </div>

      </Container>

    </section>
  );
}