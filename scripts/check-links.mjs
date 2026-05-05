import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dataPath = path.join(root, "data", "games.json");
const outDir = path.join(root, "reports");
const outPath = path.join(outDir, "link-report.json");

const timeoutMs = 12000;
const concurrency = 6;
const strictWarnings = process.env.STRICT_WARNINGS === "true";

const games = await readGames(dataPath);
const urls = [...new Set(games.map((game) => game.url).filter(Boolean))];

console.log(`Comprobando ${urls.length} enlaces...`);
const checks = await runWithConcurrency(urls, concurrency, checkUrl);

const errorCount = checks.filter((item) => item.severity === "error").length;
const warningCount = checks.filter((item) => item.severity === "warning").length;
const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    checked: checks.length,
    errorCount,
    warningCount,
    hasBlockingIssues: errorCount > 0 || (strictWarnings && warningCount > 0)
  },
  results: checks
};

await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Informe guardado en ${path.relative(root, outPath)}`);
if (errorCount > 0 || (strictWarnings && warningCount > 0)) {
  if (errorCount > 0) {
    console.error(`Errores de enlace: ${errorCount}`);
  }
  if (warningCount > 0) {
    console.error(`Avisos de enlace: ${warningCount}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Chequeo completado sin bloqueos. Errores: ${errorCount}, avisos: ${warningCount}.`);
}

async function readGames(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("data/games.json debe contener un array de juegos");
  }
  return parsed;
}

async function runWithConcurrency(items, limit, worker) {
  let cursor = 0;
  const results = [];

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const url = items[cursor];
      cursor += 1;
      const result = await worker(url);
      results.push(result);
    }
  });

  await Promise.all(workers);

  return results.sort((a, b) => a.url.localeCompare(b.url));
}

async function checkUrl(url) {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const requestOptions = {
    redirect: "follow",
    signal: controller.signal,
    headers: {
      "user-agent": "BibliojocsLinkChecker/1.0 (+https://bibliojocs.edutictac.es/)"
    }
  };

  try {
    let response = await fetch(url, {
      ...requestOptions,
      method: "HEAD"
    });

    if (response.status === 405 || response.status === 501 || response.status === 403) {
      response = await fetch(url, {
        ...requestOptions,
        method: "GET",
        cache: "no-store"
      });
    }

    const ok = response.status >= 200 && response.status < 400;
    const severity = severityFromStatus(response.status);
    return {
      url,
      ok,
      severity,
      httpStatus: response.status,
      durationMs: Date.now() - start,
      error: ok ? null : `HTTP ${response.status}`
    };
  } catch (error) {
    const details = String(error?.message || error);
    const isTimeout = error?.name === "AbortError";
    const severity = isTimeout ? "warning" : "error";
    return {
      url,
      ok: false,
      severity,
      httpStatus: null,
      durationMs: Date.now() - start,
      error: isTimeout ? `timeout>${timeoutMs}ms` : details
    };
  } finally {
    clearTimeout(timer);
  }
}

function severityFromStatus(status) {
  if (status >= 200 && status < 400) {
    return "none";
  }

  if (status === 429) {
    return "warning";
  }

  if (status >= 500) {
    return "warning";
  }

  return "error";
}
