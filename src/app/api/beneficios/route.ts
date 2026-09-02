import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET() {
    try {
        const [rows]: any = await db.query(`
            SELECT 
            b.nome,
            COUNT(a.id) AS total_assinantes
            FROM beneficio_ativo b
            LEFT JOIN beneficio_assinaturas a
            ON a.beneficio_id = b.id
            AND a.status = 'ativo'
            WHERE b.nome = 'Maylon Pass'
            GROUP BY b.id, b.nome;
        `);
        return NextResponse.json({
            total_assinantes: rows[0]?.total_assinantes ?? 0
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            {
                error: "Erro ao contar assinantes"
            },
            {
                status: 500
            }
        );
    }
}