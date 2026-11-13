import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import {
  sessaoDaRequisicao,
  type SessaoValida,
} from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const sessao = await sessaoDaRequisicao(request).catch(() => null);

  if (sessao?.ok) {
    const { sessionUuid } = sessao as SessaoValida;

    try {
      await db.execute(
        `UPDATE user_sessions
            SET status = 'revoked', ended_at = NOW(), end_reason = 'logout'
          WHERE session_uuid = ? AND status <> 'revoked'`,
        [sessionUuid]
      );
    } catch (error) {
      console.error("Erro ao encerrar sessão no logout:", error);
    }
  }

  const response = NextResponse.json({ success: true });
  const comum = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 0,
  };

  response.cookies.set("access_token", "", comum);
  response.cookies.set("refresh_token", "", comum);

  return response;
}
