
import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const clienteId = Number(id);

        if (!Number.isInteger(clienteId) || clienteId <= 0) {
            return NextResponse.json(
                { erro: "ID inválido" },
                { status: 400 }
            );
        }

        const [rows]: any = await db.execute(
            `SELECT
                id,
                numero,
                nome,
                cpf,
                telefone,
                email,
                cidade,
                status,
                criado_em
             FROM clientes
             WHERE id = ?
             LIMIT 1`,
            [clienteId]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { erro: "Cliente não encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json(rows[0]);

    } catch (error) {
        console.error("Erro ao buscar cliente:", error);

        return NextResponse.json(
            { erro: "Erro ao buscar cliente." },
            { status: 500 }
        );
    }
}
