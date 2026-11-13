import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../lib/db";
import { getUsuarioSessao } from "../../../lib/roles";

export const dynamic = "force-dynamic";

type Preferencias = {
  notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
};

const PADRAO: Preferencias = {
  notifications: true,
  email_notifications: true,
  sms_notifications: false,
};

function booleano(valor: unknown): boolean | null {
  if (typeof valor === "boolean") return valor;
  if (valor === 0 || valor === "0" || valor === "false") return false;
  if (valor === 1 || valor === "1" || valor === "true") return true;
  return null;
}

export async function GET() {
  const usuario = await getUsuarioSessao();

  if (!usuario) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT notifications, email_notifications, sms_notifications
         FROM user_preferences
        WHERE user_id = ?
        LIMIT 1`,
      [usuario.id]
    );

    const row = rows[0];

    return NextResponse.json(
      row
        ? {
            notifications: Boolean(row.notifications),
            email_notifications: Boolean(row.email_notifications),
            sms_notifications: Boolean(row.sms_notifications),
          }
        : PADRAO,
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/me/preferences:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as preferências." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const usuario = await getUsuarioSessao();

  if (!usuario) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));

    const notifications = booleano(body?.notifications);
    const emailNotifications = booleano(body?.email_notifications);
    const smsNotifications = booleano(body?.sms_notifications);

    if (
      notifications === null ||
      emailNotifications === null ||
      smsNotifications === null
    ) {
      return NextResponse.json(
        { error: "Preferências inválidas." },
        { status: 400 }
      );
    }

    await db.execute(
      `INSERT INTO user_preferences
         (user_id, notifications, email_notifications, sms_notifications)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         notifications = VALUES(notifications),
         email_notifications = VALUES(email_notifications),
         sms_notifications = VALUES(sms_notifications)`,
      [usuario.id, notifications ? 1 : 0, emailNotifications ? 1 : 0, smsNotifications ? 1 : 0]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro PATCH /api/me/preferences:", error);
    return NextResponse.json(
      { error: "Não foi possível salvar as preferências." },
      { status: 500 }
    );
  }
}
