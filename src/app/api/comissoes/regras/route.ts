import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../lib/db";
import { exigirPerfilNaApi } from "../../../lib/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await exigirPerfilNaApi(["diretor", "gerente"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT r.id, r.chave, r.nome, r.percentual, r.ativo,
              r.vigencia_inicio, r.vigencia_fim,
              r.atualizado_por, u.full_name AS atualizado_por_nome,
              r.atualizado_em
         FROM comissoes_comerciais_regras r
         LEFT JOIN users u ON u.id = r.atualizado_por
        ORDER BY r.id ASC`
    );

    return NextResponse.json(
      {
        regras: rows.map((row) => ({
          id: Number(row.id),
          chave: String(row.chave),
          nome: String(row.nome),
          percentual: Number(row.percentual),
          ativo: Boolean(row.ativo),
          vigenciaInicio: row.vigencia_inicio
            ? new Date(row.vigencia_inicio).toISOString().slice(0, 10)
            : null,
          vigenciaFim: row.vigencia_fim
            ? new Date(row.vigencia_fim).toISOString().slice(0, 10)
            : null,
          atualizadoPor: row.atualizado_por_nome ?? null,
          atualizadoEm: row.atualizado_em
            ? new Date(row.atualizado_em).toISOString()
            : null,
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/comissoes/regras:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as regras de comissão." },
      { status: 500 }
    );
  }
}
