import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const root = process.cwd();
const gamesPath = path.join(root, "data", "games.json");
const imageDir = path.join(root, "assets", "game-images");
const browserPath =
  process.env.CHROMIUM_BIN ||
  process.env.BROWSER_BIN ||
  "chromium";

const options = parseArgs(process.argv.slice(2));
const games = await readJsonArray(gamesPath);
await fs.mkdir(imageDir, { recursive: true });

const pendingGames = selectGames(games, options);

if (!pendingGames.length) {
  console.log("No hay juegos pendientes de capturar.");
  process.exit(0);
}

let captured = 0;
let skipped = 0;
let failed = 0;

for (const game of pendingGames) {
  const ext = options.extension;
  const relativeImagePath = `assets/game-images/${sanitizeFileName(game.id || game.title || "game")}.${ext}`;
  const absoluteImagePath = path.join(root, relativeImagePath);
  const capturePath = options.dryRun
    ? path.join(os.tmpdir(), `${sanitizeFileName(game.id || game.title || "game")}-preview.${ext}`)
    : absoluteImagePath;

  if (!options.force && game.image) {
    skipped += 1;
    logProgress("skip", game, "ya tiene imagen");
    continue;
  }

  if (!options.force && (await fileExists(absoluteImagePath))) {
    if (!options.dryRun) {
      game.image = relativeImagePath;
    }
    skipped += 1;
    logProgress("skip", game, "imagen ya existente");
    continue;
  }

  if (!isValidHttpUrl(game.url)) {
    failed += 1;
    logProgress("fail", game, "URL no valida para captura");
    continue;
  }

  const preflight = await checkUrlReachable(game.url, options);
  if (!preflight.ok) {
    failed += 1;
    logProgress("fail", game, preflight.reason);
    continue;
  }

  logProgress("shot", game, game.url);
  const result = await captureScreenshot(game.url, capturePath, options);
  if (!result.ok) {
    failed += 1;
    logProgress("fail", game, result.reason);
    continue;
  }

  if (!options.dryRun) {
    game.image = relativeImagePath;
    if (!game.imageSource) {
      game.imageSource = game.url;
    }
  }
  captured += 1;
}

if (!options.dryRun) {
  await fs.writeFile(gamesPath, `${JSON.stringify(games, null, 2)}\n`, "utf8");
}

console.log("");
console.log(`Total candidatos: ${pendingGames.length}`);
console.log(`Capturas guardadas: ${captured}`);
console.log(`Saltados: ${skipped}`);
console.log(`Fallidos: ${failed}`);

function parseArgs(argv) {
  const out = {
    dryRun: false,
    force: false,
    onlyMissing: true,
    limit: Number.POSITIVE_INFINITY,
    offset: 0,
    ids: new Set(),
    host: "",
    width: 1280,
    height: 720,
    delayMs: 5000,
    extension: "png"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      out.dryRun = true;
      continue;
    }
    if (arg === "--force") {
      out.force = true;
      continue;
    }
    if (arg === "--all") {
      out.onlyMissing = false;
      continue;
    }
    if (arg === "--limit") {
      out.limit = parsePositiveInt(argv[++index], "limit");
      continue;
    }
    if (arg === "--offset") {
      out.offset = parsePositiveInt(argv[++index], "offset", true);
      continue;
    }
    if (arg === "--id") {
      const value = String(argv[++index] || "").trim();
      if (!value) {
        throw new Error("Falta valor para --id");
      }
      out.ids.add(value);
      continue;
    }
    if (arg === "--host") {
      out.host = String(argv[++index] || "").trim().toLowerCase();
      continue;
    }
    if (arg === "--width") {
      out.width = parsePositiveInt(argv[++index], "width");
      continue;
    }
    if (arg === "--height") {
      out.height = parsePositiveInt(argv[++index], "height");
      continue;
    }
    if (arg === "--delay-ms") {
      out.delayMs = parsePositiveInt(argv[++index], "delay-ms", true);
      continue;
    }
    if (arg === "--jpg" || arg === "--jpeg") {
      out.extension = "jpg";
      continue;
    }
    if (arg === "--png") {
      out.extension = "png";
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelpAndExit();
    }
    throw new Error(`Argumento no soportado: ${arg}`);
  }

  return out;
}

function printHelpAndExit() {
  console.log(`Uso:
  node scripts/capture-game-images.mjs [opciones]

Opciones:
  --limit N       Captura como maximo N juegos
  --offset N      Salta los primeros N candidatos
  --id ID         Captura solo un juego concreto; se puede repetir
  --host HOST     Filtra por dominio de la URL
  --all           Incluye juegos que ya tienen campo image
  --force         Sobrescribe capturas y reasigna image
  --dry-run       No modifica games.json
  --width N       Ancho de la ventana virtual
  --height N      Alto de la ventana virtual
  --delay-ms N    Espera antes de disparar la captura
  --jpg           Guarda en JPG en lugar de PNG
  --png           Guarda en PNG

Variables:
  CHROMIUM_BIN    Ruta al ejecutable de Chromium o Chrome
  BROWSER_BIN     Alias alternativo para el navegador
`);
  process.exit(0);
}

function parsePositiveInt(value, name, allowZero = false) {
  const parsed = Number.parseInt(String(value || ""), 10);
  const min = allowZero ? 0 : 1;
  if (!Number.isFinite(parsed) || parsed < min) {
    throw new Error(`Valor no valido para --${name}: ${value}`);
  }
  return parsed;
}

function selectGames(games, options) {
  let selected = Array.isArray(games) ? [...games] : [];

  if (options.onlyMissing) {
    selected = selected.filter((game) => !game.image);
  }

  if (options.ids.size) {
    selected = selected.filter((game) => options.ids.has(String(game.id || "")));
  }

  if (options.host) {
    selected = selected.filter((game) => {
      try {
        return new URL(game.url).host.toLowerCase().includes(options.host);
      } catch {
        return false;
      }
    });
  }

  if (options.offset) {
    selected = selected.slice(options.offset);
  }

  return selected.slice(0, options.limit);
}

async function captureScreenshot(url, outputPath, options) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "bibliojocs-shot-"));
  try {
    await fs.rm(outputPath, { force: true }).catch(() => {});
    const args = [
      "--headless",
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      "--mute-audio",
      "--incognito",
      "--no-first-run",
      "--no-default-browser-check",
      `--window-size=${options.width},${options.height}`,
      `--virtual-time-budget=${options.delayMs}`,
      `--user-data-dir=${tempDir}`,
      `--screenshot=${outputPath}`,
      url
    ];

    const chromeTimeoutMs = options.delayMs + 20000;
    const result = await runCommand(browserPath, args, chromeTimeoutMs);
    if (result.code !== 0) {
      return {
        ok: false,
        reason: summarizeFailure(result.stderr || result.stdout || `codigo ${result.code}`)
      };
    }

    const stat = await fs.stat(outputPath).catch(() => null);
    if (!stat || stat.size === 0) {
      return {
        ok: false,
        reason: "no se genero archivo de captura"
      };
    }

    return { ok: true };
  } finally {
    if (options.dryRun) {
      await fs.rm(outputPath, { force: true }).catch(() => {});
    }
    await fs.rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  }
}

async function checkUrlReachable(url, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, Math.max(4000, Math.min(options.delayMs, 15000)));

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari"
      }
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: `respuesta HTTP ${response.status}`
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: summarizeFailure(error?.message || "error de red")
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function runCommand(command, args, timeoutMs = 0) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (code, extraStderr = "") => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code: Number(code), stdout, stderr: stderr + extraStderr });
    };

    const timer = timeoutMs > 0
      ? setTimeout(() => {
          child.kill("SIGKILL");
          finish(-1, "timeout: proceso terminado por exceder el limite de tiempo");
        }, timeoutMs)
      : null;

    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", (error) => finish(-1, error.message));
    child.on("close", (code) => finish(code));
  });
}

function summarizeFailure(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" | ")
    .slice(0, 220);
}

function sanitizeFileName(value) {
  return String(value || "game")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "game";
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function readJsonArray(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Se esperaba un array JSON en ${filePath}`);
  }
  return parsed;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function logProgress(kind, game, detail) {
  const prefix = {
    shot: "[captura]",
    skip: "[salta]",
    fail: "[fallo]"
  }[kind] || "[info]";
  console.log(`${prefix} ${game.id || game.title}: ${detail}`);
}
