import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db2 } from "../../../../lib/db";
import { exigirPerfilNaApi } from "../../../../lib/roles";

export const dynamic = "force-dynamic";

function numero(valor: unknown) {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function GET() {
  const auth = await exigirPerfilNaApi(["gerente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [rows] = await db2.query<RowDataPacket[]>(
      `SELECT ch.id, ch.protocolo, ch.motivo, ch.descricao, ch.valor,
              ch.status, ch.created_at, u.full_name AS motorista
         FROM chamados_reembolso ch
         LEFT JOIN trip_requests t ON t.id = ch.corrida_id
         LEFT JOIN users u ON u.id = t.driver_id
         LEFT JOIN users m ON m.id = t.driver_id AND m.gerente = ?
        WHERE m.id IS NOT NULL
        ORDER BY ch.id DESC
        LIMIT 500`,
      [auth.usuario.id]
    );

    return NextResponse.json(
      {
        solicitacoes: rows.map((row) => ({
          id: row.id,
          solicitante: row.motorista ?? "Motorista",
          tipo: row.motivo ?? "Reembolso",
          descricao: row.descricao ?? "",
          data: row.created_at ? new Date(row.created_at).toISOString() : "",
          status: String(row.status ?? "aberto"),
          valor: numero(row.valor),
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/gerente/financeiro/aprovacoes:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os reembolsos.", solicitacoes: [] },
      { status: 500 }
    );
  }
}
