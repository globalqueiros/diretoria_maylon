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
      { error: "Não autorizado", pagamentos: [] },
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
        WHERE t.deleted_at IS NULL
        ORDER BY t.created_at DESC, t.id DESC
        LIMIT ?
      `,
      values: [limite],
      timeout: 15000,
    });

    // Pago: mostra o que foi realmente pago (paid_fare); senão, o valor da corrida
    const pagamentos = (rows as Record<string, unknown>[]).map((r) => {
      const pago = Number(r.paid_fare ?? 0);
      const valor = r.status === "aprovado" && pago > 0 ? pago : Number(r.valor ?? 0);
      return { ...r, valor };
    });

    return NextResponse.json({
      pagamentos,
      total: pagamentos.length,
    });
  } catch (error: unknown) {
    console.error("ERRO MYSQL - PAGAMENTOS:", error);
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