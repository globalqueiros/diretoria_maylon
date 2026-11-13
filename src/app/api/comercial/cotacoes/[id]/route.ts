import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../../lib/db";
import { exigirPerfilNaApi } from "../../../../lib/roles";

export const dynamic = "force-dynamic";

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
    const cotacaoId = Number(id);
    const body = await request.json().catch(() => ({}));
    const status = String(body?.status ?? "").trim().toLowerCase();
    const observacao = String(body?.observacao ?? "").trim();

    if (!Number.isSafeInteger(cotacaoId) || cotacaoId <= 0) {
      return NextResponse.json({ error: "Cotação inválida." }, { status: 400 });
    }

    if (status !== "aprovada" && status !== "recusada") {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }

    if (status === "recusada" && !observacao) {
      return NextResponse.json(
        { error: "Informe o motivo da recusa." },
        { status: 400 }
      );
    }

    const [result] = await db.execute(
      `UPDATE cotacoes_publicidade
          SET status = ?, observacao_gerente = ?, decidido_por = ?, decidido_em = NOW()
        WHERE id = ? LIMIT 1`,
      [status, observacao || null, auth.usuario!.full_name, cotacaoId]
    );

    if ((result as { affectedRows: number }).affectedRows === 0) {
      const [existe] = await db.query<RowDataPacket[]>(
        `SELECT 1 FROM cotacoes_publicidade WHERE id = ? LIMIT 1`,
        [cotacaoId]
      );

      if (!existe.length) {
        return NextResponse.json({ error: "Cotação não encontrada." }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro PATCH /api/comercial/cotacoes/[id]:", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar a cotação." },
      { status: 500 }
    );
  }
}
