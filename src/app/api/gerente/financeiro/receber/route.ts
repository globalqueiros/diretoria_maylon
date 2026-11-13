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
    const [vendas] = await db.query<RowDataPacket[]>(
      `SELECT v.id, v.total, v.produto_chave, v.status, v.criado_em,
              c.nome AS cliente
         FROM vendas v
         LEFT JOIN clientes c ON c.id = v.cliente_id
        WHERE v.status IN ('pendente', 'registrada')
        ORDER BY v.id DESC`
    );

    const [boletos] = await db.query<RowDataPacket[]>(
      `SELECT id, nosso_numero, vencimento, valor, status
         FROM boletos
        WHERE status IS NULL OR status NOT IN ('pago', 'paga', 'quitado')
        ORDER BY vencimento ASC`
    );

    const contas = [
      ...vendas.map((row) => ({
        id: `venda-${row.id}`,
        fornecedor: String(row.cliente ?? "Cliente"),
        descricao: `Venda #${row.id}`,
        categoria: String(row.produto_chave ?? "Venda"),
        vencimento: null as string | null,
        status: "pendente",
        valor: Number(row.total ?? 0),
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
    console.error("Erro GET /api/gerente/financeiro/receber:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as contas a receber.", contas: [] },
      { status: 500 }
    );
  }
}
