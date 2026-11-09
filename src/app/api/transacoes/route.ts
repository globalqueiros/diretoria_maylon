import { NextResponse } from "next/server";
import { db2 } from "../../lib/db";

// Força o mesmo charset/collation em qualquer expressão de texto
const c = (expr: string) =>
  `CONVERT(${expr} USING utf8mb4) COLLATE utf8mb4_unicode_ci`;

export async function GET() {
  try {
    const [rows] = await db2.query(`
      SELECT * FROM (
        -- Carteira / ledger
        SELECT
          ${c("id")}                                                        AS id,
          ${c("CONCAT('TRX-', LPAD(readable_id, 5, '0'))")}                 AS codigo,
          ${c("COALESCE(NULLIF(LEFT(reference, 120), ''), transaction_type)")} AS descricao,
          ${c("transaction_type")}                                          AS categoria,
          ${c("CASE WHEN credit > 0 THEN 'Entrada' ELSE 'Saída' END")}      AS tipo,
          CASE WHEN credit > 0 THEN credit ELSE debit END                   AS valor,
          DATE(created_at)                                                  AS data,
          ${c("COALESCE(NULLIF(account, ''), user_id)")}                    AS responsavel,
          ${c("COALESCE(NULLIF(trx_type, ''), 'Carteira')")}                AS metodo,
          ${c("'Concluída'")}                                               AS status,
          created_at                                                        AS ordem
        FROM transactions
        WHERE credit > 0 OR debit > 0

        UNION ALL

        -- Pagamentos PIX
        SELECT
          ${c("CAST(id AS CHAR)")},
          ${c("CONCAT('PIX-', LPAD(id, 4, '0'))")},
          ${c("CONCAT('Corrida ', trip_id)")},
          ${c("'Corridas'")},
          ${c("'Entrada'")},
          amount,
          DATE(COALESCE(paid_at, created_at)),
          ${c("'Passageiro'")},
          ${c("'PIX'")},
          ${c(`CASE status
                 WHEN 'paid'    THEN 'Concluída'
                 WHEN 'pending' THEN 'Pendente'
                 ELSE 'Cancelada'
               END`)},
          COALESCE(paid_at, created_at)
        FROM pix_transactions

        UNION ALL

        -- Estornos PIX concluídos
        SELECT
          ${c("CONCAT('est-', id)")},
          ${c("CONCAT('EST-', LPAD(id, 4, '0'))")},
          ${c("CONCAT('Estorno da corrida ', trip_id)")},
          ${c("'Estornos'")},
          ${c("'Saída'")},
          amount,
          DATE(COALESCE(refunded_at, updated_at)),
          ${c("'Sistema'")},
          ${c("'PIX'")},
          ${c("'Concluída'")},
          COALESCE(refunded_at, updated_at)
        FROM pix_transactions
        WHERE refund_status = 'done'
      ) t
      ORDER BY ordem DESC
      LIMIT 500
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ erro: "Erro ao buscar transações" }, { status: 500 });
  }
}