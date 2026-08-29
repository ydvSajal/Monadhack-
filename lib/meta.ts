import type { TaskMeta } from "./contract";

// Task metadata rides on-chain as a data URI in the `metadataURI` string param.
// ponytail: no backend, no IPFS. Tasks are small (a few URLs + labels); calldata is cheap on Monad.
const PREFIX = "data:application/json;base64,";

export function encodeMeta(meta: TaskMeta): string {
  const json = JSON.stringify(meta);
  const b64 = typeof window === "undefined" ? Buffer.from(json).toString("base64") : btoa(unescape(encodeURIComponent(json)));
  return PREFIX + b64;
}

export function decodeMeta(uri: string): TaskMeta | null {
  try {
    if (!uri.startsWith(PREFIX)) return null;
    const b64 = uri.slice(PREFIX.length);
    const json =
      typeof window === "undefined"
        ? Buffer.from(b64, "base64").toString("utf8")
        : decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json) as TaskMeta;
  } catch {
    return null;
  }
}
