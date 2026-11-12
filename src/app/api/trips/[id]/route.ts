import { NextResponse } from "next/server";
import { db2 } from "../../../lib/db";

export const dynamic = "force-dynamic";

const ID_VALIDO = /^[0-9a-fA-F-]{36}$/;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await context.params;

    if (!ID_VALIDO.test(id)) {
      return NextResponse.json(
        { error: "Identificador de corrida inválido." },
        { status: 400 }
      );
    }

    const [rows]: any = await db2.query({
      sql: `
        SELECT
          t.id,
          t.ref_id,
          t.current_status AS status,
          c.pickup_address AS origem,
          c.destination_address AS destino,
          up.full_name AS passageiro,
          um.full_name AS motorista,
          t.driver_id AS motorista_id,
          um.phone AS motorista_telefone,
          v.licence_plate_number AS placa,
          CONCAT_WS(' ', vb.name, vm.name) AS modelo_veiculo,
          vm.image AS imagem_veiculo,
          COALESCE(vc.name, tvc.name) AS categoria_veiculo,
          CASE
            WHEN t.actual_fare IS NOT NULL AND t.actual_fare > 0 THEN t.actual_fare
            ELSE t.estimated_fare
          END AS valor,
          t.estimated_fare AS valor_estimado,
          t.actual_fare AS valor_real,
          t.paid_fare,
          t.due_amount AS valor_devido,
          t.extra_fare_amount AS valor_extra,
          t.surge_percentage AS surge,
          t.discount_amount AS desconto,
          t.coupon_amount AS cupom,
          t.estimated_distance AS distancia_estimada,
          t.actual_distance AS distancia_real,
          t.payment_method AS forma_pagamento,
          t.payment_status AS status_pagamento,
          t.trip_cancellation_reason AS motivo_cancelamento,
          t.note AS observacao,
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
        LEFT JOIN smartmobility_db.vehicles v
          ON v.driver_id = t.driver_id AND v.deleted_at IS NULL
        LEFT JOIN smartmobility_db.vehicle_models vm ON vm.id = v.model_id
        LEFT JOIN smartmobility_db.vehicle_brands vb ON vb.id = vm.brand_id
        LEFT JOIN smartmobility_db.vehicle_categories vc ON vc.id = v.category_id
        LEFT JOIN smartmobility_db.vehicle_categories tvc ON tvc.id = t.vehicle_category_id
        WHERE t.id = ? AND t.deleted_at IS NULL
        LIMIT 1
      `,
      values: [id],
      timeout: 15000,
    });

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Corrida não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({ corrida: rows[0] });
  } catch (error: unknown) {
    console.error("ERRO MYSQL - CORRIDA POR ID:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao consultar a corrida.",
      },
      { status: 500 }
    );
  }
}