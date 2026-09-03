import { NextResponse } from "next/server";
import { db2 } from "../../../lib/db";

export async function GET() {
    try {
        const [rows] = await db2.query(`
    SELECT
        tr.id,
        c_origem.latitude AS origin_lat,
        c_origem.longitude AS origin_lng,
        c_destino.latitude AS destination_lat,
        c_destino.longitude AS destination_lng
    FROM smartmobility_db.trip_requests tr

    LEFT JOIN smartmobility_db.trip_request_coordinates c_origem
        ON c_origem.trip_request_id = tr.id
        AND c_origem.coordinate_type = 'origem'

    LEFT JOIN smartmobility_db.trip_request_coordinates c_destino
        ON c_destino.trip_request_id = tr.id
        AND c_destino.coordinate_type = 'destino'

    WHERE c_origem.latitude IS NOT NULL
      AND c_origem.longitude IS NOT NULL
      AND c_destino.latitude IS NOT NULL
      AND c_destino.longitude IS NOT NULL

    ORDER BY tr.created_at DESC
`);

        console.log("VIAGENS ENCONTRADAS:", rows);

        return NextResponse.json({
            success: true,
            trips: rows,
        });

    } catch (error) {
        console.error("ERRO MYSQL MAPA:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Erro ao buscar viagens",
            },
            { status: 500 }
        );
    }
}