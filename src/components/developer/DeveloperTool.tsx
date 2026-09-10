"use client";

import {
  useState,
} from "react";

import {
  formatJavaScript,
  formatTypeScript,
  formatHTML,
  formatCSS,
  formatXML,
  minifyHTML,
  minifyCSS,
  minifyJavaScript,
  formatSQL,
  minifySQL,
  minifyXML,
} from "@/engine/developer/formatterEngine";

import {
  jsonToCSV,
  csvToJSON,
  yamlToJSON,
  jsonToYAML,
  formatYAML,
  markdownToHTML,
  htmlToMarkdown,
} from "@/engine/developer/converterEngine";

import {
  encodeURL,
  decodeURL,
  encodeBase64,
  decodeBase64,
  decodeJWT,
  generateJWT,
  generateUUID,
  validateUUID,
  testRegex,
  generateRegex,
  timestampToDate,
  dateToTimestamp,
  getUnixTimestamp,
} from "@/engine/developer/developerUtilityEngine";

interface DeveloperToolProps {
  toolId: string;
}

function isEmpty(
  value: string
): boolean {
  return !value.trim();
}

function prettyJSON(
  input: string
): string {
  const parsed =
    JSON.parse(input);

  return JSON.stringify(
    parsed,
    null,
    2
  );
}

function minifyJSON(
  input: string
): string {
  const parsed =
    JSON.parse(input);

  return JSON.stringify(
    parsed
  );
}

function validateJSON(
  input: string
): string {
  try {
    JSON.parse(input);

    return JSON.stringify(
      {
        valid: true,
        message:
          "Valid JSON.",
      },
      null,
      2
    );
  } catch (error) {
    return JSON.stringify(
      {
        valid: false,
        message:
          error instanceof Error
            ? error.message
            : "Invalid JSON.",
      },
      null,
      2
    );
  }
}

function validateXML(
  input: string
): string {
  const parser =
    new DOMParser();

  const document =
    parser.parseFromString(
      input,
      "application/xml"
    );

  const errorNode =
    document.querySelector(
      "parsererror"
    );

  if (errorNode) {
    return JSON.stringify(
      {
        valid: false,
        message:
          "Invalid XML.",
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      valid: true,
      message:
        "Valid XML.",
    },
    null,
    2
  );
}

function escapeHTML(
  input: string
): string {
  return input
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

export default function DeveloperTool({
  toolId,
}: DeveloperToolProps) {
  const [input, setInput] =
    useState("");

  const [
    secondaryInput,
    setSecondaryInput,
  ] = useState("");

  const [output, setOutput] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    regexFlags,
    setRegexFlags,
  ] = useState("g");

  const [
    regexType,
    setRegexType,
  ] = useState("email");

  const [
    markdownPreview,
    setMarkdownPreview,
  ] = useState(false);

  const [
    jwtSecret,
    setJwtSecret,
  ] = useState("");

  async function process() {
    setError("");
    setLoading(true);
    setMarkdownPreview(false);

    try {
      if (
        isEmpty(input) &&
        toolId !==
          "uuid-generator" &&
        toolId !==
          "unix-timestamp-generator"
      ) {
        throw new Error(
          "Please enter some input."
        );
      }

      let result = "";

      switch (toolId) {
        case "json-formatter":
        case "json-beautifier":
          result =
            prettyJSON(input);
          break;

        case "json-validator":
          result =
            validateJSON(input);
          break;

        case "json-minifier":
          result =
            minifyJSON(input);
          break;

        case "json-to-csv":
          result =
            jsonToCSV(input);
          break;

        case "csv-to-json":
          result =
            csvToJSON(input);
          break;

        case "xml-formatter":
          result =
            formatXML(input);
          break;

        case "xml-validator":
          result =
            validateXML(input);
          break;

        case "xml-minifier":
          result =
            minifyXML(input);
          break;

        case "yaml-formatter":
          result =
            formatYAML(input);
          break;

        case "yaml-to-json":
          result =
            yamlToJSON(input);
          break;

        case "json-to-yaml":
          result =
            jsonToYAML(input);
          break;

        case "html-formatter":
          result =
            await formatHTML(input);
          break;

        case "html-minifier":
          result =
            minifyHTML(input);
          break;

        case "css-formatter":
          result =
            await formatCSS(input);
          break;

        case "css-minifier":
          result =
            minifyCSS(input);
          break;

        case "javascript-formatter":
          result =
            await formatJavaScript(
              input
            );
          break;

        case "javascript-minifier":
          result =
            minifyJavaScript(
              input
            );
          break;

        case "sql-formatter":
          result =
            formatSQL(input);
          break;

        case "sql-minifier":
          result =
            minifySQL(input);
          break;

        case "markdown-previewer":
          result =
            await markdownToHTML(
              input
            );

          setMarkdownPreview(true);
          break;

        case "markdown-to-html":
          result =
            await markdownToHTML(
              input
            );
          break;

        case "html-to-markdown":
          result =
            htmlToMarkdown(input);
          break;

        case "url-encoder":
          result =
            encodeURL(input);
          break;

        case "url-decoder":
          result =
            decodeURL(input);
          break;

        case "base64-encoder":
          result =
            encodeBase64(input);
          break;

        case "base64-decoder":
          result =
            decodeBase64(input);
          break;

        case "jwt-decoder": {
          const decoded =
            decodeJWT(input);

          result =
            JSON.stringify(
              decoded,
              null,
              2
            );

          break;
        }

        case "jwt-generator": {
          result =
            await generateJWT(
              input,
              jwtSecret
            );

          break;
        }

        case "uuid-generator":
          result =
            generateUUID();
          break;

        case "uuid-validator":
          result =
            validateUUID(input)
              ? "Valid UUID"
              : "Invalid UUID";
          break;

        case "regex-tester": {
          const tested =
            testRegex(
              input,
              regexFlags,
              secondaryInput
            );

          result =
            JSON.stringify(
              tested,
              null,
              2
            );

          break;
        }

        case "regex-generator":
          result =
            generateRegex(
              regexType
            );
          break;

        case "timestamp-converter": {
          const value =
            Number(input);

          if (
            !Number.isFinite(value)
          ) {
            result =
              String(
                dateToTimestamp(
                  input
                )
              );
          } else {
            result =
              timestampToDate(
                value
              );
          }

          break;
        }

        case "unix-timestamp-generator":
          result =
            String(
              getUnixTimestamp()
            );
          break;

        default:
          throw new Error(
            "Developer tool is not implemented."
          );
      }

      setOutput(result);
    } catch (err) {
      setOutput("");

      setError(
        err instanceof Error
          ? err.message
          : "Unable to process the input."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    if (!output) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        output
      );

      setError("");
    } catch {
      setError(
        "Unable to copy the result."
      );
    }
  }

  function downloadOutput() {
    if (!output) {
      return;
    }

    const blob =
      new Blob(
        [output],
        {
          type:
            "text/plain;charset=utf-8",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href = url;
    anchor.download = `workabhi-${toolId}.txt`;

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(
        url
      );
    }, 1000);
  }

  const showSecondary =
    toolId ===
      "regex-tester";

  const showRegexFlags =
    toolId ===
    "regex-tester";

  const showRegexGenerator =
    toolId ===
    "regex-generator";

  const showJWTSecret =
    toolId ===
    "jwt-generator";

  const isGenerator =
    toolId ===
      "uuid-generator" ||
    toolId ===
      "unix-timestamp-generator";

  return (
    <section className="space-y-6">

      <div className="rounded-2xl border bg-background p-5 sm:p-6">

        <div className="mb-5">
          <h2 className="text-lg font-semibold">
            Developer Workspace
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Enter your data below. Processing
            happens directly in your browser.
          </p>
        </div>

        {showRegexGenerator && (
          <div className="mb-5">
            <label
              htmlFor="regex-type"
              className="mb-2 block text-sm font-medium"
            >
              Regex type
            </label>

            <select
              id="regex-type"
              value={regexType}
              onChange={(event) =>
                setRegexType(
                  event.target.value
                )
              }
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm"
            >
              <option value="email">
                Email
              </option>

              <option value="phone">
                Phone
              </option>

              <option value="url">
                URL
              </option>

              <option value="ipv4">
                IPv4
              </option>

              <option value="digits">
                Digits
              </option>

              <option value="letters">
                Letters
              </option>

              <option value="alphanumeric">
                Alphanumeric
              </option>

              <option value="date">
                Date
              </option>

              <option value="strong-password">
                Strong Password
              </option>
            </select>
          </div>
        )}

        {!isGenerator && (
          <div>
            <label
              htmlFor="developer-input"
              className="mb-2 block text-sm font-medium"
            >
              {showSecondary
                ? "Regular Expression"
                : showJWTSecret
                  ? "Payload JSON"
                  : "Input"}
            </label>

            <textarea
              id="developer-input"
              value={input}
              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }
              spellCheck={false}
              className="min-h-[280px] w-full resize-y rounded-xl border bg-muted/20 p-4 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder={
                getPlaceholder(
                  toolId
                )
              }
            />
          </div>
        )}

        {showJWTSecret && (
          <div className="mt-5">
            <label
              htmlFor="jwt-secret"
              className="mb-2 block text-sm font-medium"
            >
              HMAC Secret
            </label>

            <input
              id="jwt-secret"
              type="password"
              value={jwtSecret}
              onChange={(event) =>
                setJwtSecret(
                  event.target.value
                )
              }
              className="w-full rounded-xl border bg-background px-4 py-3 font-mono text-sm"
              placeholder="Enter your signing secret"
            />
          </div>
        )}

        {showSecondary && (
          <div className="mt-5">
            <label
              htmlFor="regex-test-input"
              className="mb-2 block text-sm font-medium"
            >
              Test String
            </label>

            <textarea
              id="regex-test-input"
              value={secondaryInput}
              onChange={(event) =>
                setSecondaryInput(
                  event.target.value
                )
              }
              spellCheck={false}
              className="min-h-[160px] w-full resize-y rounded-xl border bg-muted/20 p-4 font-mono text-sm"
              placeholder="Enter text to test against the regex"
            />
          </div>
        )}

        {showRegexFlags && (
          <div className="mt-5">
            <label
              htmlFor="regex-flags"
              className="mb-2 block text-sm font-medium"
            >
              Regex Flags
            </label>

            <input
              id="regex-flags"
              value={regexFlags}
              onChange={(event) =>
                setRegexFlags(
                  event.target.value
                )
              }
              className="w-full rounded-xl border bg-background px-4 py-3 font-mono text-sm"
              placeholder="gim"
            />
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={process}
            disabled={loading}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : "Process"}
          </button>

          <button
            type="button"
            onClick={() => {
              setInput("");
              setSecondaryInput("");
              setOutput("");
              setError("");
              setJwtSecret("");
            }}
            disabled={loading}
            className="rounded-xl border px-5 py-3 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {output && (
        <div className="rounded-2xl border bg-background p-5 sm:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Result
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Your processed result is ready.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyOutput}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Copy
              </button>

              <button
                type="button"
                onClick={
                  downloadOutput
                }
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Download
              </button>
            </div>
          </div>

          {markdownPreview ? (
            <div
              className="prose prose-sm mt-6 max-w-none rounded-xl border bg-background p-6 dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html: output,
              }}
            />
          ) : (
            <textarea
              value={output}
              readOnly
              spellCheck={false}
              className="mt-6 min-h-[320px] w-full resize-y rounded-xl border bg-muted/20 p-4 font-mono text-sm"
            />
          )}
        </div>
      )}

      {toolId ===
        "uuid-generator" && (
        <div className="rounded-2xl border bg-background p-5 text-sm text-muted-foreground">
          Click <strong>Process</strong> to
          generate a cryptographically random UUID.
        </div>
      )}

      {toolId ===
        "unix-timestamp-generator" && (
        <div className="rounded-2xl border bg-background p-5 text-sm text-muted-foreground">
          Click <strong>Process</strong> to
          generate the current Unix timestamp.
        </div>
      )}

      {toolId ===
        "timestamp-converter" && (
        <div className="rounded-2xl border bg-background p-5 text-sm text-muted-foreground">
          Enter either a Unix timestamp or a
          date/time string. The tool detects the
          input automatically.
        </div>
      )}
    </section>
  );
}

function getPlaceholder(
  toolId: string
): string {
  switch (toolId) {
    case "json-formatter":
    case "json-beautifier":
    case "json-minifier":
    case "json-validator":
      return '{ "name": "WorkAbhi", "free": true }';

    case "json-to-csv":
      return '[{"name":"John","age":25},{"name":"Jane","age":30}]';

    case "csv-to-json":
      return "name,age\nJohn,25\nJane,30";

    case "xml-formatter":
    case "xml-validator":
    case "xml-minifier":
      return "<users><user><name>John</name></user></users>";

    case "yaml-formatter":
    case "yaml-to-json":
      return "name: WorkAbhi\nfree: true";

    case "json-to-yaml":
      return '{ "name": "WorkAbhi", "free": true }';

    case "html-formatter":
    case "html-minifier":
      return "<div><h1>Hello</h1><p>WorkAbhi</p></div>";

    case "css-formatter":
    case "css-minifier":
      return "body { margin: 0; padding: 0; }";

    case "javascript-formatter":
    case "javascript-minifier":
      return "function hello() { console.log('Hello WorkAbhi'); }";

    case "sql-formatter":
    case "sql-minifier":
      return "SELECT id,name FROM users WHERE active = true ORDER BY name;";

    case "markdown-previewer":
    case "markdown-to-html":
      return "# Hello WorkAbhi\n\nThis is **Markdown**.";

    case "html-to-markdown":
      return "<h1>Hello WorkAbhi</h1><p>This is <strong>HTML</strong>.</p>";

    case "url-encoder":
    case "url-decoder":
      return "https://example.com/search?q=hello world";

    case "base64-encoder":
    case "base64-decoder":
      return "Hello WorkAbhi";

    case "jwt-decoder":
      return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.signature";

    case "jwt-generator":
      return '{ "sub": "1234567890", "name": "John" }';

    case "uuid-validator":
      return "550e8400-e29b-41d4-a716-446655440000";

    case "regex-tester":
      return "Enter your regex above";

    case "timestamp-converter":
      return "1750000000";

    default:
      return "Enter your input here...";
  }
}