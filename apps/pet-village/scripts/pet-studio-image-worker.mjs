import { errorMessageForUser, generateImage, runSpritePipeline } from "@abhishek944/pi-image-gen";

const MAX_REQUEST_BYTES = 256 * 1024;
const MODELS = new Set(["gpt-image-2.5-sunburst", "gpt-image-2.5-flare"]);
const QUALITIES = new Set(["low", "medium", "high", "xhigh", "max"]);
const OUTPUT_DIRECTORY = ".generation-runs";

function emit(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function fail(message) {
  emit({ type: "error", message });
  process.exitCode = 1;
}

function text(value, field, maximum) {
  if (typeof value !== "string" || !value.trim() || value.length > maximum) {
    throw new Error(`${field} is invalid.`);
  }
  return value.trim();
}

function commonRequest(value, maximumPrompt) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("The generation request is invalid.");
  }
  const model = text(value.model, "Model", 80);
  const quality = text(value.quality, "Quality", 16);
  if (!MODELS.has(model)) throw new Error("Choose a supported GPT Image 2.5 model.");
  if (!QUALITIES.has(quality)) throw new Error("Choose a supported image quality.");
  return { model, quality, prompt: text(value.prompt, "Prompt", maximumPrompt) };
}

function settings(model) {
  return {
    defaultProvider: "openai-api",
    defaultModel: model,
    outputDir: OUTPUT_DIRECTORY,
    requestTimeoutMs: 180_000,
    openRouterDiscovery: false,
    spriteGeneration: {
      enabled: true,
      defaultRows: 2,
      defaultColumns: 3,
      defaultFormat: "frames",
      frameDurationMs: 150,
      strictValidation: true,
      outputDir: OUTPUT_DIRECTORY,
      maxFrames: 6,
    },
  };
}

async function readRequest() {
  const chunks = [];
  let length = 0;
  for await (const chunk of process.stdin) {
    length += chunk.length;
    if (length > MAX_REQUEST_BYTES) throw new Error("The generation request is too large.");
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("The generation request is invalid.");
  }
}

async function generateReference(request, signal) {
  const common = commonRequest(request, 32_000);
  const result = await generateImage(
    {
      prompt: common.prompt,
      n: 1,
      size: "1024x1024",
      quality: common.quality,
      outputFormat: "png",
      background: "transparent",
      filename: "reference",
      outputDir: OUTPUT_DIRECTORY,
    },
    {
      cwd: process.cwd(),
      settings: settings(common.model),
      signal,
      onProgress: (phase) => emit({ type: "progress", phase }),
    },
  );
  if (result.images.length !== 1)
    throw new Error("The provider returned an unexpected image count.");
  return {
    operation: "reference",
    model: result.model,
    provider: result.provider,
    path: result.images[0].path,
    metadata: result.metadata,
  };
}

const NAMED_ACTIONS = new Set([
  "cast",
  "attack",
  "shoot",
  "jump",
  "hurt",
  "hover",
  "charge",
  "explode",
  "death",
]);

function spriteAction(role, filename) {
  const words = filename.toLowerCase().split(/[-_]+/);
  if (role === "locomotion") return words.includes("run") ? "run" : "walk";
  const matched = words.find((word) => NAMED_ACTIONS.has(word));
  if (matched) return matched;
  return words.some((word) => ["idle", "sleep", "rest"].includes(word)) ? "idle" : "single";
}

function spritePrompt(prompt, action) {
  if (action !== "single") return prompt;
  return `${prompt}\n\nCustom six-frame timing contract: frame 1 is the readable starting pose; frame 2 anticipates the requested action; frame 3 begins it; frame 4 is its strongest peak; frame 5 recovers; frame 6 approaches frame 1 without duplicating it. The requested action is authoritative.`;
}

async function generateSprite(request, signal) {
  const common = commonRequest(request, 19_000);
  const role = text(request.role, "Animation kind", 32);
  if (role !== "stationary" && role !== "locomotion") {
    throw new Error("Choose stationary or locomotion for this animation.");
  }
  const reference = text(request.reference, "Reference image", 255);
  if (
    reference.includes("/") ||
    reference.includes("\\") ||
    reference === "." ||
    reference === ".."
  ) {
    throw new Error("The reference image path is invalid.");
  }
  const filename = text(request.filename, "Animation name", 80);
  const action = spriteAction(role, filename);
  const result = await runSpritePipeline(
    {
      prompt: spritePrompt(common.prompt, action),
      image: [reference],
      assetType: "character",
      action,
      view: "side",
      rows: 2,
      columns: 3,
      frameCount: 6,
      align: "feet",
      scaleStrategy: "fit",
      componentMode: "largest",
      format: "frames",
      frameDurationMs: 150,
      strictValidation: true,
      size: "1536x1024",
      quality: common.quality,
      filename,
      outputDir: OUTPUT_DIRECTORY,
    },
    {
      cwd: process.cwd(),
      settings: settings(common.model),
      signal,
      onProgress: (phase) => emit({ type: "progress", phase }),
    },
  );
  return {
    operation: "sprite",
    model: result.model,
    provider: result.provider,
    runDirectory: result.runDirectory,
    rawSheet: result.rawSheet,
    normalizedSheet: result.normalizedSheet,
    frames: result.frames,
    validation: result.validation,
    metadata: result.metadata,
  };
}

const controller = new AbortController();
for (const event of ["SIGINT", "SIGTERM"]) {
  process.once(event, () => controller.abort());
}

try {
  if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI API key is unavailable.");
  const request = await readRequest();
  let result;
  if (request.operation === "reference") {
    result = await generateReference(request, controller.signal);
  } else if (request.operation === "sprite") {
    result = await generateSprite(request, controller.signal);
  } else {
    throw new Error("The generation operation is invalid.");
  }
  emit({ type: "result", result });
} catch (error) {
  const message =
    error instanceof Error && error.message.endsWith(" is invalid.")
      ? error.message
      : errorMessageForUser(error);
  fail(message);
}
