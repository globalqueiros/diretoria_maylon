import { NextResponse } from "next/server";
import { db2 } from "../../../lib/db";

export async function GET() {
  try {
    const [rows] = await db2.query(`
      SELECT
        tr.id AS id,
        tr.created_at AS created_at,
        trc.pickup_coordinates,
        trc.destination_coordinates
      FROM smartmobility_db.trip_requests AS tr
      INNER JOIN smartmobility_db.trip_request_coordinates AS trc
        ON trc.trip_request_id = tr.id
      ORDER BY tr.created_at DESC
    `);

    console.log("DADOS ORIGINAIS DO BANCO:", rows);

    return NextResponse.json({
      success: true,
      trips: rows,
    });
  } catch (error: any) {
    console.error("ERRO MYSQL MAPA:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.sqlMessage ||
          error?.message ||
          "Erro ao buscar viagens",
      },
      { status: 500 }
    );
  }
}