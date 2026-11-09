
import { NextRequest, NextResponse } from "next/server";
import { criarSessao } from "../../../lib/mailbox-auth";
import { criarClienteImap } from "../../../lib/mailbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let cliente: ReturnType<typeof criarClienteImap> | null = null;

  try {
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

    const body = await request.json();

    const usuario =
      typeof body.usuario === "string"
        ? body.usuario.trim()
        : "";

    const senha =
      typeof body.senha === "string"
        ? body.senha
        : "";

    if (
      !usuario ||
      usuario.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario) ||
      !senha ||
      senha.length > 1024
    ) {
      return NextResponse.json(
        { error: "Informe o e-mail e a senha da caixa." },
        { status: 400 },
      );
    }

    cliente = criarClienteImap();

    // Validar acesso real à caixa de e-mail via IMAP.
    cliente.options.auth = {
      user: usuario,
      pass: senha,
    };

    await cliente.connect();

    // Se conectou, as credenciais foram aceitas.
    await cliente.logout();
    cliente = null;

    // Cria a sessão independente do sistema MAYLON.
    await criarSessao();

    return NextResponse.json({ ok: true });
  } catch {
    if (cliente?.usable) {
      await cliente.logout().catch(() => {});
    }

    return NextResponse.json(
      {
        error:
          "Não foi possível acessar a caixa. Confira o e-mail e a senha.",
      },
      { status: 401 },
    );
  }
}
