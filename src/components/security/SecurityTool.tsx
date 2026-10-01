"use client";

import { useMemo, useState } from "react";
import {
  caesarCipher,
  decodeBase64,
  decodeHTML,
  decodeURL,
  encodeBase64,
  encodeHTML,
  encodeURL,
  generatePassphrase,
  generatePIN,
  generateStrongPassword,
  generateUsername,
  hashText,
  md5,
  rot13,
} from "@/engine/security/securityEngine";

interface SecurityToolProps {
  toolId: string;
}

const TOOL_LABELS: Record<string, string> = {
  "strong-password-generator": "Strong Password Generator",
  "passphrase-generator": "Passphrase Generator",
  "pin-generator": "PIN Generator",
  "username-generator": "Username Generator",
  "sha-256-hash-generator": "SHA-256 Hash Generator",
  "sha-512-hash-generator": "SHA-512 Hash Generator",
  "md5-hash-generator": "MD5 Hash Generator",
  "sha-1-hash-generator": "SHA-1 Hash Generator",
  "base64-encoder": "Base64 Encoder",
  "base64-decoder": "Base64 Decoder",
  "url-encoder": "URL Encoder",
  "url-decoder": "URL Decoder",
  "html-encoder": "HTML Encoder",
  "html-decoder": "HTML Decoder",
  "rot13-encoder": "ROT13 Encoder",
  "rot13-decoder": "ROT13 Decoder",
  "caesar-cipher": "Caesar Cipher",
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
      disabled={!value}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
      />
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}

export default function SecurityTool({
  toolId,
}: SecurityToolProps) {
  const title = TOOL_LABELS[toolId] ?? "Security Tool";
  const isGenerator = toolId.endsWith("-generator");
  const isPassword = toolId === "strong-password-generator";
  const isPassphrase = toolId === "passphrase-generator";
  const isPin = toolId === "pin-generator";
  const isUsername = toolId === "username-generator";
  const isCaesar = toolId === "caesar-cipher";

  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [passwordLength, setPasswordLength] = useState("20");
  const [useUppercase, setUseUppercase] = useState(true);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [passphraseWords, setPassphraseWords] = useState("6");
  const [pinLength, setPinLength] = useState("6");
  const [shift, setShift] = useState("3");

  const description = useMemo(() => {
    if (isPassword) return "Generate a cryptographically random password locally in your browser.";
    if (isPassphrase) return "Generate a random multi-word passphrase locally in your browser.";
    if (isPin) return "Generate a cryptographically random numeric PIN locally in your browser.";
    if (isUsername) return "Generate a random username locally in your browser.";
    return "Process security and encoding data directly in your browser.";
  }, [isPassword, isPassphrase, isPin, isUsername]);

  function process() {
    setError("");

    try {
      let output = "";

      if (isPassword) {
        output = generateStrongPassword({
          length: Number(passwordLength),
          uppercase: useUppercase,
          lowercase: useLowercase,
          numbers: useNumbers,
          symbols: useSymbols,
        });
      } else if (isPassphrase) {
        output = generatePassphrase(Number(passphraseWords));
      } else if (isPin) {
        output = generatePIN(Number(pinLength));
      } else if (isUsername) {
        output = generateUsername();
      } else if (toolId === "sha-256-hash-generator") {
        output = "Processing...";
        setResult(output);
        void hashText(input, "SHA-256").then(setResult).catch(handleError);
        return;
      } else if (toolId === "sha-512-hash-generator") {
        output = "Processing...";
        setResult(output);
        void hashText(input, "SHA-512").then(setResult).catch(handleError);
        return;
      } else if (toolId === "sha-1-hash-generator") {
        output = "Processing...";
        setResult(output);
        void hashText(input, "SHA-1").then(setResult).catch(handleError);
        return;
      } else if (toolId === "md5-hash-generator") {
        output = md5(input);
      } else if (toolId === "base64-encoder") {
        output = encodeBase64(input);
      } else if (toolId === "base64-decoder") {
        output = decodeBase64(input);
      } else if (toolId === "url-encoder") {
        output = encodeURL(input);
      } else if (toolId === "url-decoder") {
        output = decodeURL(input);
      } else if (toolId === "html-encoder") {
        output = encodeHTML(input);
      } else if (toolId === "html-decoder") {
        output = decodeHTML(input);
      } else if (toolId === "rot13-encoder" || toolId === "rot13-decoder") {
        output = rot13(input);
      } else if (isCaesar) {
        output = caesarCipher(input, Number(shift));
      } else {
        throw new Error("Unsupported security tool.");
      }

      setResult(output);
    } catch (err) {
      handleError(err);
    }
  }

  function handleError(err: unknown) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to process the input."
    );
  }

  const needsInput =
    !isGenerator && !isUsername;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-background p-5 sm:p-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>

        {isPassword && (
          <div className="mt-6 space-y-5">
            <Field
              label="Password length"
              value={passwordLength}
              onChange={setPasswordLength}
              type="number"
              min={8}
              max={256}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Checkbox
                label="Uppercase letters"
                checked={useUppercase}
                onChange={setUseUppercase}
              />
              <Checkbox
                label="Lowercase letters"
                checked={useLowercase}
                onChange={setUseLowercase}
              />
              <Checkbox
                label="Numbers"
                checked={useNumbers}
                onChange={setUseNumbers}
              />
              <Checkbox
                label="Symbols"
                checked={useSymbols}
                onChange={setUseSymbols}
              />
            </div>
          </div>
        )}

        {isPassphrase && (
          <div className="mt-6">
            <Field
              label="Number of words"
              value={passphraseWords}
              onChange={setPassphraseWords}
              type="number"
              min={3}
              max={20}
            />
          </div>
        )}

        {isPin && (
          <div className="mt-6">
            <Field
              label="PIN length"
              value={pinLength}
              onChange={setPinLength}
              type="number"
              min={4}
              max={32}
            />
          </div>
        )}

        {isCaesar && (
          <div className="mt-5">
            <Field
              label="Shift"
              value={shift}
              onChange={setShift}
              type="number"
              min={-25}
              max={25}
            />
          </div>
        )}

        {needsInput && (
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Enter or paste your text here..."
            rows={10}
            className="mt-5 w-full resize-y rounded-xl border bg-background px-4 py-4 text-sm leading-6 outline-none focus:ring-2"
          />
        )}

        <div className="mt-5">
          <button
            type="button"
            onClick={process}
            className="rounded-lg border px-5 py-3 font-medium hover:bg-muted"
          >
            {isGenerator || isUsername ? "Generate" : "Process"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </section>

      {result && (
        <section className="rounded-2xl border bg-muted/10 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold">Result</h3>
            <CopyButton value={result} />
          </div>

          <pre className="mt-4 max-h-[500px] overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-background p-4 text-sm leading-6">
            {result}
          </pre>
        </section>
      )}
    </div>
  );
}
