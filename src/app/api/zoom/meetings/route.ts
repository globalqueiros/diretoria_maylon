
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";

export const runtime = "nodejs";

async function getZoomToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID?.trim();
  const clientId = process.env.ZOOM_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOOM_CLIENT_SECRET?.trim();

  if (!accountId || !clientId || !clientSecret) {
    throw new Error(
      "Configure ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID e ZOOM_CLIENT_SECRET."
    );
  }

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`,
    "utf8"
  ).toString("base64");

  const response = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "account_credentials",
      account_id: accountId,
    }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.access_token) {
    console.error("Zoom OAuth:", {
      httpStatus: response.status,
      error: data.error,
      reason: data.reason,
      message: data.message,
    });

    throw new Error(
      `Falha no OAuth Zoom: HTTP ${response.status} - ${
        data.reason || data.error || data.message || "Erro desconhecido"
      }`
    );
  }

  return data.access_token as string;
}

export async function POST(request: NextRequest) {
  try {
    // Adicione aqui a autenticação da Maylon e a autorização
    // do perfil antes de permitir criar reuniões.

    const body = await request.json();

    const topic =
      typeof body.topic === "string" ? body.topic.trim() : "";

    const startTime =
      typeof body.start_time === "string" ? body.start_time : "";

    const duration = Number(body.duration ?? 30);

    const agenda =
      typeof body.agenda === "string" ? body.agenda.trim() : "";

    if (
      !topic ||
      topic.length > 255 ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startTime) ||
      !Number.isInteger(duration) ||
      duration < 1 ||
      duration > 1440
    ) {
      return NextResponse.json(
        { error: "Informe título, data, horário e duração válidos." },
        { status: 400 }
      );
    }

    // Interpreta datetime-local no fuso de São Paulo.
    const date = new Date(`${startTime}:00-03:00`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 16) === "" ||
      date.getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { error: "A reunião deve ter uma data futura válida." },
        { status: 400 }
      );
    }

    const host = process.env.ZOOM_HOST_USER?.trim();

    if (!host) {
      throw new Error("ZOOM_HOST_USER não configurado.");
    }

    const token = await getZoomToken();

    const zoomResponse = await fetch(
      `https://api.zoom.us/v2/users/${encodeURIComponent(host)}/meetings`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          type: 2,
          start_time: date.toISOString(),
          duration,
          timezone: "America/Sao_Paulo",
          agenda,
          settings: {
            waiting_room: true,
            join_before_host: false,
          },
        }),
        cache: "no-store",
      }
    );

    const meeting = await zoomResponse.json().catch(() => ({}));

    if (!zoomResponse.ok) {
      console.error("Erro ao criar reunião no Zoom:", {
        status: zoomResponse.status,
        code: meeting.code,
        message: meeting.message,
      });

      return NextResponse.json(
        {
          error: "O Zoom não conseguiu criar a reunião.",
          details: meeting.message ?? null,
        },
        { status: 502 }
      );
    }

    // O instante recebido do Zoom é UTC.
    // Converte para horário local de São Paulo antes de salvar
    // em uma coluna MySQL DATETIME.
    const localStart = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).format(new Date(meeting.start_time));

    await db.execute(
      `INSERT INTO zoom_meetings
       (zoom_meeting_id, uuid, topic, agenda,
        start_time, duration, timezone, join_url,
        start_url, password, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(meeting.id),
        meeting.uuid ?? null,
        meeting.topic,
        meeting.agenda ?? agenda,
        localStart,
        meeting.duration,
        "America/Sao_Paulo",
        meeting.join_url,
        meeting.start_url ?? null,
        meeting.password ?? null,
        "scheduled",
      ]
    );

    return NextResponse.json(
      {
        success: true,
        meeting: {
          id: meeting.id,
          topic: meeting.topic,
          start_time: meeting.start_time,
          duration: meeting.duration,
          join_url: meeting.join_url,
          password: meeting.password ?? null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar reunião:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao criar reunião.",
      },
      { status: 500 }
    );
  }
}