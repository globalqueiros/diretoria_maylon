import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db2 } from "../../lib/db";

async function autenticado() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET as string);
    return true;
  } catch {
    return false;
  }
}

// Entregas = corridas com type = 'parcel' em trip_requests
export async function GET() {
  if (!(await autenticado())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const [rows] = await db2.query(
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
        ORDER BY tr.created_at DESC
        LIMIT 500`
    );

    const entregas = (rows as any[]).map((e) => ({
      ...e,
      origem: e.origem ?? "",
      destino: e.destino ?? "",
      valor: Number(e.valor),
      criado_em: new Date(e.criado_em).toISOString(),
    }));

    return NextResponse.json({ entregas });
  } catch (err) {
    console.error("GET /api/entregas", err);
    return NextResponse.json({ error: "Erro ao buscar entregas" }, { status: 500 });
  }
}