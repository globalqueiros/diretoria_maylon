
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const [rows] = await db.query(
            `SELECT
                id,
                titulo,
                plataformas,
                data_inicio,
                data_fim,
                status
            FROM vagas
            ORDER BY id DESC`
        );

        return NextResponse.json({
            success: true,
            vagas: rows,
        });
    } catch (error) {
        console.error("Erro ao buscar vagas:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Erro ao carregar as vagas.",
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const titulo = String(body.titulo || "").trim();
        const plataformas = String(body.plataformas || "").trim();
        const data_inicio = body.data_inicio || null;
        const data_fim = body.data_fim || null;
        const status = String(body.status || "aberta").toLowerCase();

        if (!titulo) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Informe o título da vaga.",
                },
                { status: 400 }
            );
        }

        if (
            !["aberta", "pausada", "encerrada"].includes(status)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Status da vaga inválido.",
                },
                { status: 400 }
            );
        }

        const [result]: any = await db.query(
            `INSERT INTO vagas (
                titulo,
                plataformas,
                data_inicio,
                data_fim,
                status
            ) VALUES (?, ?, ?, ?, ?)`,
            [
                titulo,
                plataformas || null,
                data_inicio,
                data_fim,
                status,
            ]
        );

        return NextResponse.json(
            {
                success: true,
                message: "Vaga cadastrada com sucesso.",
                vaga: {
                    id: result.insertId,
                    titulo,
                    plataformas,
                    data_inicio,
                    data_fim,
                    status,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Erro ao cadastrar vaga:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Erro ao cadastrar a vaga.",
            },
            { status: 500 }
        );
    }
}
