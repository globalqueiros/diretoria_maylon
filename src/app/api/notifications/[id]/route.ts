import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../../lib/db";

type JWTPayload = {
  id: number;
  iat?: number;
  exp?: number;
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notificationId = Number(id);

    if (
      !Number.isInteger(notificationId) ||
      notificationId <= 0
    ) {
      return NextResponse.json(
        {
          error: "ID da notificação inválido",
        },
        {
          status: 400,
        }
      );
    }

    const cookieStore = await cookies();

    const token =
      cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          error: "Não autorizado",
        },
        {
          status: 401,
        }
      );
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error(
        "JWT_SECRET não configurado"
      );

      return NextResponse.json(
        {
          error:
            "Erro interno de autenticação",
        },
        {
          status: 500,
        }
      );
    }

    let decoded: JWTPayload;

    try {
      decoded = jwt.verify(
        token,
        secret
      ) as JWTPayload;
    } catch {
      const response = NextResponse.json(
        {
          error:
            "Sessão inválida ou expirada",
        },
        {
          status: 401,
        }
      );

      response.cookies.delete(
        "access_token"
      );

      return response;
    }

    if (!decoded.id) {
      return NextResponse.json(
        {
          error: "Token inválido",
        },
        {
          status: 401,
        }
      );
    }

    const [result] = await db.query(
      `
      UPDATE notifications
      SET
        is_read = TRUE,
        read_at = NOW()
      WHERE id = ?
        AND (
          user_id = ?
          OR user_id IS NULL
        )
      `,
      [
        notificationId,
        decoded.id,
      ]
    );

    const affectedRows = Number(
      (result as any).affectedRows
    );

    if (affectedRows === 0) {
      return NextResponse.json(
        {
          error:
            "Notificação não encontrada",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Notificação marcada como lida",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Erro PATCH /api/notifications/[id]:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao marcar notificação",
      },
      {
        status: 500,
      }
    );
  }
}
