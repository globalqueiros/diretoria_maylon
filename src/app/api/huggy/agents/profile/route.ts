import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/session";
import { huggyFetch } from "../../../../lib/huggy";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getSessionUser();
        if (!session) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            );
        }

        let response = await huggyFetch("/agents/profile");

        if (!response.ok && (response.status === 404 || response.status === 400)) {
            response = await huggyFetch("/agents/profile", {}, { company: false });
        }

        if (!response.ok) {
            const text = await response.text();
            return NextResponse.json(
                { error: "Erro ao buscar perfil do agente Huggy", detail: text },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("ERRO GET /api/huggy/agents/profile:", error);
        return NextResponse.json(
            { error: "Erro interno ao buscar perfil do agente" },
            { status: 500 }
        );
    }
}
