import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { exigirPerfilNaApi } from "../../../../lib/roles";

export const dynamic = "force-dynamic";

const STATUS_DB: Record<string, string> = {
  aberto: "aberto",
  em_atendimento: "em_andamento",
  resolvido: "resolvido",
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPerfilNaApi(["comercial", "gerente", "atendente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await context.params;
    const chamadoId = Number(id);
    const body = await request.json().catch(() => ({}));
    const statusUi = String(body?.status ?? "");

    if (!Number.isSafeInteger(chamadoId) || chamadoId <= 0) {
      return NextResponse.json({ error: "Chamado inválido." }, { status: 400 });
    }

    const statusDb = STATUS_DB[statusUi];

    if (!statusDb) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }

    const campos = ["status = ?", "atualizado_em = NOW()"];
    const valores: unknown[] = [statusDb];

    if (statusUi === "em_atendimento") {
      campos.push("atendente_id = ?");
      valores.push(auth.usuario.id);
    }

    if (statusUi === "resolvido") {
      campos.push("resolvido_em = NOW()");
    }

    valores.push(chamadoId);

    const [result] = await db.execute(
      `UPDATE chamados SET ${campos.join(", ")} WHERE id = ? LIMIT 1`,
      valores as any[]
    );

    if ((result as { affectedRows: number }).affectedRows === 0) {
      return NextResponse.json({ error: "Chamado não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro PATCH /api/atendente/chamados/[id]:", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar o chamado." },
      { status: 500 }
    );
  }
}
