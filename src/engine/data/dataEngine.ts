/* WorkAbhi — File & Data Tools engine
 * Client-side only. No uploads, APIs, DB, or external processing.
 */

export type DataToolId =
  | "csv-viewer"
  | "csv-formatter"
  | "csv-to-json"
  | "json-to-csv"
  | "csv-to-tsv"
  | "tsv-to-csv"
  | "csv-column-extractor"
  | "csv-row-filter"
  | "csv-duplicate-remover"
  | "csv-sorter"
  | "csv-splitter"
  | "csv-merger"
  | "json-to-xml"
  | "xml-to-json"
  | "json-to-yaml"
  | "yaml-to-json"
  | "txt-to-csv"
  | "txt-file-cleaner"
  | "file-hash-calculator"
  | "file-metadata-viewer";

export interface DataRow {
  [key: string]: string;
}

export interface ParsedTable {
  headers: string[];
  rows: DataRow[];
}

export interface ProgressReporter {
  (value: number): void;
}

export interface ProcessOptions {
  signal?: AbortSignal;
  onProgress?: ProgressReporter;
}

function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("Operation cancelled.", "AbortError");
  }
}

function report(onProgress: ProgressReporter | undefined, value: number) {
  onProgress?.(Math.max(0, Math.min(100, Math.round(value))));
}

function detectDelimiter(text: string): string {
  const sample = text.replace(/^\uFEFF/, "").split(/\r?\n/).slice(0, 10).join("\n");
  const candidates = [",", "\t", ";", "|"];
  let best = ",";
  let bestScore = -1;
  for (const delimiter of candidates) {
    let score = 0;
    for (const line of sample.split("\n")) {
      let quoted = false;
      let count = 0;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (quoted && line[i + 1] === '"') i++;
          else quoted = !quoted;
        } else if (ch === delimiter && !quoted) count++;
      }
      score += count;
    }
    if (score > bestScore) {
      bestScore = score;
      best = delimiter;
    }
  }
  return best;
}

export function parseDelimited(text: string, delimiter = detectDelimiter(text), options: ProcessOptions = {}): ParsedTable {
  checkAbort(options.signal);
  const input = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < input.length; i++) {
    if ((i & 0x3fff) === 0) {
      checkAbort(options.signal);
      report(options.onProgress, (i / Math.max(1, input.length)) * 70);
    }
    const ch = input[i];

    if (ch === '"') {
      if (quoted && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some(v => v.length > 0)) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }

  if (quoted) throw new Error("Invalid CSV/TSV: an opening quote has no closing quote.");
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some(v => v.length > 0)) rows.push(row);
  }

  if (!rows.length) return { headers: [], rows: [] };

  const headers = makeUniqueHeaders(rows[0]);
  const data: DataRow[] = rows.slice(1).map(values => {
    const obj: DataRow = {};
    headers.forEach((h, index) => (obj[h] = values[index] ?? ""));
    return obj;
  });

  report(options.onProgress, 100);
  return { headers, rows: data };
}

function makeUniqueHeaders(values: string[]): string[] {
  const seen = new Map<string, number>();
  return values.map((raw, index) => {
    const base = raw.trim() || `Column ${index + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count ? `${base} (${count + 1})` : base;
  });
}

export function tableToDelimited(table: ParsedTable, delimiter = ",", options: ProcessOptions = {}): string {
  checkAbort(options.signal);
  const escape = (value: unknown) => {
    const s = String(value ?? "");
    return /["\r\n]/.test(s) || s.includes(delimiter) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [table.headers.map(escape).join(delimiter)];
  for (let i = 0; i < table.rows.length; i++) {
    if ((i & 0x3ff) === 0) {
      checkAbort(options.signal);
      report(options.onProgress, 70 + (i / Math.max(1, table.rows.length)) * 30);
    }
    lines.push(table.headers.map(h => escape(table.rows[i][h])).join(delimiter));
  }
  report(options.onProgress, 100);
  return lines.join("\r\n");
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("Invalid JSON. Please provide valid JSON data.");
  }
}

function jsonToRows(value: unknown): ParsedTable {
  if (!Array.isArray(value)) value = [value];
  if (!(value as unknown[]).length) return { headers: [], rows: [] };
  const list = value as unknown[];
  const headers = Array.from(
    new Set(list.flatMap(item => item && typeof item === "object" && !Array.isArray(item) ? Object.keys(item as object) : ["value"]))
  );
  return {
    headers,
    rows: list.map(item => {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        const record = item as Record<string, unknown>;
        return Object.fromEntries(headers.map(h => [h, stringifyCell(record[h])]));
      }
      return { value: stringifyCell(item) };
    }),
  };
}

function stringifyCell(value: unknown): string {
  if (value == null) return "";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

export function csvToJson(text: string, options: ProcessOptions = {}): string {
  const table = parseDelimited(text, ",", options);
  const array = table.rows.map(row => Object.fromEntries(table.headers.map(h => [h, row[h] ?? ""])));
  return JSON.stringify(array, null, 2);
}

export function jsonToCsv(text: string, options: ProcessOptions = {}): string {
  return tableToDelimited(jsonToRows(parseJson(text)), ",", options);
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, ch => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[ch]!));
}

export function jsonToXml(text: string, options: ProcessOptions = {}): string {
  const value = parseJson(text);
  checkAbort(options.signal);
  const build = (key: string, item: unknown, level: number): string => {
    checkAbort(options.signal);
    const pad = "  ".repeat(level);
    if (Array.isArray(item)) return item.map(v => build(key, v, level)).join("\n");
    if (item && typeof item === "object") {
      const children = Object.entries(item as Record<string, unknown>)
        .map(([k, v]) => build(safeXmlName(k), v, level + 1))
        .join("\n");
      return `${pad}<${key}>\n${children}\n${pad}</${key}>`;
    }
    return `${pad}<${key}>${escapeXml(stringifyCell(item))}</${key}>`;
  };
  return `<?xml version="1.0" encoding="UTF-8"?>\n${build("root", value, 0)}`;
}

function safeXmlName(name: string): string {
  const cleaned = name.trim().replace(/[^A-Za-z0-9_.-]/g, "_");
  return /^[A-Za-z_]/.test(cleaned) ? cleaned || "item" : `item_${cleaned}`;
}

export function xmlToJson(text: string, options: ProcessOptions = {}): string {
  checkAbort(options.signal);
  const parser = new DOMParser();
  const doc = parser.parseFromString(text.replace(/^\uFEFF/, ""), "application/xml");
  const error = doc.querySelector("parsererror");
  if (error) throw new Error("Invalid XML. Please provide well-formed XML.");

  const nodeToValue = (node: Element): unknown => {
    checkAbort(options.signal);
    const children = Array.from(node.children);
    if (!children.length) return node.textContent ?? "";

    const result: Record<string, unknown> = {};
    for (const child of children) {
      const value = nodeToValue(child);
      if (child.tagName in result) {
        result[child.tagName] = Array.isArray(result[child.tagName])
          ? [...(result[child.tagName] as unknown[]), value]
          : [result[child.tagName], value];
      } else {
        result[child.tagName] = value;
      }
    }
    if (node.attributes.length) {
      result["@attributes"] = Object.fromEntries(Array.from(node.attributes).map(a => [a.name, a.value]));
    }
    return result;
  };

  return JSON.stringify({ [doc.documentElement.tagName]: nodeToValue(doc.documentElement) }, null, 2);
}

function yamlScalar(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "string" && /^[A-Za-z0-9_./:@+-]+$/.test(value)) return value;
  return JSON.stringify(String(value));
}

export function jsonToYaml(text: string, options: ProcessOptions = {}): string {
  const value = parseJson(text);
  const build = (item: unknown, level: number): string => {
    checkAbort(options.signal);
    const pad = "  ".repeat(level);
    if (Array.isArray(item)) {
      return item.length ? item.map(v => `${pad}- ${isComplex(v) ? `\n${build(v, level + 1)}` : yamlScalar(v)}`).join("\n") : `${pad}[]`;
    }
    if (item && typeof item === "object") {
      const entries = Object.entries(item as Record<string, unknown>);
      if (!entries.length) return `${pad}{}`;
      return entries.map(([k, v]) => `${pad}${JSON.stringify(k)}: ${isComplex(v) ? `\n${build(v, level + 1)}` : yamlScalar(v)}`).join("\n");
    }
    return `${pad}${yamlScalar(item)}`;
  };
  return build(value, 0);
}

function isComplex(value: unknown): boolean {
  return Array.isArray(value) || (value !== null && typeof value === "object");
}

export async function yamlToJson(text: string, options: ProcessOptions = {}): Promise<string> {
  checkAbort(options.signal);
  // Lazy-load js-yaml so the rest of the data tools stay dependency-light.
  const mod = await import("js-yaml");
  checkAbort(options.signal);
  const value = mod.load(text.replace(/^\uFEFF/, ""));
  report(options.onProgress, 100);
  return JSON.stringify(value, null, 2);
}

export function txtToCsv(text: string, options: ProcessOptions = {}): string {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim() !== "");
  const rows = lines.map(line => line.split(/\s+/));
  const width = Math.max(0, ...rows.map(r => r.length));
  const table: ParsedTable = {
    headers: Array.from({ length: width }, (_, i) => `Column ${i + 1}`),
    rows: rows.map(r => Object.fromEntries(Array.from({ length: width }, (_, i) => [`Column ${i + 1}`, r[i] ?? ""]))),
  };
  return tableToDelimited(table, ",", options);
}

export function cleanText(text: string, options: ProcessOptions = {}): string {
  checkAbort(options.signal);
  const normalized = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map(line => line.replace(/[ \t]+$/g, "").replace(/[ \t]+/g, " ").trim())
    .filter(line => line.length > 0)
    .join("\n");
  report(options.onProgress, 100);
  return normalized;
}

export function sortTable(table: ParsedTable, column: string, descending = false): ParsedTable {
  const rows = [...table.rows];
  const compare = (a: DataRow, b: DataRow) => {
    const av = a[column] ?? "";
    const bv = b[column] ?? "";
    const an = Number(av), bn = Number(bv);
    let result: number;
    if (av !== "" && bv !== "" && Number.isFinite(an) && Number.isFinite(bn)) result = an - bn;
    else result = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
    return descending ? -result : result;
  };
  rows.sort(compare);
  return { headers: [...table.headers], rows };
}

export function filterTable(table: ParsedTable, column: string, query: string): ParsedTable {
  const q = query.toLowerCase();
  return {
    headers: [...table.headers],
    rows: table.rows.filter(row => String(row[column] ?? "").toLowerCase().includes(q)),
  };
}

export function removeDuplicates(table: ParsedTable): ParsedTable {
  const seen = new Set<string>();
  const rows = table.rows.filter(row => {
    const key = table.headers.map(h => row[h] ?? "").join("\u001f");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { headers: [...table.headers], rows };
}

export function extractColumns(table: ParsedTable, columns: string[]): ParsedTable {
  const selected = columns.filter(c => table.headers.includes(c));
  return {
    headers: selected,
    rows: table.rows.map(row => Object.fromEntries(selected.map(c => [c, row[c] ?? ""]))),
  };
}

export function splitTable(table: ParsedTable, chunkSize: number): ParsedTable[] {
  if (!Number.isInteger(chunkSize) || chunkSize < 1) throw new Error("Rows per file must be a positive integer.");
  const result: ParsedTable[] = [];
  for (let i = 0; i < table.rows.length; i += chunkSize) {
    result.push({ headers: [...table.headers], rows: table.rows.slice(i, i + chunkSize) });
  }
  return result;
}

export function mergeTables(tables: ParsedTable[]): ParsedTable {
  if (!tables.length) return { headers: [], rows: [] };
  const headers = Array.from(new Set(tables.flatMap(t => t.headers)));
  return {
    headers,
    rows: tables.flatMap(t => t.rows.map(row => Object.fromEntries(headers.map(h => [h, row[h] ?? ""])))),
  };
}

export async function shaFile(file: File, algorithm: "SHA-256" | "SHA-384" | "SHA-512", options: ProcessOptions = {}): Promise<string> {
  checkAbort(options.signal);
  const buffer = await file.arrayBuffer();
  checkAbort(options.signal);
  report(options.onProgress, 70);
  const digest = await crypto.subtle.digest(algorithm, buffer);
  report(options.onProgress, 100);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export interface FileMetadata {
  name: string;
  type: string;
  size: number;
  sizeFormatted: string;
  lastModified: string;
  extension: string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i ? 2 : 0)} ${units[i]}`;
}

export function getFileMetadata(file: File): FileMetadata {
  const dot = file.name.lastIndexOf(".");
  return {
    name: file.name,
    type: file.type || "unknown",
    size: file.size,
    sizeFormatted: formatBytes(file.size),
    lastModified: file.lastModified ? new Date(file.lastModified).toLocaleString() : "Unknown",
    extension: dot > 0 ? file.name.slice(dot + 1).toLowerCase() : "",
  };
}

export async function processDataTool(
  toolId: DataToolId,
  input: string,
  options: ProcessOptions = {},
  extra: Record<string, unknown> = {},
): Promise<{ text: string; filename: string; mimeType: string; files?: Array<{ name: string; text: string }> }> {
  checkAbort(options.signal);

  switch (toolId) {
    case "csv-viewer":
    case "csv-formatter": {
      const table = parseDelimited(input, ",", options);
      return {
        text: tableToDelimited(table, ",", options),
        filename: toolId === "csv-viewer" ? "view.csv" : "formatted.csv",
        mimeType: "text/csv;charset=utf-8",
      };
    }
    case "csv-to-json":
      return { text: csvToJson(input, options), filename: "converted.json", mimeType: "application/json;charset=utf-8" };
    case "json-to-csv":
      return { text: jsonToCsv(input, options), filename: "converted.csv", mimeType: "text/csv;charset=utf-8" };
    case "csv-to-tsv":
      return { text: tableToDelimited(parseDelimited(input, ",", options), "\t", options), filename: "converted.tsv", mimeType: "text/tab-separated-values;charset=utf-8" };
    case "tsv-to-csv":
      return { text: tableToDelimited(parseDelimited(input, "\t", options), ",", options), filename: "converted.csv", mimeType: "text/csv;charset=utf-8" };
    case "csv-column-extractor": {
      const table = parseDelimited(input, ",", options);
      const columns = Array.isArray(extra.columns) ? extra.columns.map(String) : [];
      return { text: tableToDelimited(extractColumns(table, columns), ",", options), filename: "selected-columns.csv", mimeType: "text/csv;charset=utf-8" };
    }
    case "csv-row-filter": {
      const table = parseDelimited(input, ",", options);
      const filtered = filterTable(table, String(extra.column ?? table.headers[0] ?? ""), String(extra.query ?? ""));
      return { text: tableToDelimited(filtered, ",", options), filename: "filtered.csv", mimeType: "text/csv;charset=utf-8" };
    }
    case "csv-duplicate-remover": {
      const table = parseDelimited(input, ",", options);
      return { text: tableToDelimited(removeDuplicates(table), ",", options), filename: "deduplicated.csv", mimeType: "text/csv;charset=utf-8" };
    }
    case "csv-sorter": {
      const table = parseDelimited(input, ",", options);
      return { text: tableToDelimited(sortTable(table, String(extra.column ?? table.headers[0] ?? ""), Boolean(extra.descending)), ",", options), filename: "sorted.csv", mimeType: "text/csv;charset=utf-8" };
    }
    case "csv-splitter": {
      const table = parseDelimited(input, ",", options);
      const parts = splitTable(table, Number(extra.chunkSize ?? 1000));
      return {
        text: parts[0] ? tableToDelimited(parts[0], ",", options) : "",
        filename: "part-1.csv",
        mimeType: "text/csv;charset=utf-8",
        files: parts.map((part, i) => ({ name: `part-${i + 1}.csv`, text: tableToDelimited(part, ",", options) })),
      };
    }
    case "csv-merger": {
      const tables = Array.isArray(extra.inputs) ? await Promise.all(extra.inputs.map(v => Promise.resolve(parseDelimited(String(v), ",", options)))) : [parseDelimited(input, ",", options)];
      return { text: tableToDelimited(mergeTables(tables), ",", options), filename: "merged.csv", mimeType: "text/csv;charset=utf-8" };
    }
    case "json-to-xml":
      return { text: jsonToXml(input, options), filename: "converted.xml", mimeType: "application/xml;charset=utf-8" };
    case "xml-to-json":
      return { text: xmlToJson(input, options), filename: "converted.json", mimeType: "application/json;charset=utf-8" };
    case "json-to-yaml":
      return { text: jsonToYaml(input, options), filename: "converted.yaml", mimeType: "text/yaml;charset=utf-8" };
    case "yaml-to-json":
      return { text: await yamlToJson(input, options), filename: "converted.json", mimeType: "application/json;charset=utf-8" };
    case "txt-to-csv":
      return { text: txtToCsv(input, options), filename: "converted.csv", mimeType: "text/csv;charset=utf-8" };
    case "txt-file-cleaner":
      return { text: cleanText(input, options), filename: "cleaned.txt", mimeType: "text/plain;charset=utf-8" };
    default:
      throw new Error(`Unsupported data tool: ${toolId}`);
  }
}
