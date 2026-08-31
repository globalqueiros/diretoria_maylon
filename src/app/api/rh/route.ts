import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET() {
    try {
        const [rows]: any = await db.query(`
            SELECT
                rc.id,
                rc.vaga,
                rc.etapa,
                u.first_name,
                u.last_name,
                u.status,
                u.created_at
            FROM rh_candidatos rc
            INNER JOIN users u
                ON u.id = rc.user_id
            ORDER BY rc.created_at DESC
            LIMIT 10
        `);
        return NextResponse.json(rows);
    } catch (error) {
        console.error(error);
        return NextResponse.json([], { status: 500 });
    }
}