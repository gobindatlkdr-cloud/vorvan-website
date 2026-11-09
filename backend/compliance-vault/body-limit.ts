/** Bounded request-body reader for private compliance document uploads.
 * Reject both falsely declared Content-Length and chunked/no-length oversize payloads.
 * Never buffer more than maxBytes, and do not emit file contents in logs.
 */
export async function readBytesWithLimit(req: Request, maxBytes: number): Promise<Uint8Array | null> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) return null;
  const declared = req.headers.get("content-length");
  if (declared !== null && (!/^[0-9]+$/.test(declared) || Number(declared) > maxBytes)) return null;
  if (!req.body) return null;
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      total += part.value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(part.value);
    }
    const output = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return output;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}
