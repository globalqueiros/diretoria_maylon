import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";

type JWTPayload = {
  id: number;
  iat?: number;
  exp?: number;
};

export const dynamic = "force-dynamic";

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return null;
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET não configurado");
  }

  try {
    const decoded = jwt.verify(
      token,
      secret
    ) as JWTPayload;

    if (!decoded.id) {
      return null;
    }

    return decoded.id;
  } catch (error) {
    console.error("JWT inválido:", error);
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const [notifications] =
      await db.query(
        `
        SELECT
          id,
          user_id,
          title,
          message,
          type,
          link,
          is_read,
          created_at,
          read_at
        FROM notifications
        WHERE user_id = ?
           OR user_id IS NULL
        ORDER BY created_at DESC
        LIMIT 50
        `,
        [userId]
      );

    const [countResult] =
      await db.query(
        `
        SELECT
          COUNT(*) AS unread
        FROM notifications
        WHERE (
          user_id = ?
          OR user_id IS NULL
        )
        AND is_read = FALSE
        `,
        [userId]
      );

    const unread =
      Number(
        (countResult as any[])[0]?.unread
      ) || 0;

    return NextResponse.json({
      notifications,
      unread,
    });
  } catch (error) {
    console.error(
      "GET /api/notifications:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao buscar notificações",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH() {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const [result]: any =
      await db.query(
        `
        UPDATE notifications
        SET
          is_read = TRUE,
          read_at = NOW()
        WHERE (
          user_id = ?
          OR user_id IS NULL
        )
        AND is_read = FALSE
        `,
        [userId]
      );

    return NextResponse.json({
      success: true,
      affectedRows:
        result.affectedRows || 0,
    });
  } catch (error) {
    console.error(
      "PATCH /api/notifications:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao marcar notificações como lidas",
      },
      {
        status: 500,
      }
    );
  }
}
