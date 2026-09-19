export class SettingsStartupBuffer<T extends { revision: number }, Selection = string> {
  private ready = false;
  private pendingSnapshot: T | undefined;
  private pendingSelection: Selection | undefined;

  receiveSnapshot(value: T, apply: (snapshot: T) => void): void {
    if (this.ready) apply(value);
    else if (!this.pendingSnapshot || value.revision >= this.pendingSnapshot.revision) {
      this.pendingSnapshot = value;
    }
  }

  receiveSelection(value: Selection, apply: (selection: Selection) => void): void {
    if (this.ready) apply(value);
    else this.pendingSelection = value;
  }

  finish(
    initialSnapshot: T,
    initialSelection: Selection,
    install: (snapshot: T, selection?: Selection) => void,
  ): void {
    const pending = this.pendingSnapshot;
    install(
      pending && pending.revision >= initialSnapshot.revision ? pending : initialSnapshot,
      this.pendingSelection !== undefined ? this.pendingSelection : initialSelection,
    );
    this.ready = true;
    this.pendingSnapshot = undefined;
    this.pendingSelection = undefined;
  }
}
