import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../../lib/db";

type JwtPayload = {
  id?: string | number;
  userId?: string | number;
  user_id?: string | number;
  sub?: string | number;
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

    const rawDriverId =
      decoded.id ??
      decoded.userId ??
      decoded.user_id ??
      decoded.sub;

    if (!rawDriverId) {
      console.error(
        "JWT sem identificador do motorista:",
        decoded
      );

      return NextResponse.json(
        { error: "Motorista não identificado." },
        { status: 401 }
      );
    }

    // Normaliza o tipo: o JWT pode trazer o id como string,
    // mas a coluna driver_id no banco pode ser INT.
    // CAST no SQL evita que a comparação falhe por tipo diferente.
    const driverId = String(rawDriverId).trim();

    console.log("Motorista autenticado (raw):", rawDriverId);
    console.log("Motorista autenticado (normalizado):", driverId);

    const [rows] = await db.query(
      `
      SELECT
        tr.id AS trip_request_id,
        tr.driver_id,
        tr.current_status,
        tr.paid_fare AS fare,
        c.pickup_address,
        c.destination_address
      FROM trip_requests AS tr
      LEFT JOIN trip_request_coordinates AS c
        ON c.trip_request_id = tr.id
      WHERE CAST(tr.driver_id AS CHAR) = ?
      ORDER BY tr.id DESC
      `,
      [driverId]
    );

    console.log(
      "Quantidade de linhas retornadas pelo banco:",
      Array.isArray(rows) ? rows.length : "não é array"
    );

    return NextResponse.json({
      success: true,
      driver_id: driverId,
      trips: rows,
    });
  } catch (error: any) {
    console.error("ERRO API /api/trips/drives");
    console.error("Mensagem:", error?.message);
    console.error("Código:", error?.code);
    console.error("SQL:", error?.sql);

    return NextResponse.json(
      {
        error: "Erro interno ao buscar corridas.",
        message:
          process.env.NODE_ENV === "development"
            ? error?.message
            : undefined,
        code:
          process.env.NODE_ENV === "development"
            ? error?.code
            : undefined,
      },
      { status: 500 }
    );
  }
}