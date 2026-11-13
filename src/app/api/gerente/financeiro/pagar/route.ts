import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../../lib/db";
import { exigirPerfilNaApi } from "../../../../lib/roles";

export const dynamic = "force-dynamic";

type ContaPagar = {
  id: string;
  fornecedor: string;
  descricao: string;
  categoria: string;
  vencimento: string | null;
  status: string;
  valor: number;
};

export async function GET() {
  const auth = await exigirPerfilNaApi(["gerente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [folhas] = await db.query<RowDataPacket[]>(
      `SELECT f.id, f.competencia, f.total_liquido, f.status, f.data_pagamento,
              u.full_name AS colaborador
         FROM folhas_pagamento f
         LEFT JOIN users u ON u.id = f.user_id
        WHERE f.status IS NULL OR f.status <> 'pago'
        ORDER BY f.competencia DESC, f.id DESC`
    );

    const [boletos] = await db.query<RowDataPacket[]>(
      `SELECT id, nosso_numero, vencimento, valor, status
         FROM boletos
        WHERE status IS NULL OR status NOT IN ('pago', 'paga', 'quitado')
        ORDER BY vencimento ASC`
    );

    const contas: ContaPagar[] = [
      ...folhas.map((row) => ({
        id: `folha-${row.id}`,
        fornecedor: String(row.colaborador ?? "Colaborador"),
        descricao: `Folha de pagamento ${row.competencia ?? ""}`.trim(),
        categoria: "Folha",
        vencimento: row.data_pagamento
          ? new Date(row.data_pagamento).toISOString()
          : null,
        status: "pendente",
        valor: Number(row.total_liquido ?? 0),
      })),
      ...boletos.map((row) => ({
        id: `boleto-${row.id}`,
        fornecedor: "Assinatura / boleto",
        descricao: `Boleto ${row.nosso_numero ?? row.id}`,
        categoria: "Assinatura",
        vencimento: row.vencimento ? new Date(row.vencimento).toISOString() : null,
        status: "pendente",
        valor: Number(row.valor ?? 0),
      })),
    ];

    return NextResponse.json(
      { contas },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/gerente/financeiro/pagar:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as contas a pagar.", contas: [] },
      { status: 500 }
    );
  }
}
