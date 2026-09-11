"use client";

import { useMemo, useState } from "react";

import {
  addLineBreaks,
  asciiToText,
  binaryToText,
  calculateReadingTime,
  cleanText,
  compareText,
  countCharacters,
  countParagraphs,
  countSentences,
  countWords,
  findAndReplace,
  generateLoremIpsum,
  generateRandomText,
  getTextLength,
  getTextStats,
  removeDuplicateLines,
  removeExtraSpaces,
  removeLineBreaks,
  repeatText,
  reverseText,
  reverseWords,
  sortLinesAlphabetically,
  textToASCII,
  textToBinary,
  textToMorse,
  toLowerCase,
  toSentenceCase,
  toTitleCase,
  toUpperCase,
  toggleCase,
} from "@/engine/text/textEngine";

interface TextToolProps {
  toolId: string;
}

function ResultBox({
  result,
}: {
  result: string;
}) {
  async function copyResult() {
    await navigator.clipboard.writeText(result);
  }

  if (!result) return null;

  return (
    <div className="mt-6 rounded-2xl border bg-muted/20 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold">
          Result
        </h3>

        <button
          type="button"
          onClick={copyResult}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Copy
        </button>
      </div>

      <pre className="mt-4 max-h-[500px] overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-background p-4 text-sm leading-6">
        {result}
      </pre>
    </div>
  );
}

function InputArea({
  value,
  onChange,
  placeholder = "Enter or paste your text here...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      placeholder={placeholder}
      rows={12}
      className="mt-5 w-full resize-y rounded-xl border bg-background px-4 py-4 text-sm leading-6 outline-none focus:ring-2"
    />
  );
}

function ActionButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border px-5 py-3 font-medium hover:bg-muted"
    >
      {children}
    </button>
  );
}

export default function TextTool({
  toolId,
}: TextToolProps) {
  const [text, setText] = useState("");
  const [secondText, setSecondText] =
    useState("");

  const [result, setResult] =
    useState("");

  const [error, setError] =
    useState("");

  const [repeatCount, setRepeatCount] =
    useState("3");

  const [findText, setFindText] =
    useState("");

  const [replaceText, setReplaceText] =
    useState("");

  const [generationCount, setGenerationCount] =
    useState("100");

  const [stats, setStats] =
    useState<ReturnType<typeof getTextStats> | null>(
      null
    );

  const needsInput =
    ![
      "lorem-ipsum-generator",
      "random-text-generator",
    ].includes(toolId);

  const process = () => {
    setError("");

    try {
      let output = "";

      if (toolId === "word-counter") {
        setStats(getTextStats(text));
        return;
      }

      if (toolId === "character-counter") {
        output = String(
          countCharacters(text)
        );
      }

      if (toolId === "sentence-counter") {
        output = String(
          countSentences(text)
        );
      }

      if (toolId === "paragraph-counter") {
        output = String(
          countParagraphs(text)
        );
      }

      if (
        toolId === "reading-time-calculator"
      ) {
        output = `${calculateReadingTime(text)} minute(s)`;
      }

      if (
        toolId === "text-case-converter" ||
        toolId === "uppercase-converter"
      ) {
        output = toUpperCase(text);
      }

      if (toolId === "lowercase-converter") {
        output = toLowerCase(text);
      }

      if (toolId === "title-case-converter") {
        output = toTitleCase(text);
      }

      if (
        toolId === "sentence-case-converter"
      ) {
        output = toSentenceCase(text);
      }

      if (toolId === "toggle-case-converter") {
        output = toggleCase(text);
      }

      if (toolId === "remove-extra-spaces") {
        output = removeExtraSpaces(text);
      }

      if (toolId === "remove-duplicate-lines") {
        output = removeDuplicateLines(text);
      }

      if (
        toolId === "sort-lines-alphabetically"
      ) {
        output = sortLinesAlphabetically(text);
      }

      if (toolId === "reverse-text") {
        output = reverseText(text);
      }

      if (toolId === "reverse-words") {
        output = reverseWords(text);
      }

      if (toolId === "remove-line-breaks") {
        output = removeLineBreaks(text);
      }

      if (toolId === "add-line-breaks") {
        output = addLineBreaks(text);
      }

      if (toolId === "text-repeater") {
        output = repeatText(
          text,
          Number(repeatCount)
        );
      }

      if (toolId === "text-cleaner") {
        output = cleanText(text);
      }

      if (toolId === "find-replace-text") {
        output = findAndReplace(
          text,
          findText,
          replaceText
        );
      }

      if (
        toolId === "text-difference-checker"
      ) {
        const difference = compareText(
          text,
          secondText
        );

        output = [
          "ADDED:",
          ...difference.added.map(
            (line) => `+ ${line}`
          ),
          "",
          "REMOVED:",
          ...difference.removed.map(
            (line) => `- ${line}`
          ),
          "",
          "UNCHANGED:",
          ...difference.unchanged.map(
            (line) => `  ${line}`
          ),
        ].join("\n");
      }

      if (toolId === "text-length-calculator") {
        const length = getTextLength(text);

        output = [
          `Characters: ${length.characters}`,
          `Characters without spaces: ${length.charactersNoSpaces}`,
          `Words: ${length.words}`,
          `Lines: ${length.lines}`,
        ].join("\n");
      }

      if (
        toolId === "lorem-ipsum-generator"
      ) {
        output = generateLoremIpsum(
          Number(generationCount)
        );
      }

      if (
        toolId === "random-text-generator"
      ) {
        output = generateRandomText(
          Number(generationCount)
        );
      }

      if (toolId === "text-to-binary") {
        output = textToBinary(text);
      }

      if (toolId === "binary-to-text") {
        output = binaryToText(text);
      }

      if (toolId === "text-to-ascii") {
        output = textToASCII(text);
      }

      if (toolId === "ascii-to-text") {
        output = asciiToText(text);
      }

      if (toolId === "text-to-morse-code") {
        output = textToMorse(text);
      }

      if (
        needsInput &&
        !text.trim()
      ) {
        throw new Error(
          "Please enter some text first."
        );
      }

      setResult(output);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process the text."
      );
    }
  };

  const liveStats = useMemo(
    () => getTextStats(text),
    [text]
  );

  const isCounter =
    [
      "word-counter",
      "character-counter",
      "sentence-counter",
      "paragraph-counter",
      "reading-time-calculator",
    ].includes(toolId);

  const isGenerator =
    [
      "lorem-ipsum-generator",
      "random-text-generator",
    ].includes(toolId);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-background p-5 sm:p-6">
        <h2 className="text-xl font-semibold">
          Text Tool
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Process your text directly in your browser.
        </p>

        {isGenerator ? (
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium">
              Number of words
            </label>

            <input
              type="number"
              min="1"
              max="5000"
              value={generationCount}
              onChange={(e) =>
                setGenerationCount(
                  e.target.value
                )
              }
              className="w-full rounded-lg border px-4 py-3"
            />

            <ActionButton onClick={process}>
              Generate Text
            </ActionButton>
          </div>
        ) : (
          <>
            <InputArea
              value={text}
              onChange={setText}
            />

            {toolId ===
              "text-difference-checker" && (
              <textarea
                value={secondText}
                onChange={(e) =>
                  setSecondText(
                    e.target.value
                  )
                }
                placeholder="Paste the second version here..."
                rows={12}
                className="mt-4 w-full resize-y rounded-xl border bg-background px-4 py-4 text-sm leading-6 outline-none"
              />
            )}

            {toolId === "find-replace-text" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  value={findText}
                  onChange={(e) =>
                    setFindText(
                      e.target.value
                    )
                  }
                  placeholder="Find text"
                  className="rounded-lg border px-4 py-3"
                />

                <input
                  value={replaceText}
                  onChange={(e) =>
                    setReplaceText(
                      e.target.value
                    )
                  }
                  placeholder="Replace with"
                  className="rounded-lg border px-4 py-3"
                />
              </div>
            )}

            {toolId === "text-repeater" && (
              <div className="mt-4">
                <label className="text-sm font-medium">
                  Repeat count
                </label>

                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={repeatCount}
                  onChange={(e) =>
                    setRepeatCount(
                      e.target.value
                    )
                  }
                  className="mt-2 w-full rounded-lg border px-4 py-3"
                />
              </div>
            )}

            {!isCounter && (
              <div className="mt-4">
                <ActionButton onClick={process}>
                  Process Text
                </ActionButton>
              </div>
            )}
          </>
        )}

        {isCounter && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">
                Words
              </p>
              <p className="mt-1 text-2xl font-bold">
                {liveStats.words}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">
                Characters
              </p>
              <p className="mt-1 text-2xl font-bold">
                {liveStats.characters}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">
                Sentences
              </p>
              <p className="mt-1 text-2xl font-bold">
                {liveStats.sentences}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">
                Paragraphs
              </p>
              <p className="mt-1 text-2xl font-bold">
                {liveStats.paragraphs}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </section>

      {stats && (
        <section className="rounded-2xl border p-6">
          <h3 className="font-semibold">
            Text Statistics
          </h3>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["Words", stats.words],
              [
                "Characters",
                stats.characters,
              ],
              [
                "Characters without spaces",
                stats.charactersNoSpaces,
              ],
              [
                "Sentences",
                stats.sentences,
              ],
              [
                "Paragraphs",
                stats.paragraphs,
              ],
              ["Lines", stats.lines],
              [
                "Reading Time",
                `${stats.readingTimeMinutes} min`,
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-xl border p-4"
              >
                <p className="text-sm text-muted-foreground">
                  {label}
                </p>

                <p className="mt-1 text-xl font-bold">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <ResultBox result={result} />
    </div>
  );
}