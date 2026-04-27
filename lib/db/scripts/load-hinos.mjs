import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");
const hinosJsonPath = path.resolve(
  repoRoot,
  "artifacts",
  "hinario",
  "data",
  "hinos.json",
);
const seedsDir = path.resolve(import.meta.dirname, "..", "seeds");
const seedSqlPath = path.resolve(seedsDir, "hinos.seed.sql");

function sqlString(value) {
  if (value == null) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlInt(value) {
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid integer value: ${value}`);
  }
  return String(value);
}

function sqlBool(value) {
  return value ? "TRUE" : "FALSE";
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function buildInsertStatement(rows) {
  const values = rows
    .map((row) => {
      return `(${sqlInt(row.numero)}, ${sqlString(row.titulo)}, ${sqlString(
        row.letra,
      )}, ${sqlString(row.tom)}, ${sqlString(row.tipo)}, ${sqlBool(
        row.possuiCifra,
      )})`;
    })
    .join(",\n");

  return `INSERT INTO hinos (numero, titulo, letra, tom, tipo, possui_cifra)
VALUES
${values}
ON CONFLICT (numero) DO UPDATE
SET
  titulo = EXCLUDED.titulo,
  letra = EXCLUDED.letra,
  tom = EXCLUDED.tom,
  tipo = EXCLUDED.tipo,
  possui_cifra = EXCLUDED.possui_cifra;`;
}

function normalizeRows(input) {
  if (!Array.isArray(input)) {
    throw new Error("hinos.json must contain an array.");
  }

  return input.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Invalid row at index ${index}.`);
    }

    const numero = Number(item.numero);
    const titulo = item.titulo;
    const letra = item.letra;
    const tom = item.tom ?? null;
    const tipo = item.tipo ?? null;
    const possuiCifra = Boolean(item.possuiCifra);

    if (!Number.isInteger(numero) || numero <= 0) {
      throw new Error(`Invalid "numero" at index ${index}: ${item.numero}`);
    }

    if (typeof titulo !== "string" || titulo.trim() === "") {
      throw new Error(`Invalid "titulo" at index ${index}.`);
    }

    if (typeof letra !== "string" || letra.trim() === "") {
      throw new Error(`Invalid "letra" at index ${index}.`);
    }

    if (tom !== null && typeof tom !== "string") {
      throw new Error(`Invalid "tom" at index ${index}.`);
    }

    if (tipo !== null && typeof tipo !== "string") {
      throw new Error(`Invalid "tipo" at index ${index}.`);
    }

    return { numero, titulo, letra, tom, tipo, possuiCifra };
  });
}

async function main() {
  const raw = await fs.readFile(hinosJsonPath, "utf8");
  const parsed = JSON.parse(raw);
  const rows = normalizeRows(parsed);

  const statements = chunk(rows, 200).map((batch) => buildInsertStatement(batch));
  const sql = [
    "-- Generated automatically from artifacts/hinario/data/hinos.json",
    "BEGIN;",
    ...statements,
    "COMMIT;",
    "",
  ].join("\n");

  await fs.mkdir(seedsDir, { recursive: true });
  await fs.writeFile(seedSqlPath, sql, "utf8");

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query(sql);
  } finally {
    await client.end();
  }

  console.log(`Seed SQL generated at: ${seedSqlPath}`);
  console.log(`Loaded ${rows.length} hinos into database.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
