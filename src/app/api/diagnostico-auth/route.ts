
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();

  const token = cookieStore.get("access_token")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token) {
    return NextResponse.json({
      etapa: "COOKIE",
      sucesso: false,
      mensagem: "Cookie access_token não encontrado.",
    });
  }

  if (!secret) {
    return NextResponse.json({
      etapa: "CONFIGURAÇÃO",
      sucesso: false,
      mensagem: "JWT_SECRET não configurado.",
    });
  }

  try {
    const decoded = jwt.verify(token, secret) as {
      id: number;
    };

    return NextResponse.json({
      etapa: "JWT",
      sucesso: true,
      usuario_id: decoded.id,
      mensagem: "Token validado corretamente.",
    });

  } catch {
    return NextResponse.json({
      etapa: "JWT",
      sucesso: false,
      mensagem: "Token inválido ou expirado.",
    });
  }
}
