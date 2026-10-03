import type { Page } from "@playwright/test";

export type RuntimeDiagnostics = {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  badResponses: string[];
};

export function installRuntimeDiagnostics(page: Page): RuntimeDiagnostics {
  const diagnostics: RuntimeDiagnostics = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    badResponses: [],
  };

  page.on("console", (message) => {
    if (message.type() === "error") {
      diagnostics.consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    diagnostics.pageErrors.push(error.message);
  });

  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText || "unknown request failure";
    diagnostics.failedRequests.push(`${request.method()} ${request.url()} :: ${failure}`);
  });

  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().includes("_next/static/")) {
      diagnostics.badResponses.push(`${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });

  return diagnostics;
}

export function assertNoRuntimeDiagnostics(
  diagnostics: RuntimeDiagnostics,
  route: string
) {
  const lines: string[] = [];
  if (diagnostics.consoleErrors.length) {
    lines.push(`Console errors:\n${diagnostics.consoleErrors.join("\n")}`);
  }
  if (diagnostics.pageErrors.length) {
    lines.push(`Page errors:\n${diagnostics.pageErrors.join("\n")}`);
  }
  if (diagnostics.failedRequests.length) {
    lines.push(`Failed requests:\n${diagnostics.failedRequests.join("\n")}`);
  }
  if (diagnostics.badResponses.length) {
    lines.push(`Bad responses:\n${diagnostics.badResponses.join("\n")}`);
  }

  if (lines.length) {
    throw new Error(`Runtime diagnostics failed for ${route}\n\n${lines.join("\n\n")}`);
  }
}
