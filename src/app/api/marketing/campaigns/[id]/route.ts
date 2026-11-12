import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const [rows]: any = await db.query(
        `SELECT * FROM marketing_campaigns WHERE id=?`,
        [id]
    );
    if (!rows.length) {
        return NextResponse.json(
            { error: "Campanha não encontrada." },
            { status: 404 }
        );
    }
    return NextResponse.json(rows[0]);
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
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
    await db.query(
        `
        UPDATE marketing_campaigns
        SET
            titulo=?,
            descricao=?,
            responsavel=?,
            canal=?,
            orcamento=?,
            data_inicio=?,
            data_fim=?
        WHERE id=?
    `,
        [
            titulo,
            descricao,
            responsavel,
            canal,
            orcamento,
            data_inicio,
            data_fim,
            id,
        ]
    );
    return NextResponse.json({
        success: true,
    });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await db.query(
        `DELETE FROM marketing_campaigns WHERE id=?`,
        [id]
    );
    return NextResponse.json({
        success: true,
    });
}