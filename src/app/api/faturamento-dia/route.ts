import { NextResponse } from "next/server";
import { db2 } from "../../lib/db";

export async function GET() {
    try {
        const [rows]: any = await db2.query(
            `
            SELECT
                COALESCE(SUM(paid_fare), 0) AS total
            FROM trip_requests
            WHERE DATE(created_at) AND DATE(updated_at) = CURDATE()
            `
        );
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Erro ao buscar faturamento do dia." },
            { status: 500 }
        );
    }
}