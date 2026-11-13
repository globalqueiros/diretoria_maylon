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
    const [colunas] = await conexao.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'clientes'
          AND column_name = 'lead_status'`
    );

    if (!colunas.length) {
      await conexao.query(
        `ALTER TABLE clientes ADD COLUMN lead_status VARCHAR(20) NOT NULL DEFAULT 'Novo'`
      );
      console.log("[migration] coluna clientes.lead_status adicionada");
    } else {
      console.log("[migration] coluna clientes.lead_status já existe");
    }

    const [resultado] = await conexao.query(
      `UPDATE clientes c SET lead_status = CASE
         WHEN EXISTS (SELECT 1 FROM vendas v WHERE v.cliente_id = c.id AND v.status = 'paga') THEN 'Convertido'
         WHEN EXISTS (SELECT 1 FROM vendas v WHERE v.cliente_id = c.id AND v.status IN ('pendente','registrada')) THEN 'Proposta'
         WHEN c.status = 1 THEN 'Perdido'
         ELSE 'Novo'
       END`
    );
    console.log(`[migration] backfill lead_status: ${resultado.affectedRows} linha(s)`);
  } finally {
    await conexao.end();
  }
}

main().catch((erro) => {
  console.error("[migration] falhou:", erro);
  process.exit(1);
});
