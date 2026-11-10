import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { exigirPerfilNaApi } from "../../../lib/roles";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPerfilNaApi(["gerente", "diretor", "atendente"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await context.params;
    const userId = Number(id);
    const body = await request.json().catch(() => ({}));

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "Usuário inválido." }, { status: 400 });
    }

    const campos: string[] = [];
    const valores: unknown[] = [];

    if (typeof body?.full_name === "string") {
      const nome = body.full_name.trim();
      if (nome.length < 3) {
        return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
      }
      campos.push("full_name = ?");
      valores.push(nome);
    }

    if (typeof body?.email === "string") {
      const email = body.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
      }
      campos.push("email = ?");
      valores.push(email);
    }

    if (typeof body?.phone === "string") {
      const telefone = body.phone.replace(/\D/g, "");
      if (telefone && (telefone.length < 10 || telefone.length > 13)) {
        return NextResponse.json({ error: "Telefone inválido." }, { status: 400 });
      }
      campos.push("phone = ?");
      valores.push(telefone);
    }

    if (!campos.length) {
      return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
    }

    valores.push(userId);

    const [result] = await db.execute(
      `UPDATE users SET ${campos.join(", ")} WHERE id = ? LIMIT 1`,
      valores as any[]
    );

    if ((result as { affectedRows: number }).affectedRows === 0) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro PATCH /api/maylon-pass/[id]:", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar o contato." },
      { status: 500 }
    );
  }
}
