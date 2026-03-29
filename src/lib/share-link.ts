import pako from "pako";

/** Hash fragment key for shared diagrams (e.g. `#s=...`). */
export const SHARE_HASH_KEY = "s";

export const SHARE_VERSION = 1 as const;

/** Max JSON byte length before compression (UTF-8). */
export const MAX_SHARE_JSON_BYTES = 512 * 1024;

/** Max length of base64url payload in the hash (practical URL limit). */
export const MAX_SHARE_ENCODED_CHARS = 7500;

export interface SharePayloadV1 {
  v: typeof SHARE_VERSION;
  name: string;
  mermaid_code: string;
}

export type EncodeShareResult =
  | { ok: true; encoded: string; fullUrl: string }
  | { ok: false; error: string };

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s: string): Uint8Array {
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad === 2) b64 += "==";
  else if (pad === 3) b64 += "=";
  else if (pad === 1) throw new Error("Invalid share link");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

function buildShareUrl(encoded: string): string {
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}#${SHARE_HASH_KEY}=${encoded}`;
}

/** Encode diagram for placement in the URL hash. */
export function encodeShareLink(name: string, mermaid_code: string): EncodeShareResult {
  const trimmedName = name.trim();
  const payload: SharePayloadV1 = {
    v: SHARE_VERSION,
    name: trimmedName || "Shared diagram",
    mermaid_code,
  };
  const json = JSON.stringify(payload);
  const jsonBytes = new TextEncoder().encode(json);
  if (jsonBytes.length > MAX_SHARE_JSON_BYTES) {
    return {
      ok: false,
      error: "Diagram is too large to share via link. Try shortening the source.",
    };
  }
  const compressed = pako.gzip(jsonBytes, { level: 9 });
  const encoded = bytesToBase64Url(compressed);
  if (encoded.length > MAX_SHARE_ENCODED_CHARS) {
    return {
      ok: false,
      error:
        "Diagram is too large to share via link after compression. Try shortening the diagram or splitting it.",
    };
  }
  return { ok: true, encoded, fullUrl: buildShareUrl(encoded) };
}

export type DecodeShareResult =
  | { ok: true; name: string; mermaid_code: string }
  | { ok: false; reason: "missing" | "invalid" };

function isPayloadV1(x: unknown): x is SharePayloadV1 {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    o.v === SHARE_VERSION &&
    typeof o.name === "string" &&
    typeof o.mermaid_code === "string"
  );
}

/** Decode share payload from raw hash string including leading `#` or not. */
export function decodeShareFromHash(hash: string): DecodeShareResult {
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!h) return { ok: false, reason: "missing" };
  const prefix = `${SHARE_HASH_KEY}=`;
  if (!h.startsWith(prefix)) return { ok: false, reason: "missing" };
  const encoded = h.slice(prefix.length);
  if (!encoded) return { ok: false, reason: "invalid" };
  try {
    const bytes = base64UrlToBytes(encoded);
    const inflated = pako.ungzip(bytes);
    const json = new TextDecoder().decode(inflated);
    const parsed: unknown = JSON.parse(json);
    if (!isPayloadV1(parsed)) return { ok: false, reason: "invalid" };
    return {
      ok: true,
      name: parsed.name,
      mermaid_code: parsed.mermaid_code,
    };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

/** Read and decode `#s=...` from `window.location.hash`. */
export function decodeShareFromLocation(): DecodeShareResult {
  return decodeShareFromHash(window.location.hash);
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/** Strip `#s=...` from the URL without navigation. */
export function clearShareHashFromLocation(): void {
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}`);
}
