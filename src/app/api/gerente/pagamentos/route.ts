import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db2 } from "../../../lib/db";
import { exigirPerfilNaApi } from "../../../lib/roles";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await exigirPerfilNaApi(["gerente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, pagamentos: [] },
      { status: auth.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const pedido = Number(searchParams.get("limite") ?? 500);
    const limite = Number.isInteger(pedido)
      ? Math.min(Math.max(pedido, 1), 2000)
      : 500;

    const [rows] = await db2.query<RowDataPacket[]>(
      `SELECT
          t.id,
          t.id AS corrida_id,
          t.ref_id AS transacao,
          t.payment_method AS metodo,
          CASE
            WHEN t.actual_fare IS NOT NULL AND t.actual_fare > 0 THEN t.actual_fare
            ELSE t.estimated_fare
          END AS valor,
          t.paid_fare,
          CASE
            WHEN LOWER(t.payment_status) = 'paid' THEN 'aprovado'
            WHEN LOWER(t.current_status) IN ('cancelled', 'canceled') THEN 'cancelado'
            WHEN LOWER(t.current_status) = 'failed' THEN 'recusado'
            ELSE 'pendente'
          END AS status,
          up.full_name AS passageiro,
          um.full_name AS motorista,
          c.pickup_address AS origem,
          c.destination_address AS destino,
          (
            SELECT ch.protocolo
            FROM smartmobility_db.chamados_reembolso ch
            WHERE ch.corrida_id = t.id
              AND ch.status IN ('aberto', 'em_analise')
            ORDER BY ch.id DESC
            LIMIT 1
          ) AS protocolo_chamado,
          COALESCE(ts.completed, t.updated_at, t.created_at) AS data
        FROM smartmobility_db.trip_requests t
        LEFT JOIN smartmobility_db.trip_request_coordinates c ON c.trip_request_id = t.id
        LEFT JOIN smartmobility_db.trip_status ts ON ts.trip_request_id = t.id
        LEFT JOIN smartmobility_db.users up ON up.id = t.customer_id
        LEFT JOIN smartmobility_db.users um ON um.id = t.driver_id
        WHERE t.deleted_at IS NULL
          AND t.driver_id IN (
            SELECT id FROM smartmobility_db.users
            WHERE user_type = 'driver' AND gerente = ?
          )
        ORDER BY t.created_at DESC, t.id DESC
        LIMIT ?`,
      [auth.usuario.id, limite]
    );

    const pagamentos = rows.map((row) => {
      const pago = Number(row.paid_fare ?? 0);
      const valor =
        row.status === "aprovado" && pago > 0 ? pago : Number(row.valor ?? 0);
      return { ...row, valor };
    });

    return NextResponse.json(
      { pagamentos, total: pagamentos.length },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/gerente/pagamentos:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao consultar os pagamentos.",
        pagamentos: [],
      },
      { status: 500 }
    );
  }
}
