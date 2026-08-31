import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

const PUBLIC_ROUTES = [
    "/",
    "/api/login",
    "/api/auth/send-link",
    "/api/reset-password",
    "/trocar-senha",
    "/reset-password",
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
    "/diretor": ["diretor"],
    "/atendente": ["atendente"],
    "/rh": ["rh"],
    "/financeiro": ["financeiro"],
    "/marketing": ["marketing"],
    "/comercial": ["comercial"],
    "/juridico": ["juridico"],
};

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/images") ||
        pathname.startsWith("/icons") ||
        pathname.startsWith("/fonts") ||
        pathname === "/favicon.ico" ||
        /\.(png|jpg|jpeg|svg|gif|webp|css|js|ico)$/.test(pathname)
    ) {
        return NextResponse.next();
    }
    if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
        return NextResponse.next();
    }
    const token = request.cookies.get("access_token")?.value;
    if (!token) {
        if (pathname.startsWith("/api")) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            );
        }
        return NextResponse.redirect(new URL("/", request.url));
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET) as {
            id: number;
            role: string;
            exp?: number;
        };
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            const response = NextResponse.redirect(new URL("/", request.url));
            response.cookies.delete("access_token");
            return response;
        }
        for (const [prefix, roles] of Object.entries(ROLE_PERMISSIONS)) {
            if (pathname.startsWith(prefix)) {
                if (!roles.includes(payload.role)) {
                    return NextResponse.redirect(
                        new URL("/403", request.url)
                    );
                }
            }
        }
        return NextResponse.next();
    } catch {
        const response = pathname.startsWith("/api")
            ? NextResponse.json(
                { error: "Token inválido" },
                { status: 401 }
            )
            : NextResponse.redirect(new URL("/", request.url));
        response.cookies.delete("access_token");
        return response;
    }
}

export const config = {
    matcher: [
        "/api/:path*",
        "/atendente/:path*",
        "/diretor/:path*",
        "/rh/:path*",
        "/financeiro/:path*",
        "/marketing/:path*",
        "/comercial/:path*",
        "/juridico/:path*",
    ],
};