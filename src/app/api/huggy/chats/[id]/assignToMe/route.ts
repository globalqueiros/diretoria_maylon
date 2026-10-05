import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../../lib/session";
import { huggyFetch, parseHuggyResponse } from "../../../../../lib/huggy";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PUT(_request: Request, { params }: Params) {
    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const response = await huggyFetch(`/chats/${id}/assignToMe`, {
            method: "PUT",
        });

        if (!response.ok) {
            const text = await response.text();
            return NextResponse.json(
                { error: "Erro ao assumir o atendimento", detail: text },
                { status: response.status }
            );
        }

        return NextResponse.json(await parseHuggyResponse(response));
    } catch (error) {
        console.error("ERRO PUT /api/huggy/chats/[id]/assignToMe:", error);
        return NextResponse.json(
            { error: "Erro interno ao assumir o atendimento" },
            { status: 500 }
        );
    }
}
