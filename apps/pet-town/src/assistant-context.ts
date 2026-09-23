function tail(text: string, maxBytes: number): string {
  const bytes = new TextEncoder().encode(text);
  let start = Math.max(0, bytes.length - maxBytes);
  while (start < bytes.length && (bytes[start] & 0xc0) === 0x80) start += 1;
  return new TextDecoder().decode(bytes.subarray(start));
}

export function toolTaskContext(task: string): string {
  const bytes = new TextEncoder().encode(task);
  let end = Math.min(bytes.length, 7_900);
  while (end > 0 && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end -= 1;
  return new TextDecoder().decode(bytes.subarray(0, end));
}

export function delegationContext(task: string, recentTranscript: string): string {
  const cleanTask =
    task.trim().slice(0, 2_000) ||
    "(no fresh speech captured since the last request; use recent conversation)";
  const recent = tail(recentTranscript, 2_000);
  return `Voice request (primary intent — act on this):\n${cleanTask}\n\nRecent conversation (reference resolution only, may contain recognition errors):\n${recent}\n\nHandle the request. Return verified status and what comes next.`;
}
