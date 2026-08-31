import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET() {
    try {
        const [rows] = await db.query(`
            SELECT
                id,
                titulo,
                descricao,
                responsavel,
                canal,
                orcamento,
                data_inicio,
                data_fim,
                status,
                observacao_diretor,
                criado_em
            FROM marketing_campaigns
            ORDER BY criado_em DESC
        `);
        return NextResponse.json(rows);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Erro ao buscar campanhas." },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            titulo,
            descricao,
            responsavel,
            canal,
            orcamento,
            data_inicio,
            data_fim,
        } = body;
        const [result]: any = await db.query(
            `
            INSERT INTO marketing_campaigns
            (
                titulo,
                descricao,
                responsavel,
                canal,
                orcamento,
                data_inicio,
                data_fim
            )
            VALUES (?,?,?,?,?,?,?)
        `,
            [
                titulo,
                descricao,
                responsavel,
                canal,
                orcamento,
                data_inicio,
                data_fim,
            ]
        );
        return NextResponse.json({
            success: true,
            id: result.insertId,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Erro ao cadastrar campanha." },
            { status: 500 }
        );
    }
}