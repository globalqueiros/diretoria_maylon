import { db } from "../../../lib/db";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    const [rows]: any = await db.query(
      "SELECT * FROM auth_tokens WHERE token = ? AND type = 'reset' AND expires_at > NOW()",
      [token]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 400 }
      );
    }

    const tokenData = rows[0];

    const [userRows]: any = await db.query(
      "SELECT password FROM users WHERE email = ?",
      [tokenData.email]
    );

    if (!userRows.length) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const currentHash = userRows[0].password;

    const samePassword = await bcrypt.compare(password, currentHash);

    if (samePassword) {
      return NextResponse.json(
        { error: "Você não pode usar a mesma senha anterior" },
        { status: 400 }
      );
    }
    
    const newHash = await bcrypt.hash(password, 10);

    await db.query(
      "UPDATE users SET password = ? WHERE email = ?",
      [newHash, tokenData.email]
    );

    await db.query(
      "DELETE FROM auth_tokens WHERE token = ?",
      [token]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro ao redefinir senha" },
      { status: 500 }
    );
  }
}