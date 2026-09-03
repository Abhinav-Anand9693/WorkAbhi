import type { ToolFAQ } from "@/types/tool";

export default function FAQ({
  items
}: {
  items: ToolFAQ[];
}) {
  return (
    <section className="mt-16">

      <h2 className="
        text-2xl
        font-bold
      ">
        Frequently Asked Questions
      </h2>

      <div className="
        mt-6
        divide-y
        rounded-2xl
        border
        border-border
      ">

        {items.map((item) => (
          <details
            key={item.question}
            className="p-5"
          >

            <summary className="
              cursor-pointer
              font-medium
            ">
              {item.question}
            </summary>

            <p className="
              mt-3
              text-sm
              leading-6
              text-muted-foreground
            ">
              {item.answer}
            </p>

          </details>
        ))}

      </div>

    </section>
  );
}