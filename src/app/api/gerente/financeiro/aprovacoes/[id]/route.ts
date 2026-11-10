import { NextRequest, NextResponse } from "next/server";
import { db2 } from "../../../../../lib/db";
import { exigirPerfilNaApi } from "../../../../../lib/roles";

export const dynamic = "force-dynamic";

const STATUS_POR_ACAO: Record<string, string> = {
  aprovar: "aprovado",
  rejeitar: "recusado",
  encaminhar: "em_analise",
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPerfilNaApi(["gerente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await context.params;
    const reembolsoId = Number(id);
    const body = await request.json().catch(() => ({}));
    const acao = String(body?.acao ?? "");
    const status = STATUS_POR_ACAO[acao];

    if (!Number.isSafeInteger(reembolsoId) || reembolsoId <= 0) {
      return NextResponse.json({ error: "Solicitação inválida." }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }

    const [result] = await db2.execute(
      `UPDATE chamados_reembolso
          SET status = ?, updated_at = NOW()
        WHERE id = ? LIMIT 1`,
      [status, reembolsoId]
    );

    if ((result as { affectedRows: number }).affectedRows === 0) {
      return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro PATCH /api/gerente/financeiro/aprovacoes/[id]:", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar a solicitação." },
      { status: 500 }
    );
  }
}
