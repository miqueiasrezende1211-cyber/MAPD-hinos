import crypto from "node:crypto";
import pg from "pg";

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const adminEmail = process.env.ADMIN_EMAIL ?? "admin@local.dev";
const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
const adminName = process.env.ADMIN_NAME ?? "Administrador";

if (adminPassword.length < 8) {
  throw new Error("ADMIN_PASSWORD must have at least 8 characters.");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const senhaHash = hashPassword(adminPassword);
    await client.query(
      `
      INSERT INTO usuarios (nome, email, senha_hash, papel, ativo)
      VALUES ($1, $2, $3, 'admin', TRUE)
      ON CONFLICT (email) DO UPDATE
      SET
        nome = EXCLUDED.nome,
        senha_hash = EXCLUDED.senha_hash,
        papel = 'admin',
        ativo = TRUE,
        updated_at = NOW();
      `,
      [adminName, adminEmail.toLowerCase(), senhaHash],
    );

    console.log(`Admin user ready: ${adminEmail.toLowerCase()}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
