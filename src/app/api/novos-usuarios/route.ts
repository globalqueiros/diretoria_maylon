import { NextResponse } from "next/server";
import { db2 } from "../../lib/db";

export async function GET() {
    try {
        const [rows]: any = await db2.query(`
            SELECT
                id,
                first_name,
                last_name,
                email,
                phone,
                user_type,
                created_at
            FROM users
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY created_at DESC
            LIMIT 10
        `);
        return NextResponse.json(rows);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Erro ao buscar usuários." },
            { status: 500 }
        );
    }
}