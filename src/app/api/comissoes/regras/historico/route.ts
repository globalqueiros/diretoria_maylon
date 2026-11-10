import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../../lib/db";
import { exigirPerfilNaApi } from "../../../../lib/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await exigirPerfilNaApi(["diretor", "gerente"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT h.id, h.regra_id, r.nome AS regra_nome,
              h.percentual_anterior, h.percentual_novo,
              h.alterado_por, u.full_name AS alterado_por_nome, h.alterado_em
         FROM comissoes_comerciais_regras_historico h
         LEFT JOIN comissoes_comerciais_regras r ON r.id = h.regra_id
         LEFT JOIN users u ON u.id = h.alterado_por
        ORDER BY h.id DESC
        LIMIT 100`
    );

    return NextResponse.json(
      {
        historico: rows.map((row) => ({
          id: Number(row.id),
          regraId: Number(row.regra_id),
          regraNome: row.regra_nome ?? "Regra",
          percentualAnterior: Number(row.percentual_anterior),
          percentualNovo: Number(row.percentual_novo),
          alteradoPor: row.alterado_por_nome ?? null,
          alteradoEm: row.alterado_em
            ? new Date(row.alterado_em).toISOString()
            : null,
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/comissoes/regras/historico:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o histórico." },
      { status: 500 }
    );
  }
}
