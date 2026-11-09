
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const runtime = "nodejs";

function normalizarTelefone(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const digits = value.replace(/\D/g, "");

  if (digits.length < 10 || digits.length > 15) {
    return null;
  }

  return digits;
}

async function usuarioAutenticado(): Promise<boolean> {
  const secret = process.env.JWT_SECRET;

  if (!secret) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return false;

  try {
    const secretKey = new TextEncoder().encode(secret);
    await jwtVerify(token, secretKey);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await usuarioAutenticado())) {
      return NextResponse.json(
        { success: false, error: "Sessão inválida ou expirada." },
        { status: 401 }
      );
    }

    const origin = request.headers.get("origin");

    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { success: false, error: "Origem da solicitação inválida." },
        { status: 403 }
      );
    }

    const apiUrl = process.env.NVOIP_CALLS_URL;
    const apiToken = process.env.NVOIP_API_TOKEN;
    const caller = normalizarTelefone(process.env.NVOIP_CALLER);

    if (!apiUrl || !apiToken || !caller) {
      return NextResponse.json(
        {
          success: false,
          error: "A integração Nvoip não está configurada no servidor.",
        },
        { status: 500 }
      );
    }

    const parsedUrl = new URL(apiUrl);

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname !== "api.nvoip.com.br"
    ) {
      return NextResponse.json(
        { success: false, error: "URL da API Nvoip inválida." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);
    const destination = normalizarTelefone(body?.destination);

    if (!destination) {
      return NextResponse.json(
        {
          success: false,
          error: "Informe um telefone válido com DDD.",
        },
        { status: 400 }
      );
    }

    if (destination === caller) {
      return NextResponse.json(
        {
          success: false,
          error: "O telefone de destino não pode ser igual ao de origem.",
        },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let providerResponse: Response;

    try {
      providerResponse = await fetch(parsedUrl.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          caller,
          called: destination,
        }),
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!providerResponse.ok) {
      console.error("Nvoip recusou a solicitação:", {
        status: providerResponse.status,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            "A Nvoip não aceitou a solicitação. Verifique a configuração da API.",
        },
        { status: 502 }
      );
    }

    const providerData = await providerResponse
      .json()
      .catch(() => null);

    return NextResponse.json(
      {
        success: true,
        status: "solicitada",
        message: "Solicitação de ligação enviada à Nvoip.",
        provider: providerData,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro na integração Nvoip:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível processar a solicitação de ligação.",
      },
      { status: 500 }
    );
  }
}
