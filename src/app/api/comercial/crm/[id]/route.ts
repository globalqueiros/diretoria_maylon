import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../../lib/db";
import { exigirPerfilNaApi } from "../../../../lib/roles";
import { sincronizarComissaoDaVenda } from "../../../../lib/comissoes";

export const dynamic = "force-dynamic";

type Stage = "Novo" | "Contato" | "Qualificação" | "Proposta" | "Negociação" | "Ganho" | "Perdido";

const STATUS_POR_STAGE: Record<Stage, string> = {
  Novo: "pendente",
  Contato: "pendente",
  Qualificação: "pendente",
  Proposta: "registrada",
  Negociação: "pendente",
  Ganho: "paga",
  Perdido: "cancelada",
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPerfilNaApi(["comercial", "gerente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await context.params;
    const vendaId = Number(id);
    const body = await request.json().catch(() => ({}));
    const stage = String(body?.stage ?? "") as Stage;

    if (!Number.isSafeInteger(vendaId) || vendaId <= 0) {
      return NextResponse.json({ error: "Oportunidade inválida." }, { status: 400 });
    }

    if (!Object.prototype.hasOwnProperty.call(STATUS_POR_STAGE, stage)) {
      return NextResponse.json({ error: "Etapa inválida." }, { status: 400 });
    }

    const status = STATUS_POR_STAGE[stage];

    const [result] = await db.execute(
      `UPDATE vendas
          SET crm_stage = ?, status = ?, crm_atualizado_em = NOW()
        WHERE id = ? LIMIT 1`,
      [stage, status, vendaId]
    );

    if ((result as { affectedRows: number }).affectedRows === 0) {
      const [existe] = await db.query<RowDataPacket[]>(
        `SELECT 1 FROM vendas WHERE id = ? LIMIT 1`,
        [vendaId]
      );

      if (!existe.length) {
        return NextResponse.json({ error: "Oportunidade não encontrada." }, { status: 404 });
      }
    }

    await sincronizarComissaoDaVenda(vendaId, status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro PATCH /api/comercial/crm/[id]:", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar a oportunidade." },
      { status: 500 }
    );
  }
}
