export const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing settings control: ${id}`);
  return element as T;
};
export function setSwitch(id: string, checked: boolean): void {
  byId<HTMLButtonElement>(id).setAttribute("aria-checked", String(checked));
}
