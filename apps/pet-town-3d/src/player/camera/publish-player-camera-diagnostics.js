import { getPlayerCameraRadius } from "./get-player-camera-radius.js";

/** Opt-in, bounded developer evidence without storing any companion identity. */
export function publishPlayerCameraDiagnostics(frame) {
  if (!this.ctx.params.has("cameraDebug")) return;
  const queries = this.ctx.cameraQueries;
  const overlaps = queries.overlaps(this.cam.position, getPlayerCameraRadius(this.cam));
  const debug = {
    state: this.cameraState,
    requested: this.distT,
    resolved: this.cam.position.distanceTo(this.focus),
    pitchAssist: this.assist,
    hit: this.cameraHit?.ownerId ?? null,
    overlaps: overlaps.length,
    revision: queries.revision,
    solveMs: performance.now() - this.solveStartedAt,
    colliders: queries.stats.colliders,
    prepareMs: queries.stats.prepareTotalMs - (this.queryPrepareStart ?? 0),
    position: this.cam.position.toArray(),
    subject: [frame.pos.x, frame.pos.y, frame.pos.z],
  };
  this.ctx.cameraDiagnostics = debug;
  this.ctx.cameraDiagnosticSamples ??= [];
  this.ctx.cameraDiagnosticSamples.push(debug.solveMs);
  if (this.ctx.cameraDiagnosticSamples.length > 180) this.ctx.cameraDiagnosticSamples.shift();
  const sorted = [...this.ctx.cameraDiagnosticSamples].sort((a, b) => a - b);
  debug.p95Ms = sorted[Math.floor((sorted.length - 1) * 0.95)];
  if (!this.ctx.cameraDiagnosticElement) {
    const element = document.createElement("output");
    element.setAttribute("aria-label", "Camera diagnostics");
    element.style.cssText =
      "position:fixed;top:150px;left:16px;z-index:100;pointer-events:none;white-space:pre;padding:10px;border-radius:8px;background:#16251de8;color:#fff;font:12px monospace";
    document.body.append(element);
    this.ctx.cameraDiagnosticElement = element;
  }
  if (this.ctx.params.has("cameraTrace")) {
    const trace = (this.ctx.cameraPoseTrace ??= []);
    trace.push({
      time: this.ctx.time,
      dt: this.ctx.dt,
      eye: debug.position,
      quaternion: this.cam.quaternion.toArray(),
      subject: debug.subject,
      head: frame.head?.toArray(),
      grounded: frame.onGround,
      focus: this.focus.toArray(),
      aim: this.aimCorrection,
      assist: this.assist,
      state: debug.state,
      overlaps: debug.overlaps,
    });
    if (trace.length > 600) trace.shift();
    if (!this.ctx.cameraTracePublishedAt || this.ctx.time - this.ctx.cameraTracePublishedAt > 0.2) {
      this.ctx.cameraDiagnosticElement.dataset.trace = JSON.stringify(trace);
      this.ctx.cameraTracePublishedAt = this.ctx.time;
    }
  }
  this.ctx.cameraDiagnosticElement.textContent =
    `Camera ${debug.state}\nZoom ${debug.resolved.toFixed(2)} / ${debug.requested.toFixed(2)}\n` +
    `Overlap ${debug.overlaps} · ${debug.hit ?? "clear"}\n` +
    `Solve p95 ${debug.p95Ms.toFixed(2)} ms · ${debug.colliders} solids\n` +
    `Prepare ${debug.prepareMs.toFixed(2)} ms · ${queries.stats.inventoryBuilds} inventories\n` +
    `Subject ${debug.subject.map((value) => value.toFixed(2)).join(", ")}`;
}
