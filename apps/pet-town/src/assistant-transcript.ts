let transcript = "";
let transcriptRole = "";

export function readTranscript(): string {
  return transcript;
}

export function appendTranscript(role: "user" | "assistant", delta: string): void {
  transcript = `${transcript}${transcriptRole === role ? "" : `\n${role}: `}${delta}`.slice(
    -22_000,
  );
  transcriptRole = role;
  const container = document.getElementById("transcript")!;
  container.querySelector(".empty")?.remove();
  let paragraph = container.lastElementChild as HTMLElement | null;
  if (!paragraph?.classList.contains(role)) {
    paragraph = document.createElement("p");
    paragraph.className = role;
    container.append(paragraph);
  }
  paragraph.textContent = `${paragraph.textContent ?? ""}${delta}`.slice(-12_000);
  while (container.childElementCount > 80) container.firstElementChild?.remove();
  container.scrollTop = container.scrollHeight;
}

export function resetTranscript(): void {
  transcript = "";
  transcriptRole = "";
  document.getElementById("transcript")!.replaceChildren(
    Object.assign(document.createElement("p"), {
      className: "empty",
      textContent: "Conversation text appears here temporarily.",
    }),
  );
}
