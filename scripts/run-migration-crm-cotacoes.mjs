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
        WHERE table_schema = DATABASE() AND table_name = 'vendas'
          AND column_name IN ('crm_stage','crm_atualizado_em')`
    );
    const existentes = new Set(colunas.map((c) => c.column_name));

    if (!existentes.has("crm_stage") || !existentes.has("crm_atualizado_em")) {
      const adicoes = [];
      if (!existentes.has("crm_stage")) adicoes.push("ADD COLUMN crm_stage VARCHAR(20) NULL");
      if (!existentes.has("crm_atualizado_em")) adicoes.push("ADD COLUMN crm_atualizado_em DATETIME NULL");
      await conexao.query(`ALTER TABLE vendas ${adicoes.join(", ")}`);
      console.log("[migration] colunas de CRM adicionadas em vendas");
    } else {
      console.log("[migration] colunas de CRM já existem em vendas");
    }

    const [resultado] = await conexao.query(
      `UPDATE vendas SET crm_stage = CASE status
         WHEN 'pendente'   THEN 'Contato'
         WHEN 'registrada' THEN 'Proposta'
         WHEN 'paga'       THEN 'Ganho'
         WHEN 'cancelada'  THEN 'Perdido'
         ELSE 'Contato'
       END
       WHERE crm_stage IS NULL`
    );
    console.log(`[migration] backfill crm_stage: ${resultado.affectedRows} linha(s)`);

    await conexao.query(
      `CREATE TABLE IF NOT EXISTS cotacoes_publicidade (
        id INT AUTO_INCREMENT PRIMARY KEY,
        protocolo VARCHAR(30) NOT NULL UNIQUE,
        nome VARCHAR(150) NOT NULL,
        empresa VARCHAR(150) NOT NULL,
        email VARCHAR(150) NULL,
        whatsapp VARCHAR(30) NULL,
        mensagem TEXT NULL,
        publicos JSON NOT NULL,
        espacos JSON NOT NULL,
        semanas INT NOT NULL DEFAULT 4,
        segmentado TINYINT(1) NOT NULL DEFAULT 0,
        criacao TINYINT(1) NOT NULL DEFAULT 0,
        total DECIMAL(12,2) NOT NULL DEFAULT 0,
        status ENUM('pendente','aprovada','recusada') NOT NULL DEFAULT 'pendente',
        observacao_gerente TEXT NULL,
        criado_por_id INT NULL,
        criado_por_nome VARCHAR(150) NULL,
        decidido_por VARCHAR(150) NULL,
        decidido_em DATETIME NULL,
        criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
    console.log("[migration] tabela cotacoes_publicidade garantida");
  } finally {
    await conexao.end();
  }
}

main().catch((erro) => {
  console.error("[migration] falhou:", erro);
  process.exit(1);
});
