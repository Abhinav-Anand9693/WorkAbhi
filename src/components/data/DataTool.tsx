"use client";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  DataToolId,
  ParsedTable,
  ProcessOptions,
  getFileMetadata,
  parseDelimited,
  processDataTool,
  shaFile,
} from "@/engine/data/dataEngine";

interface DataToolProps {
  /**
   * Same structure as your existing tools.
   *
   * ToolRunner:
   *
   * case "file":
   *   return <FileDataTool toolId={tool.id} />;
   */
  toolId: string;
}

interface ResultFile {
  name: string;
  text: string;
  mimeType: string;
}

interface SplitResult {
  name: string;
  text: string;
}

const idsWithTableUI = new Set<string>([
  "csv-viewer",
  "csv-formatter",
  "csv-column-extractor",
  "csv-row-filter",
  "csv-duplicate-remover",
  "csv-sorter",
]);

export default function FileDataTool({
  toolId,
}: DataToolProps) {
  // ===========================================================================
  // INPUT
  // ===========================================================================

  const [files, setFiles] = useState<File[]>(
    []
  );

  const [inputText, setInputText] =
    useState("");

  // ===========================================================================
  // TABLE
  // ===========================================================================

  const [table, setTable] =
    useState<ParsedTable | null>(null);

  // ===========================================================================
  // RESULT
  // ===========================================================================

  const [result, setResult] =
    useState<ResultFile | null>(null);

  const [splitResults, setSplitResults] =
    useState<SplitResult[]>([]);

  // ===========================================================================
  // OPTIONS
  // ===========================================================================

  const [extra, setExtra] =
    useState<Record<string, unknown>>({});

  // ===========================================================================
  // UI STATE
  // ===========================================================================

  const [loading, setLoading] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [error, setError] =
    useState("");

  // ===========================================================================
  // REFS
  // ===========================================================================

  const controllerRef =
    useRef<AbortController | null>(
      null
    );

  const generationRef =
    useRef(0);

  const inputRef =
    useRef<HTMLInputElement>(null);

  // ===========================================================================
  // COMPONENT CLEANUP
  // ===========================================================================

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  // ===========================================================================
  // CANCEL
  // ===========================================================================

  const cancel = () => {
    /**
     * Invalidate the current async operation.
     */
    generationRef.current += 1;

    /**
     * Abort current processing.
     */
    controllerRef.current?.abort();

    controllerRef.current = null;

    setLoading(false);

    setProgress(0);
  };

  // ===========================================================================
  // CLEAR
  // ===========================================================================

  const clear = () => {
    /**
     * Cancel active processing.
     */
    if (loading) {
      cancel();
    } else {
      generationRef.current += 1;

      controllerRef.current?.abort();

      controllerRef.current = null;
    }

    // Input
    setFiles([]);

    setInputText("");

    // Preview
    setTable(null);

    // Result
    setResult(null);

    // Split results
    setSplitResults([]);

    // Options
    setExtra({});

    // Error
    setError("");

    // Progress
    setProgress(0);

    // Reset file input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // ===========================================================================
  // READ FILE
  // ===========================================================================

  const readFile = async (
    file: File
  ): Promise<void> => {
    const text =
      await file.text();

    setInputText(text);

    /**
     * Show CSV/TSV preview.
     */
    if (
      file.type.includes("csv") ||
      /\.(csv|tsv)$/i.test(
        file.name
      )
    ) {
      try {
        const delimiter =
          /\.tsv$/i.test(
            file.name
          )
            ? "\t"
            : ",";

        const parsed =
          parseDelimited(
            text,
            delimiter
          );

        setTable(parsed);
      } catch {
        setTable(null);
      }
    }
  };

  // ===========================================================================
  // FILE CHANGE
  // ===========================================================================

  const onFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selected =
      Array.from(
        event.target.files ?? []
      );

    /**
     * Stop previous operation.
     */
    controllerRef.current?.abort();

    generationRef.current += 1;

    setFiles(selected);

    setError("");

    setResult(null);

    setSplitResults([]);

    setTable(null);

    setProgress(0);

    if (!selected.length) {
      setInputText("");

      return;
    }

    try {
      /**
       * First file is used for normal tools.
       *
       * CSV merger can still use all selected files
       * during process().
       */
      await readFile(
        selected[0]
      );
    } catch {
      setInputText("");

      setError(
        "Unable to read this file."
      );
    }
  };

  // ===========================================================================
  // PROCESS
  // ===========================================================================

  const process = async () => {
    /**
     * Prevent double processing.
     */
    if (loading) {
      return;
    }

    /**
     * New operation generation.
     */
    const generation =
      ++generationRef.current;

    const controller =
      new AbortController();

    controllerRef.current =
      controller;

    setLoading(true);

    setError("");

    setResult(null);

    setSplitResults([]);

    setProgress(0);

    // -------------------------------------------------------------------------
    // ENGINE OPTIONS
    // -------------------------------------------------------------------------

    const options: ProcessOptions = {
      signal:
        controller.signal,

      onProgress: (
        value
      ) => {
        /**
         * Ignore progress from stale/cancelled operations.
         */
        if (
          generation ===
            generationRef.current &&
          !controller.signal
            .aborted
        ) {
          setProgress(value);
        }
      },
    };

    try {
      // =======================================================================
      // FILE HASH CALCULATOR
      // =======================================================================

      if (
        toolId ===
        "file-hash-calculator"
      ) {
        if (!files[0]) {
          throw new Error(
            "Choose a file first."
          );
        }

        const algorithm =
          String(
            extra.algorithm ??
              "SHA-256"
          ) as
            | "SHA-256"
            | "SHA-384"
            | "SHA-512";

        const hash =
          await shaFile(
            files[0],
            algorithm,
            options
          );

        if (
          generation !==
            generationRef.current ||
          controller.signal.aborted
        ) {
          return;
        }

        setResult({
          name: "hash.txt",

          text:
            `${algorithm}\n` +
            `${hash}\n`,

          mimeType:
            "text/plain;charset=utf-8",
        });

        setProgress(100);
      }

      // =======================================================================
      // FILE METADATA VIEWER
      // =======================================================================

      else if (
        toolId ===
        "file-metadata-viewer"
      ) {
        if (!files[0]) {
          throw new Error(
            "Choose a file first."
          );
        }

        const metadata =
          getFileMetadata(
            files[0]
          );

        if (
          generation !==
            generationRef.current ||
          controller.signal.aborted
        ) {
          return;
        }

        setResult({
          name: "metadata.json",

          text:
            JSON.stringify(
              metadata,
              null,
              2
            ),

          mimeType:
            "application/json;charset=utf-8",
        });

        setProgress(100);
      }

      // =======================================================================
      // CSV MERGER
      // =======================================================================

      else if (
        toolId === "csv-merger"
      ) {
        if (files.length < 2) {
          throw new Error(
            "Choose at least two CSV files."
          );
        }

        const inputs: string[] =
          [];

        /**
         * Read files sequentially.
         *
         * This avoids Promise.all() holding all read operations at once.
         */
        for (
          let i = 0;
          i < files.length;
          i++
        ) {
          if (
            generation !==
              generationRef.current ||
            controller.signal.aborted
          ) {
            return;
          }

          const text =
            await files[i].text();

          inputs.push(text);

          setProgress(
            Math.round(
              ((i + 1) /
                files.length) *
                30
            )
          );
        }

        const output =
          await processDataTool(
            toolId as DataToolId,
            inputs[0],
            options,
            {
              inputs,
            }
          );

        if (
          generation !==
            generationRef.current ||
          controller.signal.aborted
        ) {
          return;
        }

        setResult({
          name:
            output.filename,

          text:
            output.text,

          mimeType:
            output.mimeType,
        });

        setProgress(100);
      }

      // =======================================================================
      // OTHER DATA TOOLS
      // =======================================================================

      else {
        if (
          !inputText.trim()
        ) {
          throw new Error(
            "Choose a file or paste data first."
          );
        }

        const output =
          await processDataTool(
            toolId as DataToolId,
            inputText,
            options,
            extra
          );

        if (
          generation !==
            generationRef.current ||
          controller.signal.aborted
        ) {
          return;
        }

        setResult({
          name:
            output.filename,

          text:
            output.text,

          mimeType:
            output.mimeType,
        });

        /**
         * CSV splitter.
         */
        if (
          output.files &&
          output.files.length > 0
        ) {
          setSplitResults(
            output.files
          );
        }

        setProgress(100);
      }
    } catch (err) {
      /**
       * Ignore stale operations.
       */
      if (
        generation !==
          generationRef.current ||
        controller.signal.aborted
      ) {
        return;
      }

      /**
       * Normal cancellation.
       */
      if (
        err instanceof DOMException &&
        err.name === "AbortError"
      ) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while processing."
      );
    } finally {
      /**
       * Only current operation can modify loading state.
       */
      if (
        generation ===
          generationRef.current &&
        !controller.signal.aborted
      ) {
        setLoading(false);

        controllerRef.current =
          null;
      }
    }
  };

  // ===========================================================================
  // DOWNLOAD MAIN RESULT
  // ===========================================================================

  const downloadResult = () => {
    if (!result) {
      return;
    }

    /**
     * Blob URL is created ONLY inside the click handler.
     *
     * Therefore:
     *
     * - no render-time ref access
     * - no useMemo
     * - no useEffect setState
     * - no persistent Blob URL
     */
    const blob =
      new Blob(
        [result.text],
        {
          type: result.mimeType,
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

    anchor.download =
      result.name;

    document.body.appendChild(
      anchor
    );

    anchor.click();

    anchor.remove();

    /**
     * Release Blob URL after download starts.
     */
    setTimeout(() => {
      URL.revokeObjectURL(
        url
      );
    }, 0);
  };

  // ===========================================================================
  // DOWNLOAD SPLIT FILE
  // ===========================================================================

  const downloadTextFile = (
    file: SplitResult
  ) => {
    const blob =
      new Blob(
        [file.text],
        {
          type:
            "text/csv;charset=utf-8",
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

    anchor.download =
      file.name;

    document.body.appendChild(
      anchor
    );

    anchor.click();

    anchor.remove();

    setTimeout(() => {
      URL.revokeObjectURL(
        url
      );
    }, 0);
  };

  // ===========================================================================
  // TABLE
  // ===========================================================================

  const renderTable =
    table &&
    idsWithTableUI.has(
      toolId
    );

  const headers =
    table?.headers ?? [];

  // ===========================================================================
  // UI
  // ===========================================================================

  return (
    <div className="space-y-5">

      {/* =====================================================================
          INPUT CARD
      ====================================================================== */}

      <div className="rounded-2xl border p-5">

        {/* -------------------------------------------------------------------
            FILE INPUT
        -------------------------------------------------------------------- */}

        <div className="flex flex-wrap items-center gap-3">

          <input
            ref={inputRef}
            type="file"
            multiple={
              toolId ===
              "csv-merger"
            }
            accept={
              toolId.startsWith(
                "csv-"
              )
                ? ".csv,text/csv"
                : toolId ===
                    "tsv-to-csv"
                  ? ".tsv,text/tab-separated-values"
                  : undefined
            }
            onChange={
              onFileChange
            }
            disabled={loading}
          />

          {/* ---------------------------------------------------------------
              CLEAR / CANCEL
          ---------------------------------------------------------------- */}

          <button
            type="button"
            onClick={
              loading
                ? cancel
                : clear
            }
            className="rounded-lg border px-4 py-2"
          >
            {loading
              ? "Cancel"
              : "Clear"}
          </button>

        </div>

        {/* =================================================================
            TEXTAREA
        ================================================================== */}

        <textarea
          value={inputText}
          onChange={(event) => {
            const value =
              event.target.value;

            setInputText(value);

            /**
             * Live CSV preview.
             */
            if (
              toolId.startsWith(
                "csv-"
              )
            ) {
              try {
                const parsed =
                  parseDelimited(
                    value,
                    ","
                  );

                setTable(parsed);
              } catch {
                setTable(null);
              }
            }
          }}
          placeholder="Or paste your data here..."
          className="mt-4 min-h-44 w-full rounded-xl border p-3 font-mono text-sm"
        />

        {/* =================================================================
            HASH ALGORITHM
        ================================================================== */}

        {toolId ===
          "file-hash-calculator" && (
          <select
            className="mt-3 rounded-lg border p-2"
            value={String(
              extra.algorithm ??
                "SHA-256"
            )}
            onChange={(event) =>
              setExtra(
                (previous) => ({
                  ...previous,

                  algorithm:
                    event.target
                      .value,
                })
              )
            }
          >
            <option value="SHA-256">
              SHA-256
            </option>

            <option value="SHA-384">
              SHA-384
            </option>

            <option value="SHA-512">
              SHA-512
            </option>
          </select>
        )}

        {/* =================================================================
            COLUMN EXTRACTOR
        ================================================================== */}

        {toolId ===
          "csv-column-extractor" &&
          headers.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">

              {headers.map(
                (header) => {
                  const columns =
                    Array.isArray(
                      extra.columns
                    )
                      ? (
                          extra.columns as string[]
                        )
                      : [];

                  const selected =
                    columns.includes(
                      header
                    );

                  return (
                    <button
                      type="button"
                      key={header}
                      onClick={() => {
                        setExtra(
                          (
                            previous
                          ) => {
                            const current =
                              Array.isArray(
                                previous.columns
                              )
                                ? (
                                    previous.columns as string[]
                                  )
                                : [];

                            return {
                              ...previous,

                              columns:
                                selected
                                  ? current.filter(
                                      (
                                        column
                                      ) =>
                                        column !==
                                        header
                                    )
                                  : [
                                      ...current,
                                      header,
                                    ],
                            };
                          }
                        );
                      }}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        selected
                          ? "font-semibold"
                          : ""
                      }`}
                    >
                      {header}
                    </button>
                  );
                }
              )}

            </div>
          )}

        {/* =================================================================
            ROW FILTER
        ================================================================== */}

        {toolId ===
          "csv-row-filter" &&
          headers.length > 0 && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">

              <select
                className="rounded-lg border p-2"
                value={String(
                  extra.column ??
                    headers[0]
                )}
                onChange={(event) =>
                  setExtra(
                    (
                      previous
                    ) => ({
                      ...previous,

                      column:
                        event.target
                          .value,
                    })
                  )
                }
              >
                {headers.map(
                  (header) => (
                    <option
                      key={header}
                      value={header}
                    >
                      {header}
                    </option>
                  )
                )}
              </select>

              <input
                className="flex-1 rounded-lg border p-2"
                placeholder="Contains..."
                value={String(
                  extra.query ??
                    ""
                )}
                onChange={(event) =>
                  setExtra(
                    (
                      previous
                    ) => ({
                      ...previous,

                      query:
                        event.target
                          .value,
                    })
                  )
                }
              />

            </div>
          )}

        {/* =================================================================
            SORTER
        ================================================================== */}

        {toolId ===
          "csv-sorter" &&
          headers.length > 0 && (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">

              <select
                className="rounded-lg border p-2"
                value={String(
                  extra.column ??
                    headers[0]
                )}
                onChange={(event) =>
                  setExtra(
                    (
                      previous
                    ) => ({
                      ...previous,

                      column:
                        event.target
                          .value,
                    })
                  )
                }
              >
                {headers.map(
                  (header) => (
                    <option
                      key={header}
                      value={header}
                    >
                      {header}
                    </option>
                  )
                )}
              </select>

              <label className="flex items-center gap-2">

                <input
                  type="checkbox"
                  checked={Boolean(
                    extra.descending
                  )}
                  onChange={(event) =>
                    setExtra(
                      (
                        previous
                      ) => ({
                        ...previous,

                        descending:
                          event.target
                            .checked,
                      })
                    )
                  }
                />

                Descending

              </label>

            </div>
          )}

        {/* =================================================================
            SPLITTER
        ================================================================== */}

        {toolId ===
          "csv-splitter" && (
          <input
            type="number"
            min={1}
            className="mt-3 w-full rounded-lg border p-2 sm:w-auto"
            placeholder="Rows per file (e.g. 1000)"
            value={String(
              extra.chunkSize ??
                ""
            )}
            onChange={(event) =>
              setExtra(
                (
                  previous
                ) => ({
                  ...previous,

                  chunkSize:
                    Number(
                      event.target
                        .value
                    ),
                })
              )
            }
          />
        )}

        {/* =================================================================
            ACTIONS
        ================================================================== */}

        <div className="mt-4 flex flex-wrap gap-3">

          <button
            type="button"
            onClick={process}
            disabled={loading}
            className="rounded-xl px-5 py-2.5 font-medium"
          >
            {loading
              ? `Processing ${progress}%`
              : "Process"}
          </button>

          {!loading &&
            result && (
              <button
                type="button"
                onClick={
                  downloadResult
                }
                className="rounded-xl border px-5 py-2.5 font-medium"
              >
                Download
              </button>
            )}

        </div>

        {/* =================================================================
            PROGRESS
        ================================================================== */}

        {loading && (
          <div className="mt-4">

            <div className="mb-2 flex justify-between text-xs">

              <span>
                Processing...
              </span>

              <span>
                {progress}%
              </span>

            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-200">

              <div
                className="h-full transition-all duration-200"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

          </div>
        )}

        {/* =================================================================
            ERROR
        ================================================================== */}

        {error && (
          <p className="mt-4 rounded-lg border p-3 text-sm">
            {error}
          </p>
        )}

      </div>

      {/* =====================================================================
          TABLE PREVIEW
      ====================================================================== */}

      {renderTable &&
        table && (
          <div className="overflow-auto rounded-2xl border">

            <table className="min-w-full text-sm">

              <thead>
                <tr>

                  {headers.map(
                    (header) => (
                      <th
                        key={header}
                        className="border-b px-3 py-2 text-left font-semibold"
                      >
                        {header}
                      </th>
                    )
                  )}

                </tr>
              </thead>

              <tbody>

                {table.rows
                  .slice(0, 100)
                  .map(
                    (
                      row,
                      rowIndex
                    ) => (
                      <tr
                        key={
                          rowIndex
                        }
                      >

                        {headers.map(
                          (
                            header
                          ) => (
                            <td
                              key={
                                header
                              }
                              className="border-b px-3 py-2"
                            >
                              {
                                row[
                                  header
                                ]
                              }
                            </td>
                          )
                        )}

                      </tr>
                    )
                  )}

              </tbody>

            </table>

            {table.rows
              .length > 100 && (
              <p className="p-3 text-xs">
                Preview limited to
                the first 100 rows.
              </p>
            )}

          </div>
        )}

      {/* =====================================================================
          SPLIT RESULTS
      ====================================================================== */}

      {splitResults.length >
        0 && (
        <div className="rounded-2xl border p-5">

          <h3 className="mb-4 font-semibold">
            Split Files
          </h3>

          <div className="space-y-2">

            {splitResults.map(
              (file) => (
                <div
                  key={file.name}
                  className="flex flex-col justify-between gap-3 rounded-xl border p-3 sm:flex-row sm:items-center"
                >

                  <span className="text-sm">
                    {file.name}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      downloadTextFile(
                        file
                      )
                    }
                    className="rounded-lg border px-3 py-2 text-sm"
                  >
                    Download
                  </button>

                </div>
              )
            )}

          </div>

        </div>
      )}

      {/* =====================================================================
          RESULT PREVIEW
      ====================================================================== */}

      {result && (
        <div className="rounded-2xl border">

          <div className="border-b p-4">

            <h3 className="font-semibold">
              Result
            </h3>

          </div>

          <pre className="max-h-96 overflow-auto whitespace-pre-wrap p-4 text-sm">
            {result.text.slice(
              0,
              100000
            )}
          </pre>

        </div>
      )}

    </div>
  );
}