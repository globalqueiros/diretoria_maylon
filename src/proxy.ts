import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ACESSO: Record<string, string[]> = {
  "/gerente": ["gerente", "diretor"],
  "/comercial": ["comercial", "diretor"],
};

const BASE_POR_PERFIL: Record<string, string> = {
  atendente: "/atendente",
  gerente: "/gerente",
  diretor: "/diretor",
  comercial: "/comercial",
  marketing: "/marketing",
};

function areaDaRota(pathname: string) {
  return Object.keys(ACESSO).find(
    (base) => pathname === base || pathname.startsWith(`${base}/`)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const area = areaDaRota(pathname);

  if (!area) return NextResponse.next();

  const token = request.cookies.get("access_token")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return NextResponse.redirect(
      new URL("/?error=" + encodeURIComponent("Faça login para continuar."), request.url)
    );
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    const perfil = String(payload.role ?? "").trim().toLowerCase();

    if (!perfil) return NextResponse.next();

    const permitidos = ACESSO[area];

    if (!permitidos.includes(perfil)) {
      const destino = BASE_POR_PERFIL[perfil] ?? "/";
      return NextResponse.redirect(new URL(destino, request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(
      new URL("/?error=" + encodeURIComponent("Sessão inválida. Faça login novamente."), request.url)
    );
  }
}

export const config = {
  matcher: ["/gerente/:path*", "/comercial/:path*"],
};
