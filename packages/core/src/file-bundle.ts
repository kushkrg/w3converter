/**
 * Utilities for bundling/unbundling multiple files into a single binary Buffer.
 *
 * Format:
 *   [4 bytes: manifest JSON length (UInt32LE)]
 *   [N bytes: manifest JSON — array of {n: filename, s: byte-length}]
 *   [file1 bytes][file2 bytes]…
 */

export interface BundledFile {
  name: string;
  buffer: Buffer;
}

/** Pack an array of named buffers into one contiguous Buffer. */
export function bundleFiles(files: BundledFile[]): Buffer {
  const manifest = files.map((f) => ({ n: f.name, s: f.buffer.length }));
  const headerBuf = Buffer.from(JSON.stringify(manifest), "utf-8");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(headerBuf.length, 0);
  return Buffer.concat([lenBuf, headerBuf, ...files.map((f) => f.buffer)]);
}

/** Unpack a bundle created by `bundleFiles`. */
export function unbundleFiles(data: Buffer): BundledFile[] {
  const headerLen = data.readUInt32LE(0);
  const manifest: { n: string; s: number }[] = JSON.parse(
    data.subarray(4, 4 + headerLen).toString("utf-8")
  );
  let offset = 4 + headerLen;
  return manifest.map((m) => {
    const buffer = Buffer.from(data.subarray(offset, offset + m.s));
    offset += m.s;
    return { name: m.n, buffer };
  });
}
