import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../../lib/db";
import { exigirPerfilNaApi } from "../../../../lib/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await exigirPerfilNaApi(["gerente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, descricao, tipo, valor, data, categoria
         FROM fin_transacoes
        ORDER BY data DESC, id DESC
        LIMIT 500`
    );

    let entradas = 0;
    let saidas = 0;

    const movimentos = rows.map((row) => {
      const receita = String(row.tipo ?? "").toLowerCase() === "receita";
      const valor = Number(row.valor ?? 0);

      if (receita) entradas += valor;
      else saidas += valor;

      return {
        id: Number(row.id),
        descricao: String(row.descricao ?? "Movimentação"),
        conta: "Caixa",
        categoria: String(row.categoria ?? ""),
        data: row.data ? new Date(row.data).toISOString() : null,
        tipo: receita ? "entrada" : "saida",
        valor,
      };
    });

    const contas = [
      {
        id: "caixa",
        nome: "Caixa",
        banco: "Caixa",
        saldo: entradas - saidas,
      },
    ];

    return NextResponse.json(
      { contas, movimentos },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/gerente/financeiro/contas:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as contas.", contas: [], movimentos: [] },
      { status: 500 }
    );
  }
}
