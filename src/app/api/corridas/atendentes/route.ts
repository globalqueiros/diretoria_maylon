// src/app/api/corridas/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db2 } from "../../../lib/db";

export const dynamic = "force-dynamic";

const LIMITE_PADRAO = 500;
const LIMITE_MAXIMO = 2000;

async function usuarioLogado(): Promise<boolean> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return false;

  try {
    jwt.verify(token, process.env.JWT_SECRET as string);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  if (!(await usuarioLogado())) {
    return NextResponse.json(
      { error: "Não autorizado", corridas: [] },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const pedido = Number(searchParams.get("limite") ?? LIMITE_PADRAO);
    const limite = Number.isInteger(pedido)
      ? Math.min(Math.max(pedido, 1), LIMITE_MAXIMO)
      : LIMITE_PADRAO;

    const [rows] = await db2.query({
      sql: `
        SELECT
          t.id,
          t.ref_id,
          t.current_status AS status,
          c.pickup_address AS origem,
          c.destination_address AS destino,
          up.full_name AS passageiro,
          um.full_name AS motorista,
          CASE
            WHEN t.actual_fare IS NOT NULL AND t.actual_fare > 0 THEN t.actual_fare
            ELSE t.estimated_fare
          END AS valor,
          t.paid_fare,
          t.payment_method AS forma_pagamento,
          t.payment_status AS status_pagamento,
          t.trip_cancellation_reason AS motivo_cancelamento,
          COALESCE(f.cancellation_fee, 0) AS taxa_cancelamento,
          COALESCE(f.return_fee, 0) AS taxa_retorno,
          COALESCE(f.waiting_fee, 0) AS taxa_espera,
          COALESCE(f.idle_fee, 0) AS taxa_ociosidade,
          COALESCE(f.delay_fee, 0) AS taxa_atraso,
          COALESCE(f.vat_tax, 0) AS imposto,
          COALESCE(f.tips, 0) AS gorjeta,
          COALESCE(f.admin_commission, 0) AS comissao_admin,
          f.cancelled_by AS cancelado_por,
          tm.estimated_time AS tempo_estimado,
          tm.actual_time AS tempo_real,
          tm.waiting_time AS tempo_espera,
          tm.delay_time AS tempo_atraso,
          tm.idle_time AS tempo_ocioso,
          tm.driver_arrival_time AS tempo_chegada_motorista,
          tm.driver_arrives_at AS motorista_chegou_em,
          tm.customer_arrives_at AS passageiro_chegou_em,
          ts.pending AS solicitada_em,
          ts.accepted AS aceita_em,
          ts.out_for_pickup AS a_caminho_em,
          ts.picked_up AS embarcou_em,
          ts.ongoing AS em_andamento_em,
          ts.completed AS concluida_em,
          ts.cancelled AS cancelada_em,
          ts.failed AS falhou_em,
          ts.returning AS retornando_em,
          ts.returned AS retornou_em,
          ts.note AS observacao_status,
          t.created_at AS data
        FROM smartmobility_db.trip_requests t
        LEFT JOIN smartmobility_db.trip_request_coordinates c ON c.trip_request_id = t.id
        LEFT JOIN smartmobility_db.trip_request_fees f ON f.trip_request_id = t.id
        LEFT JOIN smartmobility_db.trip_request_times tm ON tm.trip_request_id = t.id
        LEFT JOIN smartmobility_db.trip_status ts ON ts.trip_request_id = t.id
        LEFT JOIN smartmobility_db.users up ON up.id = t.customer_id
        LEFT JOIN smartmobility_db.users um ON um.id = t.driver_id
        WHERE t.deleted_at IS NULL
        ORDER BY t.created_at DESC, t.id DESC
        LIMIT ?
      `,
      values: [limite],
      timeout: 15000,
    });

    return NextResponse.json({
      corridas: rows,
      total: Array.isArray(rows) ? rows.length : 0,
    });
  } catch (error: unknown) {
    console.error("ERRO MYSQL - CORRIDAS:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao consultar as corridas.",
        corridas: [],
      },
      { status: 500 }
    );
  }
}