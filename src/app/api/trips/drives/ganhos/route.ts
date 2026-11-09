import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../../lib/db";

type JwtPayload = {
  id?: string | number;
  userId?: string | number;
  user_id?: string | number;
  sub?: string | number;
};

type GanhosRow = RowDataPacket & {
  total_ganhos: number | string | null;
};

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get("token")?.value ??
      cookieStore.get("auth_token")?.value ??
      cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET não configurado.");

      return NextResponse.json(
        { error: "Erro de configuração do servidor." },
        { status: 500 }
      );
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, secret) as JwtPayload;
    } catch (error) {
      console.error("Erro ao validar JWT:", error);

      return NextResponse.json(
        { error: "Sessão expirada ou inválida." },
        { status: 401 }
      );
    }

    const driverId =
      decoded.id ??
      decoded.userId ??
      decoded.user_id ??
      decoded.sub;

    if (!driverId) {
      return NextResponse.json(
        { error: "Motorista não identificado." },
        { status: 401 }
      );
    }

    const [rows] = await db.query<GanhosRow[]>(
      `
      SELECT
        COALESCE(SUM(valor), 0) AS total_ganhos
      FROM trip_requests
      WHERE driver_id = ?
        AND current_status IN ('completed', 'finished')
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `,
      [driverId]
    );

    const result = Array.isArray(rows) ? rows[0] : null;

    const totalGanhos = Number(
      result?.total_ganhos ?? 0
    );

    return NextResponse.json({
      totalGanhos: Number.isFinite(totalGanhos)
        ? totalGanhos
        : 0,
    });
  } catch (error: any) {
    console.error("ERRO API /api/trips/drives/ganhos");
    console.error("Mensagem:", error?.message);
    console.error("Código:", error?.code);
    console.error("SQL:", error?.sql);

    return NextResponse.json(
      {
        error: "Erro interno ao buscar ganhos semanais.",
        message: error?.message,
        code: error?.code,
        sql: error?.sql,
      },
      { status: 500 }
    );
  }
}