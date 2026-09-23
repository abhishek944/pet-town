export function bindRange(id: string, update: (value: number) => void, render: () => void): void {
  const input = document.getElementById(id) as HTMLInputElement;
  input.addEventListener("input", () => {
    update(Number(input.value));
    render();
  });
}

export function bindSwitch(
  id: string,
  update: (checked: boolean) => void,
  render: () => void,
): void {
  const button = document.getElementById(id) as HTMLButtonElement;
  button.addEventListener("click", () => {
    update(button.getAttribute("aria-checked") !== "true");
    render();
  });
}
