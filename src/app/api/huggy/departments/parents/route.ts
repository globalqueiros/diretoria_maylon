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

        const response = await huggyFetch("/departments/parents");

        if (!response.ok) {
            const text = await response.text();
            return NextResponse.json(
                { error: "Erro ao buscar departamentos", detail: text },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error("ERRO GET /api/huggy/departments/parents:", error);
        return NextResponse.json(
            { error: "Erro interno ao buscar departamentos" },
            { status: 500 }
        );
    }
}