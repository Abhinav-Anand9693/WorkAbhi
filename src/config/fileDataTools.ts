// WorkAbhi — 20 File/Data tools
// Merge these entries into src/config/tools.ts using your existing Tool interface.
// The component/engine pair is shared by all 20 tools.

export const fileDataToolIds = [
  "csv-viewer",
  "csv-formatter",
  "csv-to-json",
  "json-to-csv",
  "csv-to-tsv",
  "tsv-to-csv",
  "csv-column-extractor",
  "csv-row-filter",
  "csv-duplicate-remover",
  "csv-sorter",
  "csv-splitter",
  "csv-merger",
  "json-to-xml",
  "xml-to-json",
  "json-to-yaml",
  "yaml-to-json",
  "txt-to-csv",
  "txt-file-cleaner",
  "file-hash-calculator",
  "file-metadata-viewer",
] as const;

export const fileDataToolDefinitions = [
  ["csv-viewer", "CSV Viewer", "View CSV files in a clean browser table."],
  ["csv-formatter", "CSV Formatter", "Clean and normalize CSV structure in your browser."],
  ["csv-to-json", "CSV to JSON", "Convert CSV data to JSON locally."],
  ["json-to-csv", "JSON to CSV", "Convert JSON arrays or objects to CSV locally."],
  ["csv-to-tsv", "CSV to TSV", "Convert comma-separated data to TSV."],
  ["tsv-to-csv", "TSV to CSV", "Convert tab-separated data to CSV."],
  ["csv-column-extractor", "CSV Column Extractor", "Extract selected columns from CSV data."],
  ["csv-row-filter", "CSV Row Filter", "Filter CSV rows by a selected column."],
  ["csv-duplicate-remover", "CSV Duplicate Remover", "Remove duplicate CSV rows locally."],
  ["csv-sorter", "CSV Sorter", "Sort CSV rows by a selected column."],
  ["csv-splitter", "CSV Splitter", "Split a CSV into smaller row-based files."],
  ["csv-merger", "CSV Merger", "Merge multiple CSV files into one CSV."],
  ["json-to-xml", "JSON to XML", "Convert JSON data to XML locally."],
  ["xml-to-json", "XML to JSON", "Convert XML data to JSON locally."],
  ["json-to-yaml", "JSON to YAML", "Convert JSON data to YAML locally."],
  ["yaml-to-json", "YAML to JSON", "Convert YAML data to JSON locally."],
  ["txt-to-csv", "TXT to CSV", "Convert whitespace-separated text into CSV."],
  ["txt-file-cleaner", "TXT File Cleaner", "Normalize whitespace and remove empty lines."],
  ["file-hash-calculator", "File Hash Calculator", "Calculate SHA-256, SHA-384, or SHA-512 locally."],
  ["file-metadata-viewer", "File Metadata Viewer", "View basic file metadata without uploading it."],
] as const;
