import { NextRequest, NextResponse } from "next/server";
import { temAcessoMailbox } from "../../../lib/mailbox-auth";
import { criarTransportadorSmtp } from "../../../lib/mailbox";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await temAcessoMailbox())) {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: 401 },
    );
  }

  const origin = request.headers.get("origin");

  if (
    origin &&
    origin !== new URL(request.url).origin
  ) {
    return NextResponse.json(
      { error: "Origem inválida." },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();

    const para =
      typeof body.para === "string" ? body.para.trim() : "";

    const assunto =
      typeof body.assunto === "string"
        ? body.assunto.trim()
        : "";

    const texto =
      typeof body.texto === "string" ? body.texto : "";

    if (
      para.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(para) ||
      !assunto ||
      assunto.length > 200 ||
      !texto.trim() ||
      texto.length > 20000
    ) {
      return NextResponse.json(
        { error: "Verifique destinatário, assunto e mensagem." },
        { status: 400 },
      );
    }

    const transporter = criarTransportadorSmtp();

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: para,
      subject: assunto,
      text: texto,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(
      "Falha no envio de e-mail:",
      error instanceof Error ? error.message : "Erro desconhecido",
    );

    return NextResponse.json(
      { error: "Não foi possível enviar o e-mail." },
      { status: 502 },
    );
  }
}