import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const inputPath = process.argv[2] ? path.resolve(root, process.argv[2]) : path.join(root, "data", "games.csv");
const outputPath = path.join(root, "data", "games.json");

const csv = await fs.readFile(inputPath, "utf8");
const rows = parseCsv(csv);

if (rows.length === 0) {
  throw new Error("CSV vacio. Debe incluir cabecera y filas.");
}

const required = ["id", "title", "area", "level", "language", "url", "notes"];
for (const field of required) {
  if (!rows[0].hasOwnProperty(field)) {
    throw new Error(`Falta columna obligatoria: ${field}`);
  }
}

const games = rows.map((row, index) => {
  const game = {
    id: String(row.id || "").trim() || `juego-${index + 1}`,
    title: String(row.title || "").trim(),
    area: String(row.area || "").trim(),
    level: String(row.level || "").trim(),
    language: String(row.language || "").trim(),
    url: String(row.url || "").trim(),
    notes: String(row.notes || "").trim()
  };

  if (!game.title || !game.url) {
    throw new Error(`Fila ${index + 2} invalida: title y url son obligatorios.`);
  }

  return game;
});

await fs.writeFile(outputPath, `${JSON.stringify(games, null, 2)}\n`, "utf8");
console.log(`Importados ${games.length} juegos en data/games.json`);

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((line) => line.trim() !== "");
  if (lines.length < 2) {
    return [];
  }

  const headers = splitCsvLine(lines[0]).map((v) => v.trim());
  const data = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = splitCsvLine(lines[i]);
    const row = {};
    headers.forEach((header, j) => {
      row[header] = (values[j] || "").trim();
    });
    data.push(row);
  }

  return data;
}

function splitCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
}
