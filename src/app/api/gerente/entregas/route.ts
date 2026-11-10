import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db2 } from "../../../lib/db";
import { exigirPerfilNaApi } from "../../../lib/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await exigirPerfilNaApi(["gerente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [rows] = await db2.query<RowDataPacket[]>(
      `SELECT tr.id,
              tr.ref_id AS codigo,
              COALESCE(c.full_name, '—') AS remetente,
              NULL AS destinatario,
              trc.pickup_address AS origem,
              trc.destination_address AS destino,
              d.full_name AS motorista,
              COALESCE(NULLIF(tr.actual_fare, 0), tr.estimated_fare, 0) AS valor,
              CASE
                WHEN tr.current_status = 'completed' THEN 'entregue'
                WHEN tr.current_status IN ('cancelled', 'canceled') THEN 'cancelada'
                WHEN tr.current_status = 'pending' THEN 'pendente'
                ELSE 'em_rota'
              END AS status,
              tr.created_at AS criado_em
         FROM trip_requests tr
         LEFT JOIN users c ON c.id = tr.customer_id
         LEFT JOIN users d ON d.id = tr.driver_id
         LEFT JOIN trip_request_coordinates trc ON trc.trip_request_id = tr.id
        WHERE tr.type = 'parcel'
          AND tr.deleted_at IS NULL
          AND tr.driver_id IN (
            SELECT id FROM users WHERE user_type = 'driver' AND gerente = ?
          )
        ORDER BY tr.created_at DESC
        LIMIT 500`,
      [auth.usuario.id]
    );

    return NextResponse.json(
      {
        entregas: rows.map((e) => ({
          ...e,
          origem: e.origem ?? "",
          destino: e.destino ?? "",
          valor: Number(e.valor),
          criado_em: new Date(e.criado_em).toISOString(),
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/gerente/entregas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar entregas", entregas: [] },
      { status: 500 }
    );
  }
}
