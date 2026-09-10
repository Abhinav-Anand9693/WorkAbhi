import * as prettier from "prettier/standalone";
import parserBabel from "prettier/plugins/babel";
import parserEstree from "prettier/plugins/estree";
import parserHtml from "prettier/plugins/html";
import parserPostcss from "prettier/plugins/postcss";
import parserTypescript from "prettier/plugins/typescript";

export async function formatJavaScript(
  input: string
): Promise<string> {
  return prettier.format(input, {
    parser: "babel",
    plugins: [
      parserBabel,
      parserEstree,
      parserTypescript,
    ],
    semi: true,
    singleQuote: false,
  });
}

export async function formatTypeScript(
  input: string
): Promise<string> {
  return prettier.format(input, {
    parser: "typescript",
    plugins: [
      parserBabel,
      parserEstree,
      parserTypescript,
    ],
    semi: true,
    singleQuote: false,
  });
}

export async function formatHTML(
  input: string
): Promise<string> {
  return prettier.format(input, {
    parser: "html",
    plugins: [parserHtml],
    tabWidth: 2,
    printWidth: 100,
  });
}

export async function formatCSS(
  input: string
): Promise<string> {
  return prettier.format(input, {
    parser: "css",
    plugins: [parserPostcss],
    tabWidth: 2,
    printWidth: 100,
  });
}

function indent(
  level: number
): string {
  return "  ".repeat(level);
}

export function formatXML(
  input: string
): string {
  const cleaned =
    input
      .replace(/>\s+</g, "><")
      .trim();

  const tokens =
    cleaned
      .replace(
        /(<[^>]+>)/g,
        "\n$1\n"
      )
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  let level = 0;
  const output: string[] = [];

  for (const token of tokens) {
    if (
      /^<\//.test(token)
    ) {
      level = Math.max(
        0,
        level - 1
      );
    }

    output.push(
      indent(level) + token
    );

    if (
      /^<[^!?/][^>]*[^/]?>$/.test(
        token
      ) &&
      !/<\/[^>]+>$/.test(token)
    ) {
      level += 1;
    }
  }

  return output.join("\n");
}

export function minifyXML(
  input: string
): string {
  return input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function minifyHTML(
  input: string
): string {
  return input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim();
}

export function minifyCSS(
  input: string
): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

export function minifyJavaScript(
  input: string
): string {
  return input
    .replace(
      /\/\*[\s\S]*?\*\//g,
      ""
    )
    .replace(
      /(^|[^:])\/\/.*$/gm,
      "$1"
    )
    .replace(/\s+/g, " ")
    .trim();
}

const SQL_KEYWORDS =
  [
    "SELECT",
    "FROM",
    "WHERE",
    "GROUP BY",
    "ORDER BY",
    "HAVING",
    "LIMIT",
    "OFFSET",
    "JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "OUTER JOIN",
    "ON",
    "AND",
    "OR",
    "UNION",
    "VALUES",
    "SET",
    "INSERT INTO",
    "UPDATE",
    "DELETE FROM",
    "CREATE TABLE",
    "ALTER TABLE",
    "DROP TABLE",
  ] as const;

export function formatSQL(
  input: string
): string {
  let sql = input
    .replace(/\s+/g, " ")
    .trim();

  for (const keyword of SQL_KEYWORDS) {
    const escaped =
      keyword.replace(
        " ",
        "\\s+"
      );

    sql = sql.replace(
      new RegExp(
        `\\b${escaped}\\b`,
        "gi"
      ),
      `\n${keyword}`
    );
  }

  sql = sql
    .replace(
      /\b(AND|OR)\b/gi,
      "\n  $1"
    )
    .replace(
      /,\s*/g,
      ",\n  "
    )
    .replace(
      /\s*;\s*/g,
      ";\n"
    )
    .trim();

  return sql;
}

export function minifySQL(
  input: string
): string {
  return input
    .replace(
      /--.*$/gm,
      ""
    )
    .replace(
      /\/\*[\s\S]*?\*\//g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}