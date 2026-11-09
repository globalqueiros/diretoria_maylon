import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { db } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UserRow = RowDataPacket & {
  id: string;
  password: string;
};

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Sessão expirada. Faça login novamente." }, { status: 401 });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET não configurado.");
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const userId = String(payload.sub ?? payload.userId ?? payload.id ?? "");

    if (!userId) {
      return NextResponse.json({ message: "Usuário não identificado." }, { status: 401 });
    }

    const body = await request.json();
    const { current_password, new_password, confirm_password } = body;

    if (
      !current_password ||
      !new_password ||
      !confirm_password
    ) {
      return NextResponse.json({ message: "Preencha todos os campos." }, { status: 400 });
    }

    if (
      typeof current_password !== "string" ||
      typeof new_password !== "string" ||
      typeof confirm_password !== "string"
    ) {
      return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
    }

    if (new_password.length < 8 || new_password.length > 72) {
      return NextResponse.json({ message: "A senha deve ter entre 8 e 72 caracteres." }, { status: 400 });
    }

    if (new_password !== confirm_password) {
      return NextResponse.json({ message: "As senhas não coincidem." }, { status: 400 });
    }

    if (current_password === new_password) {
      return NextResponse.json({ message: "A nova senha deve ser diferente da atual." }, { status: 400 });
    }

    const [rows] = await db.execute<UserRow[]>(
      `SELECT id, password FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!rows.length) {
      return NextResponse.json({ message: "Usuário não encontrado." }, { status: 404 });
    }

    const user = rows[0];
    const passwordValid = await bcrypt.compare(current_password, user.password);

    if (!passwordValid) {
      return NextResponse.json({ message: "A senha atual está incorreta." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(new_password, 12);

    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE users SET password = ? WHERE id = ?`,
      [passwordHash, userId]
    );

    if (result.affectedRows !== 1) {
      return NextResponse.json({ message: "Não foi possível atualizar a senha." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso!",
    });
  } catch (error) {
    if (
      error instanceof Error &&
      ["JWTExpired", "JWTClaimValidationFailed", "JWSSignatureVerificationFailed"].includes(error.name)
    ) {
      return NextResponse.json({ message: "Sessão inválida ou expirada." }, { status: 401 });
    }

    console.error("ERRO AO ALTERAR SENHA:", error);

    return NextResponse.json({ message: "Erro interno ao alterar a senha." }, { status: 500 });
  }
}