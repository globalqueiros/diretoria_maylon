import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../../lib/db";
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
    const [colunas] = await db.query<RowDataPacket[]>(
      `SHOW COLUMNS FROM users`
    );
    const nomes = new Set(colunas.map((c) => String(c.Field)));

    if (!nomes.has("gerente_id")) {
      return NextResponse.json(
        {
          funcionarios: [],
          aviso:
            "A coluna gerente_id ainda não existe em users. Rode a migração para vincular colaboradores ao gerente.",
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT f.id, f.user_id, u.full_name AS nome, u.agencia, u.conta,
              f.competencia, f.salario_base, f.comissoes, f.bonificacoes,
              f.descontos, f.total_liquido, f.status
         FROM folhas_pagamento f
         JOIN users u ON u.id = f.user_id
        WHERE u.gerente_id = ?
        ORDER BY f.competencia DESC, f.id DESC
        LIMIT 500`,
      [auth.usuario.id]
    );

    return NextResponse.json(
      {
        funcionarios: rows.map((row) => ({
          id: row.id,
          nome: row.nome ?? "Colaborador",
          agencia: row.agencia ?? "",
          conta: row.conta ?? "",
          competencia: row.competencia,
          salario_base: numero(row.salario_base),
          comissao: numero(row.comissoes),
          beneficios: numero(row.bonificacoes),
          descontos: numero(row.descontos),
          adiantamentos: 0,
          liquido: numero(row.total_liquido),
          status: row.status,
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/gerente/financeiro/folha:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar a folha da equipe.", funcionarios: [] },
      { status: 500 }
    );
  }
}
