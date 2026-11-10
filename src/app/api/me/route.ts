import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import { db } from "../../lib/db";

export const dynamic = "force-dynamic";

interface TokenPayload {
  id: number;
  role?: string;
  iat?: number;
  exp?: number;
}

function naoAutenticado(error: string) {
  const response = NextResponse.json({ error }, { status: 401 });
  response.cookies.delete("access_token");
  return response;
}

export async function GET() {
  try {
    const token = (await cookies()).get("access_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET não configurado");
      return NextResponse.json({ error: "Erro interno de autenticação" }, { status: 500 });
    }

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, secret) as TokenPayload;
    } catch (error) {
      console.error("JWT inválido ou expirado:", error);
      return naoAutenticado("Token inválido ou sessão expirada");
    }

    if (!decoded.id) return naoAutenticado("Token inválido");

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, matricula, full_name, phone, cpf, email, user_type, profile_image, created_at
         FROM users
        WHERE id = ?
        LIMIT 1`,
      [decoded.id]
    );

    if (!rows.length) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const user = rows[0];

    return NextResponse.json({
      id: user.id,
      matricula: user.matricula,
      full_name: user.full_name,
      phone: user.phone,
      cpf: user.cpf,
      email: user.email,
      profile_image: user.profile_image,
      user_type: user.user_type,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error("Erro /api/me:", error);
    return NextResponse.json({ error: "Erro interno ao consultar usuário" }, { status: 500 });
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const token = (await cookies()).get("access_token")?.value;
    const secret = process.env.JWT_SECRET;

    if (!token || !secret) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    let decoded: TokenPayload;

    try {
      decoded = jwt.verify(token, secret) as TokenPayload;
    } catch {
      return NextResponse.json({ error: "Token inválido ou sessão expirada" }, { status: 401 });
    }

    if (!decoded?.id) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const fullName =
      typeof body?.full_name === "string" ? body.full_name.trim() : undefined;
    const phone =
      typeof body?.phone === "string" ? body.phone.replace(/\D/g, "") : undefined;

    if (fullName !== undefined && fullName.length < 3) {
      return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
    }

    if (phone !== undefined && phone && (phone.length < 10 || phone.length > 13)) {
      return NextResponse.json({ error: "Telefone inválido." }, { status: 400 });
    }

    const campos: string[] = [];
    const valores: unknown[] = [];

    if (fullName !== undefined) {
      campos.push("full_name = ?");
      valores.push(fullName);
    }

    if (phone !== undefined) {
      campos.push("phone = ?");
      valores.push(phone);
    }

    if (!campos.length) {
      return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
    }

    valores.push(decoded.id);

    await db.execute(
      `UPDATE users SET ${campos.join(", ")} WHERE id = ? LIMIT 1`,
      valores as any[]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro PATCH /api/me:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar usuário" }, { status: 500 });
  }
}
