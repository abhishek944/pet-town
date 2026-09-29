export function toolTaskContext(task: string): string {
  const bytes = new TextEncoder().encode(task);
  let end = Math.min(bytes.length, 7_900);
  while (end > 0 && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end -= 1;
  return new TextDecoder().decode(bytes.subarray(0, end));
}
