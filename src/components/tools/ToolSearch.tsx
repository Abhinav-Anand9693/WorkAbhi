"use client";

import { useMemo, useState } from "react";
import { searchTools } from "@/lib/toolSearch";
import ToolGrid from "./ToolGrid";

export default function ToolSearch() {
  const [
    query,
    setQuery
  ] = useState("");

  const results = useMemo(
    () => searchTools(query),
    [query]
  );

  return (
    <div>

      <input
        value={query}
        onChange={(event) =>
          setQuery(event.target.value)
        }
        placeholder="Search 481 tools..."
        aria-label="Search WorkAbhi tools"
        className="
          w-full rounded-2xl
          border border-border
          bg-background
          px-5 py-4
          text-sm
          outline-none
          transition
          focus:border-primary
          focus:ring-4
          focus:ring-primary/10
        "
      />

      <div className="mb-5 mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {results.length} tools
        </p>
      </div>

      <ToolGrid tools={results} />

    </div>
  );
}