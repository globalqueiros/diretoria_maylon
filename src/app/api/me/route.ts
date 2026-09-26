import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("access_token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            );
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            console.error("JWT_SECRET não configurado");

            return NextResponse.json(
                { error: "Erro interno de autenticação" },
                { status: 500 }
            );
        }

        let decoded: {
            id: number;
            iat?: number;
            exp?: number;
        };

        try {
            decoded = jwt.verify(token, secret) as typeof decoded;
        } catch (error) {
            console.error("JWT inválido ou expirado:", error);

            const response = NextResponse.json(
                { error: "Token inválido ou sessão expirada" },
                { status: 401 }
            );

            response.cookies.delete("access_token");

            return response;
        }

        if (!decoded.id) {
            const response = NextResponse.json(
                { error: "Token inválido" },
                { status: 401 }
            );

            response.cookies.delete("access_token");

            return response;
        }

        const [rows]: any = await db.query(
            `SELECT
                id,
                full_name,
                phone,
                email,
                user_type,
                profile_image
             FROM users
             WHERE id = ?`,
            [decoded.id]
        );

        if (!rows || rows.length === 0) {
            return NextResponse.json(
                { error: "Usuário não encontrado" },
                { status: 404 }
            );
        }

        const user = rows[0];

        return NextResponse.json({
            id: user.id,
            full_name: user.full_name,
            phone: user.phone,
            email: user.email,
            profile_image: user.profile_image,
            user_type: user.user_type,
        });
    } catch (error) {
        console.error("Erro /api/me:", error);

        return NextResponse.json(
            { error: "Erro interno ao consultar usuário" },
            { status: 500 }
        );
    }
}
