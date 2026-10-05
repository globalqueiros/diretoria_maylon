import { NextResponse } from "next/server";
import { db2 } from "../../lib/db";

export async function GET() {
    try {
        const [rows]: any = await db2.query(
            `
            SELECT COUNT(id) AS total
            FROM trip_requests
            WHERE DATE(created_at) AND DATE(updated_at) = CURDATE()
            `
        );
        return NextResponse.json({
            total: Number(rows[0].total) || 0,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { total: 0 },
            { status: 500 }
        );
    }
}