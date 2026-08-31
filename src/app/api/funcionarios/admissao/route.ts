import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const {
            nome,
            email,
            telefone,
            vaga,
            curriculo,
        } = body;

        if (!nome || !email) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Nome e e-mail são obrigatórios.",
                },
                { status: 400 }
            );
        }

        const [resultado] = await db.execute(
            `
            INSERT INTO candidatos
            (
                nome,
                email,
                telefone,
                vaga,
                curriculo,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                nome.trim(),
                email.trim(),
                telefone?.trim() || null,
                vaga?.trim() || null,
                curriculo || null,
                "pendente",
            ]
        );

        return NextResponse.json(
            {
                success: true,
                message:
                    "Candidato cadastrado com sucesso. Aguarde o retorno do nosso processo seletivo.",
                candidato: resultado,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error(
            "❌ ERRO AO CADASTRAR CANDIDATO:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Não foi possível realizar o cadastro do candidato.",
            },
            { status: 500 }
        );
    }
}