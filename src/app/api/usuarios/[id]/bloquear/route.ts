import { NextRequest, NextResponse } from "next/server";
import { db2 } from "../../../../lib/db";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

type Usuario = {
  id: string;
  is_active: number;
  is_temp_blocked: number;
  blocked_at: Date | string | null;
};

type Body = {
  bloqueado?: boolean;
  enviarEmail?: boolean;
  enviarWhatsApp?: boolean;
};

export async function POST(
  request: NextRequest,
  { params }: Context
) {
  try {
    const { id } = await params;
    const usuarioId = String(id || "").trim();

    if (!usuarioId) {
      return NextResponse.json(
        {
          sucesso: false,
          error: "ID do usuário não informado.",
        },
        { status: 400 }
      );
    }

    let body: Body = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const [rows] = await db2.execute(
      `
        SELECT
          id,
          is_active,
          is_temp_blocked,
          blocked_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [usuarioId]
    );

    const usuarios = rows as Usuario[];

    if (usuarios.length === 0) {
      return NextResponse.json(
        {
          sucesso: false,
          error: "Usuário não encontrado.",
          usuarioId,
        },
        { status: 404 }
      );
    }

    const usuario = usuarios[0];

    const isActive = Number(usuario.is_active) === 1;
    const isTempBlocked =
      Number(usuario.is_temp_blocked) === 1;

    const possuiBlockedAt =
      usuario.blocked_at !== null &&
      usuario.blocked_at !== "";

    const estaBloqueado =
      !isActive ||
      isTempBlocked ||
      possuiBlockedAt;

    let novoBloqueio: boolean;

    if (typeof body.bloqueado === "boolean") {
      novoBloqueio = body.bloqueado;
    } else {
      novoBloqueio = !estaBloqueado;
    }

    if (novoBloqueio === true) {
      await db2.execute(
        `
          UPDATE users
          SET
            is_active = 0,
            is_temp_blocked = 1,
            blocked_at = NOW(),
            updated_at = NOW()
          WHERE id = ?
          LIMIT 1
        `,
        [usuarioId]
      );

      const [rowsAtualizados] = await db2.execute(
        `
          SELECT
            id,
            is_active,
            is_temp_blocked,
            blocked_at
          FROM users
          WHERE id = ?
          LIMIT 1
        `,
        [usuarioId]
      );

      const usuariosAtualizados =
        rowsAtualizados as Usuario[];

      if (usuariosAtualizados.length === 0) {
        return NextResponse.json(
          {
            sucesso: false,
            error:
              "Usuário não encontrado após o bloqueio.",
            usuarioId,
          },
          { status: 500 }
        );
      }

      const usuarioAtualizado =
        usuariosAtualizados[0];

      const bloqueadoReal =
        Number(usuarioAtualizado.is_active) === 0 &&
        Number(usuarioAtualizado.is_temp_blocked) === 1 &&
        usuarioAtualizado.blocked_at !== null;

      if (!bloqueadoReal) {
        return NextResponse.json(
          {
            sucesso: false,
            error:
              "O usuário não foi bloqueado corretamente no banco.",
            usuarioId,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        sucesso: true,
        acao: "bloqueado",
        bloqueado: true,
        message: "Usuário bloqueado com sucesso.",
        usuario: {
          id: usuarioAtualizado.id,
          is_active: Number(
            usuarioAtualizado.is_active
          ),
          is_temp_blocked: Number(
            usuarioAtualizado.is_temp_blocked
          ),
          blocked_at:
            usuarioAtualizado.blocked_at,
        },
        notificacoes: {
          email: body.enviarEmail ?? true,
          whatsapp: body.enviarWhatsApp ?? true,
        },
      });
    }

    await db2.execute(
      `
        UPDATE users
        SET
          is_active = 1,
          is_temp_blocked = 0,
          blocked_at = NULL,
          updated_at = NOW()
        WHERE id = ?
        LIMIT 1
      `,
      [usuarioId]
    );

    const [rowsAtualizados] = await db2.execute(
      `
        SELECT
          id,
          is_active,
          is_temp_blocked,
          blocked_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [usuarioId]
    );

    const usuariosAtualizados =
      rowsAtualizados as Usuario[];

    if (usuariosAtualizados.length === 0) {
      return NextResponse.json(
        {
          sucesso: false,
          error:
            "Usuário não encontrado após o desbloqueio.",
          usuarioId,
        },
        { status: 500 }
      );
    }

    const usuarioAtualizado =
      usuariosAtualizados[0];

    const desbloqueadoReal =
      Number(usuarioAtualizado.is_active) === 1 &&
      Number(usuarioAtualizado.is_temp_blocked) === 0 &&
      usuarioAtualizado.blocked_at === null;

    if (!desbloqueadoReal) {
      return NextResponse.json(
        {
          sucesso: false,
          error:
            "O usuário não foi desbloqueado corretamente no banco.",
          usuarioId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      acao: "desbloqueado",
      bloqueado: false,
      message: "Usuário desbloqueado com sucesso.",
      usuario: {
        id: usuarioAtualizado.id,
        is_active: Number(
          usuarioAtualizado.is_active
        ),
        is_temp_blocked: Number(
          usuarioAtualizado.is_temp_blocked
        ),
        blocked_at:
          usuarioAtualizado.blocked_at,
      },
      notificacoes: {
        email: false,
        whatsapp: false,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        sucesso: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao alterar o bloqueio do usuário.",
      },
      { status: 500 }
    );
  }
}