import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../lib/db";

export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, topic, agenda, start_time, duration, timezone,
              join_url, password, status
         FROM zoom_meetings
        WHERE DATE_ADD(start_time, INTERVAL IFNULL(duration, 60) MINUTE) >= NOW()
        ORDER BY start_time ASC
        LIMIT 5`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar reuniões." },
      { status: 500 }
    );
  }
}