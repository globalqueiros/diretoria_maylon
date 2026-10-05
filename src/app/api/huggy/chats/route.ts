import { NextResponse } from "next/server";
import { getSessionUser } from "../../../lib/session";
import { huggyFetch } from "../../../lib/huggy";

export const dynamic = "force-dynamic";

const MAX_PAGES = 20;

export async function GET(request: Request) {
    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const agent = searchParams.get("agent");
        const status = searchParams.get("status");
        const situation = searchParams.get("situation");
        const pageStr = searchParams.get("page");

        const allChats: unknown[] = [];

        if (pageStr !== null) {
            const params = new URLSearchParams();
            if (agent) params.set("agent", agent);
            if (status) params.set("status", status);
            if (situation) params.set("situation", situation);
            params.set("page", pageStr);

            const response = await huggyFetch(`/chats?${params.toString()}`);
            if (!response.ok) {
                const text = await response.text();
                return NextResponse.json(
                    { error: "Erro ao buscar chats Huggy", detail: text },
                    { status: response.status }
                );
            }
            const data = await response.json();
            return NextResponse.json(Array.isArray(data) ? data : []);
        }

        for (let page = 0; page < MAX_PAGES; page++) {
            const params = new URLSearchParams();
            if (agent) params.set("agent", agent);
            if (status) params.set("status", status);
            if (situation) params.set("situation", situation);
            params.set("page", String(page));

            const response = await huggyFetch(`/chats?${params.toString()}`);

            if (!response.ok) {
                if (page === 0) {
                    const text = await response.text();
                    return NextResponse.json(
                        { error: "Erro ao buscar chats Huggy", detail: text },
                        { status: response.status }
                    );
                }
                break;
            }

            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) break;

            allChats.push(...data);

            if (data.length < 20) break;
        }

        return NextResponse.json(allChats);
    } catch (error) {
        console.error("ERRO GET /api/huggy/chats:", error);
        return NextResponse.json(
            { error: "Erro interno ao buscar chats" },
            { status: 500 }
        );
    }
}
