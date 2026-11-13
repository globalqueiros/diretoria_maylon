import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../../../../lib/db";
import {
  comNovaTentativa,
  sessaoDaRequisicao,
  type SessaoInvalida,
  type SessaoValida,
} from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ session_uuid: string }> }
) {
  const sessao = await sessaoDaRequisicao(request);

  if (!sessao.ok) {
    if ((sessao as SessaoInvalida).indisponivel) {
      return NextResponse.json(
        { error: "Serviço temporariamente indisponível. Tente novamente." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Sessão inválida. Entre novamente." },
      { status: 401 }
    );
  }

  const { userId } = sessao as SessaoValida;
  const { session_uuid: sessionUuid } = await context.params;

  if (!sessionUuid) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 400 });
  }

  try {
    const [result] = await comNovaTentativa(() =>
      db.execute<ResultSetHeader>(
        `UPDATE user_sessions
            SET status = 'revoked', ended_at = NOW(), end_reason = 'user_revoked'
          WHERE session_uuid = ? AND user_id = ? AND status <> 'revoked'`,
        [sessionUuid, userId]
      )
    );

    if (result.affectedRows === 0) {
      const [existe] = await comNovaTentativa(() =>
        db.execute<RowDataPacket[]>(
          `SELECT 1 FROM user_sessions WHERE session_uuid = ? AND user_id = ? LIMIT 1`,
          [sessionUuid, userId]
        )
      );

      if (!existe.length) {
        return NextResponse.json(
          { error: "Sessão não encontrada." },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: true, message: "Sessão encerrada com sucesso." },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro DELETE /api/atendente/sessoes/[session_uuid]:", error);
    return NextResponse.json(
      { error: "Não foi possível encerrar a sessão." },
      { status: 500 }
    );
  }
}
