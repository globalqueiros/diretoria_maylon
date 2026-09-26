import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ matricula: string }> }
) {
    try {
        const { matricula } = await params;

        if (!matricula) {
            return NextResponse.json(
                {
                    message: "Matrícula não informada.",
                },
                {
                    status: 400,
                }
            );
        }

        const [rows] = await db.query(
            `
            SELECT *
            FROM users
            WHERE matricula = ?
            LIMIT 1
            `,
            [matricula]
        );

        const usuarios = rows as any[];

        if (usuarios.length === 0) {
            return NextResponse.json(
                {
                    message: "Funcionário não encontrado.",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json(usuarios[0]);
    } catch (error) {
        console.error("Erro ao buscar funcionário por matrícula:", error);

        return NextResponse.json(
            {
                message: "Erro interno ao buscar funcionário.",
            },
            {
                status: 500,
            }
        );
    }
}