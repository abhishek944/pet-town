export function agentIdForPetClick(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;
  const control = target.closest(".pet") ?? target.closest(".project");
  const citizen = control?.closest<HTMLElement>(".citizen");
  if (citizen?.hidden || citizen?.classList.contains("retiring")) return null;
  return citizen?.dataset.agentId || null;
}

export function installPetFocus(
  root: HTMLElement,
  focusAgent: (id: string) => void | Promise<void>,
): () => void {
  const handleClick = (event: MouseEvent): void => {
    const id = agentIdForPetClick(event.target);
    if (!id) return;
    const citizen = (event.target as Element).closest<HTMLElement>(".citizen");
    if (!citizen || citizen.dataset.focusPending === "true") return;
    citizen.dataset.focusPending = "true";
    delete citizen.dataset.focusError;
    void Promise.resolve().then(() => focusAgent(id)).catch(() => {
      citizen.dataset.focusError = "true";
    }).finally(() => {
      delete citizen.dataset.focusPending;
    });
  };
  root.addEventListener("click", handleClick);
  return () => root.removeEventListener("click", handleClick);
}
