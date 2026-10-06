// Appended to the generated bridge. Only numeric activity leaves this extension.
export default function (pi) {
  const details = (ctx) => [
    ctx.sessionManager.getSessionFile?.() || ctx.sessionManager.getSessionId?.() || processSession,
    ctx.cwd,
  ];
  const emit = (event, ctx) => send(event, ...details(ctx));
  const buckets = new Map();
  let timer = null;
  let active = false;

  function stopMeter() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    buckets.clear();
  }

  function startMeter(ctx) {
    if (timer !== null) return;
    timer = setInterval(() => {
      const bucket = Math.floor(performance.now() / 1000);
      let tokens = 0;
      for (const [second, count] of buckets) {
        if (second <= bucket - 5) buckets.delete(second);
        else tokens += count;
      }
      void send("token_activity", ...details(ctx), {
        output_tokens_per_minute: Math.min(1000000, Math.round(tokens * 12)),
        observed_at_ms: Date.now(),
      });
    }, 1000);
    timer.unref?.();
  }

  pi.on("session_start", (_event, ctx) => {
    active = false;
    stopMeter();
    return emit("session_start", ctx);
  });
  pi.on("input", (_event, ctx) => emit("activity", ctx));
  pi.on("agent_start", (_event, ctx) => {
    active = true;
    stopMeter();
    startMeter(ctx);
    return emit("activity", ctx);
  });
  pi.on("message_update", (event) => {
    const update = event.assistantMessageEvent;
    if (
      timer === null ||
      !update ||
      !["text_delta", "thinking_delta", "toolcall_delta"].includes(update.type)
    )
      return;
    if (typeof update.delta !== "string") return;
    const bucket = Math.floor(performance.now() / 1000);
    // A stream fragment is NOT a token. This deliberately approximate meter
    // counts UTF-16 characters / 4, without retaining any response text.
    buckets.set(bucket, Math.min(1000000, (buckets.get(bucket) || 0) + update.delta.length / 4));
  });
  pi.on("tool_execution_start", (_event, ctx) => emit("activity", ctx));
  pi.on("ui_prompt_start", (_event, ctx) => {
    stopMeter();
    return emit("user_input", ctx);
  });
  pi.on("ui_prompt_end", (_event, ctx) => {
    if (active) startMeter(ctx);
    return emit("activity", ctx);
  });
  pi.on("agent_settled", (_event, ctx) => {
    active = false;
    stopMeter();
    return emit("stop", ctx);
  });
  pi.on("session_shutdown", (_event, ctx) => {
    active = false;
    stopMeter();
    return emit("session_end", ctx);
  });
}
