import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../../lib/session";
import { huggyFetch, parseHuggyResponse } from "../../../../../lib/huggy";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const response = await huggyFetch(`/chats/${id}/messages`);

        if (!response.ok) {
            const text = await response.text();
            return NextResponse.json(
                { error: "Erro ao buscar mensagens", detail: text },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error("ERRO GET /api/huggy/chats/[id]/messages:", error);
        return NextResponse.json(
            { error: "Erro interno ao buscar mensagens" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request, { params }: Params) {
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
        const text = typeof body?.text === "string" ? body.text.trim() : "";

        if (!text) {
            return NextResponse.json(
                { error: "Mensagem vazia" },
                { status: 400 }
            );
        }

        const payload: Record<string, unknown> = { text };
        if (typeof body?.isInternal === "boolean") {
            payload.isInternal = body.isInternal;
        }

        const response = await huggyFetch(`/chats/${id}/messages`, {
            method: "POST",
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const textResponse = await response.text();
            return NextResponse.json(
                { error: "Erro ao enviar mensagem", detail: textResponse },
                { status: response.status }
            );
        }

        return NextResponse.json(await parseHuggyResponse(response));
    } catch (error) {
        console.error("ERRO POST /api/huggy/chats/[id]/messages:", error);
        return NextResponse.json(
            { error: "Erro interno ao enviar mensagem" },
            { status: 500 }
        );
    }
}
