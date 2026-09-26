import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET() {
    let connection;

    try {
        connection = await db.getConnection();

        const [rows] = await connection.query(
            "SELECT * FROM candidatos ORDER BY id DESC"
        );

        return NextResponse.json({
            candidatos: rows,
        });
    } catch (error) {
        console.error("❌ Erro ao buscar candidatos:", error);

        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Erro ao buscar candidatos.",
                candidatos: [],
            },
            {
                status: 500,
            }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}