import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getZoomToken() {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Credenciais Zoom não configuradas.");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.access_token) {
    throw new Error("Falha na autenticação do Zoom.");
  }

  return data.access_token as string;
}

type Meeting = RowDataPacket & {
  id: number;
  zoom_meeting_id: string | null;
  status: string;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { success: false, error: "ID inválido." },
        { status: 400 }
      );
    }

    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM corporate_meetings WHERE id = ? LIMIT 1",
      [id]
    );

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "Reunião não encontrada." },
        { status: 404 }
      );
    }

    // Não exponha start_url: esse link é exclusivo do organizador.
    const { start_url: _privateStartUrl, ...meeting } = rows[0];

    return NextResponse.json({ success: true, meeting });
  } catch (error) {
    console.error("Erro ao consultar reunião:", error);

    return NextResponse.json(
      { success: false, error: "Erro ao consultar a reunião." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { success: false, error: "ID inválido." },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (body.status !== "cancelled") {
      return NextResponse.json(
        {
          success: false,
          error: "Este endpoint permite somente cancelar reuniões.",
        },
        { status: 400 }
      );
    }

    const [rows] = await db.execute<Meeting[]>(
      "SELECT id, zoom_meeting_id, status FROM corporate_meetings WHERE id = ? LIMIT 1",
      [id]
    );

    const meeting = rows[0];

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: "Reunião não encontrada." },
        { status: 404 }
      );
    }

    if (meeting.status === "completed") {
      return NextResponse.json(
        { success: false, error: "Não é possível cancelar uma reunião finalizada." },
        { status: 409 }
      );
    }

    if (meeting.status === "cancelled") {
      return NextResponse.json({
        success: true,
        message: "A reunião já estava cancelada.",
      });
    }

    if (meeting.zoom_meeting_id) {
      const token = await getZoomToken();

      const zoomResponse = await fetch(
        `https://api.zoom.us/v2/meetings/${encodeURIComponent(meeting.zoom_meeting_id)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      if (!zoomResponse.ok && zoomResponse.status !== 404) {
        const details = await zoomResponse.text();

        console.error("Erro ao cancelar no Zoom:", details);

        return NextResponse.json(
          {
            success: false,
            error: "O Zoom não confirmou o cancelamento. A agenda não foi alterada.",
          },
          { status: 502 }
        );
      }
    }

    await db.execute<ResultSetHeader>(
      "UPDATE corporate_meetings SET status = 'cancelled' WHERE id = ?",
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Reunião cancelada.",
    });
  } catch (error) {
    console.error("Erro ao cancelar reunião:", error);

    return NextResponse.json(
      { success: false, error: "Erro ao cancelar a reunião." },
      { status: 500 }
    );
  }
}