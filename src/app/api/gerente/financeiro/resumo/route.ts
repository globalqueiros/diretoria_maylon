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
    const [comissoes] = await db2.query<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END), 0) pagas,
         COALESCE(SUM(CASE WHEN status <> 'pago' THEN valor ELSE 0 END), 0) pendentes,
         COUNT(CASE WHEN status <> 'pago' THEN 1 END) pendentes_qtd,
         COUNT(*) total
       FROM comissoes
       WHERE gerente_id = ? AND perfil = 'motorista'`,
      [auth.usuario.id]
    );

    const [corridas] = await db2.query<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(CASE WHEN LOWER(t.payment_status) = 'paid'
                           THEN CASE WHEN t.actual_fare > 0 THEN t.actual_fare ELSE t.estimated_fare END
                           ELSE 0 END), 0) recebido,
         COALESCE(SUM(CASE WHEN LOWER(t.payment_status) <> 'paid'
                           THEN CASE WHEN t.actual_fare > 0 THEN t.actual_fare ELSE t.estimated_fare END
                           ELSE 0 END), 0) a_receber,
         COUNT(*) total
       FROM trip_requests t
       WHERE t.deleted_at IS NULL
         AND t.driver_id IN (
           SELECT id FROM users WHERE user_type = 'driver' AND gerente = ?
         )`,
      [auth.usuario.id]
    );

    const [reembolsos] = await db2.query<RowDataPacket[]>(
      `SELECT COUNT(*) total
       FROM chamados_reembolso ch
       WHERE ch.status IN ('aberto', 'em_analise')`
    );

    const receitas = numero(corridas[0]?.recebido);
    const despesas =
      numero(comissoes[0]?.pagas) + numero(reembolsos[0]?.total ? 0 : 0);
    const pendencias =
      numero(reembolsos[0]?.total) + numero(comissoes[0]?.pendentes_qtd);

    return NextResponse.json(
      {
        saldo: receitas - despesas,
        mes: { receitas, despesas },
        pendencias,
        proximos: [],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/gerente/financeiro/resumo:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o resumo financeiro da equipe." },
      { status: 500 }
    );
  }
}
