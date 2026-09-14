export function delegationContext(transcript: string): string {
  const bytes = new TextEncoder().encode(transcript);
  let start = Math.max(0, bytes.length - 22_000);
  while (start < bytes.length && (bytes[start] & 0xc0) === 0x80) start += 1;
  const recent = new TextDecoder().decode(bytes.subarray(start));
  return `Voice conversation transcript (may contain recognition errors):\n${recent}\n\nHandle the request associated with this delegation. Return verified status and what comes next.`;
}
