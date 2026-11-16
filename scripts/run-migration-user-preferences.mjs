import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

function carregarEnv() {
  const arquivo = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(arquivo)) return;
  for (const linha of fs.readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^([A-Za-z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

carregarEnv();

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

async function main() {
  const conexao = await mysql.createConnection(config);
  try {
    await conexao.query(
      `CREATE TABLE IF NOT EXISTS user_preferences (
        user_id INT NOT NULL PRIMARY KEY,
        notifications TINYINT(1) NOT NULL DEFAULT 1,
        email_notifications TINYINT(1) NOT NULL DEFAULT 1,
        sms_notifications TINYINT(1) NOT NULL DEFAULT 0,
        atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
    console.log("[migration] tabela user_preferences garantida");
  } finally {
    await conexao.end();
  }
}

main().catch((erro) => {
  console.error("[migration] falhou:", erro);
  process.exit(1);
});
