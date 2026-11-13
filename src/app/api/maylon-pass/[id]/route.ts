import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../lib/db";
import { exigirPerfilNaApi } from "../../../lib/roles";

export const dynamic = "force-dynamic";

const PERGUNTAS = ["nome", "email", "telefone", "id"] as const;
type PerguntaId = (typeof PERGUNTAS)[number];

function normalizar(valor: unknown): string {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function somenteDigitos(valor: unknown): string {
  return String(valor ?? "").replace(/\D/g, "");
}

function esperadoDaPergunta(
  pergunta: PerguntaId,
  usuario: RowDataPacket
): string | null {
  if (pergunta === "telefone") {
    const digitos = somenteDigitos(usuario.phone);
    return digitos.length >= 4 ? digitos.slice(-4) : null;
  }
  if (pergunta === "nome") {
    const nome = normalizar(usuario.full_name);
    return nome || null;
  }
  if (pergunta === "email") {
    const email = normalizar(usuario.email);
    return email || null;
  }
  return normalizar(usuario.id) || null;
}

function confirmacaoConfere(
  pergunta: PerguntaId,
  esperado: string,
  confirmacao: string
): boolean {
  if (pergunta === "telefone") {
    const digitos = somenteDigitos(confirmacao);
    return digitos.length === 4 && digitos === esperado;
  }
  return normalizar(confirmacao).replace(/^#/, "") === esperado;
}

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

    const pergunta = String(body?.pergunta ?? "").trim().toLowerCase();
    const confirmacao = String(body?.confirmacao ?? "").trim();

    if (!PERGUNTAS.includes(pergunta as PerguntaId)) {
      return NextResponse.json(
        { error: "Pergunta de segurança inválida." },
        { status: 400 }
      );
    }

    if (!confirmacao) {
      return NextResponse.json(
        { error: "Responda à pergunta de segurança para confirmar." },
        { status: 400 }
      );
    }

    const [usuarios] = await db.query<RowDataPacket[]>(
      `SELECT id, full_name, email, phone FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!usuarios.length) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const esperado = esperadoDaPergunta(pergunta as PerguntaId, usuarios[0]);

    if (!esperado) {
      return NextResponse.json(
        { error: "Pergunta de segurança indisponível para este usuário." },
        { status: 400 }
      );
    }

    if (!confirmacaoConfere(pergunta as PerguntaId, esperado, confirmacao)) {
      return NextResponse.json(
        { error: "Confirmação de segurança inválida." },
        { status: 400 }
      );
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
      valores as (string | number | null)[]
    );

    if ((result as { affectedRows: number }).affectedRows === 0) {
      const [existe] = await db.query<RowDataPacket[]>(
        `SELECT 1 FROM users WHERE id = ? LIMIT 1`,
        [userId]
      );

      if (!existe.length) {
        return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
      }
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
