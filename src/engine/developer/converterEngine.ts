import * as yaml from "js-yaml";
import { marked } from "marked";
import TurndownService from "turndown";

export function jsonToCSV(
  input: string
): string {
  const parsed: unknown =
    JSON.parse(input);

  if (!Array.isArray(parsed)) {
    throw new Error(
      "JSON to CSV requires a JSON array of objects."
    );
  }

  if (parsed.length === 0) {
    return "";
  }

  const objects =
    parsed.filter(
      (
        item
      ): item is Record<
        string,
        unknown
      > =>
        typeof item ===
          "object" &&
        item !== null &&
        !Array.isArray(item)
    );

  if (
    objects.length !==
    parsed.length
  ) {
    throw new Error(
      "Every JSON array item must be an object."
    );
  }

  const headers =
    Array.from(
      new Set(
        objects.flatMap(
          (item) =>
            Object.keys(item)
        )
      )
    );

  const escapeCSV = (
    value: unknown
  ): string => {
    const text =
      value === null ||
      value === undefined
        ? ""
        : typeof value ===
            "object"
          ? JSON.stringify(
              value
            )
          : String(value);

    if (
      /[",\n]/.test(text)
    ) {
      return `"${text.replace(
        /"/g,
        '""'
      )}"`;
    }

    return text;
  };

  const rows = objects.map(
    (item) =>
      headers
        .map((header) =>
          escapeCSV(
            item[header]
          )
        )
        .join(",")
  );

  return [
    headers
      .map(escapeCSV)
      .join(","),
    ...rows,
  ].join("\n");
}

function parseCSVLine(
  line: string
): string[] {
  const result: string[] = [];

  let current = "";
  let quoted = false;

  for (
    let i = 0;
    i < line.length;
    i++
  ) {
    const char =
      line[i];

    if (char === '"') {
      if (
        quoted &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }

      continue;
    }

    if (
      char === "," &&
      !quoted
    ) {
      result.push(
        current.trim()
      );
      current = "";
      continue;
    }

    current += char;
  }

  result.push(
    current.trim()
  );

  return result;
}

export function csvToJSON(
  input: string
): string {
  const lines =
    input
      .split(/\r?\n/)
      .filter(
        (line) =>
          line.trim()
      );

  if (lines.length < 1) {
    return "[]";
  }

  const headers =
    parseCSVLine(
      lines[0]
    );

  const rows =
    lines.slice(1).map(
      (line) => {
        const values =
          parseCSVLine(
            line
          );

        const item: Record<
          string,
          string
        > = {};

        headers.forEach(
          (
            header,
            index
          ) => {
            item[header] =
              values[index] ??
              "";
          }
        );

        return item;
      }
    );

  return JSON.stringify(
    rows,
    null,
    2
  );
}

export function yamlToJSON(
  input: string
): string {
  const parsed =
    yaml.load(input);

  return JSON.stringify(
    parsed,
    null,
    2
  );
}

export function jsonToYAML(
  input: string
): string {
  const parsed =
    JSON.parse(input);

  return yaml.dump(
    parsed,
    {
      noRefs: true,
      lineWidth: 120,
    }
  );
}

export function formatYAML(
  input: string
): string {
  const parsed =
    yaml.load(input);

  return yaml.dump(
    parsed,
    {
      noRefs: true,
      lineWidth: 120,
    }
  );
}

export async function markdownToHTML(
  input: string
): Promise<string> {
  return String(
    await marked.parse(
      input
    )
  );
}

export async function markdownToPreviewHTML(
  input: string
): Promise<string> {
  return markdownToHTML(
    input
  );
}

export function htmlToMarkdown(
  input: string
): string {
  const service =
    new TurndownService({
      headingStyle:
        "atx",
      bulletListMarker:
        "-",
      codeBlockStyle:
        "fenced",
    });

  return service.turndown(
    input
  );
}