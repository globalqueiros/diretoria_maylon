import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../../lib/session";
import { huggyFetch, parseHuggyResponse } from "../../../../../lib/huggy";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const department = Number(body?.department);

        if (!body?.department || Number.isNaN(department)) {
            return NextResponse.json(
                { error: "department não informado ou inválido" },
                { status: 400 }
            );
        }

        const response = await huggyFetch(`/chats/${id}/department`, {
            method: "PUT",
            body: JSON.stringify({ department }),
        });

        if (!response.ok) {
            const text = await response.text();
            return NextResponse.json(
                { error: "Erro ao transferir para o departamento", detail: text },
                { status: response.status }
            );
        }

        return NextResponse.json(await parseHuggyResponse(response));
    } catch (error) {
        console.error("ERRO PUT /api/huggy/chats/[id]/department:", error);
        return NextResponse.json(
            { error: "Erro interno ao transferir para o departamento" },
            { status: 500 }
        );
    }
}