import { NextResponse } from "next/server";
import { temAcessoMailbox } from "../../../lib/mailbox-auth";
import { listarEmails } from "../../../lib/mailbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await temAcessoMailbox())) {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 401 },
    );
  }

  try {
    const messages = await listarEmails();

    return NextResponse.json(
      { messages },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Falha ao consultar caixa de e-mail:",
      error instanceof Error ? error.message : "Erro desconhecido",
    );

    return NextResponse.json(
      { error: "Não foi possível consultar a caixa de entrada." },
      { status: 502 },
    );
  }
}