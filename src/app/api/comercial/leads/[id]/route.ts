import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { exigirPerfilNaApi } from "../../../../lib/roles";

export const dynamic = "force-dynamic";

const STATUS_PERMITIDOS = [
  "Novo",
  "Em contato",
  "Qualificado",
  "Proposta",
  "Convertido",
  "Perdido",
];

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
    const leadId = Number(id);
    const body = await request.json().catch(() => ({}));
    const status = String(body?.status ?? "");

    if (!Number.isSafeInteger(leadId) || leadId <= 0) {
      return NextResponse.json({ error: "Lead inválido." }, { status: 400 });
    }

    if (!STATUS_PERMITIDOS.includes(status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }

    const [result] = await db.execute(
      `UPDATE clientes SET status = ? WHERE id = ? LIMIT 1`,
      [status === "Perdido" ? 1 : 0, leadId]
    );

    if ((result as { affectedRows: number }).affectedRows === 0) {
      return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro PATCH /api/comercial/leads/[id]:", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar o lead." },
      { status: 500 }
    );
  }
}
