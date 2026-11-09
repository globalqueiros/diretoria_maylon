import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db2 } from "../../../lib/db";

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

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  if (!(await autenticado())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const [rows]: any = await db2.query(
      `SELECT tr.id,
              tr.ref_id AS codigo,
              tr.customer_id, c.full_name AS remetente, c.phone AS remetente_telefone,
              tr.driver_id, d.full_name AS motorista, d.phone AS motorista_telefone,
              trc.pickup_address AS origem,
              trc.destination_address AS destino,
              tr.estimated_fare, tr.actual_fare, tr.paid_fare,
              tr.estimated_distance, tr.actual_distance,
              tr.payment_method, tr.payment_status,
              tr.note, tr.trip_cancellation_reason,
              tr.scheduled_at,
              CASE
                WHEN tr.current_status = 'completed' THEN 'entregue'
                WHEN tr.current_status IN ('cancelled', 'canceled') THEN 'cancelada'
                WHEN tr.current_status = 'pending' THEN 'pendente'
                ELSE 'em_rota'
              END AS status,
              tr.current_status AS status_original,
              tr.created_at AS criado_em,
              tr.updated_at AS atualizado_em
         FROM trip_requests tr
         LEFT JOIN users c ON c.id = tr.customer_id
         LEFT JOIN users d ON d.id = tr.driver_id
         LEFT JOIN trip_request_coordinates trc ON trc.trip_request_id = tr.id
        WHERE tr.id = ? AND tr.type = 'parcel' AND tr.deleted_at IS NULL`,
      [id]
    );

    if (!rows.length) {
      return NextResponse.json({ error: "Entrega não encontrada" }, { status: 404 });
    }

    const e = rows[0];
    return NextResponse.json({
      entrega: {
        ...e,
        estimated_fare: Number(e.estimated_fare),
        actual_fare: Number(e.actual_fare),
        paid_fare: Number(e.paid_fare),
        criado_em: new Date(e.criado_em).toISOString(),
        atualizado_em: e.atualizado_em ? new Date(e.atualizado_em).toISOString() : null,
      },
    });
  } catch (err) {
    console.error("GET /api/entregas/[id]", err);
    return NextResponse.json({ error: "Erro ao buscar entrega" }, { status: 500 });
  }
}