import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET() {
    try {
        const [rows] = await db.query(`
            SELECT
                matricula,
                full_name,
                email,
                phone,
                profile_image,
                user_type,
                status
            FROM users
            ORDER BY matricula DESC
        `);

        const usuarios = (rows as any[]).map((usuario) => ({
            matricula: usuario.matricula,
            full_name: usuario.full_name || "",
            email: usuario.email || "",
            phone: usuario.phone || null,
            profile_image:
                usuario.profile_image &&
                usuario.profile_image !== "/favicon.ico"
                    ? usuario.profile_image
                    : null,
            user_type: usuario.user_type,
            status: usuario.status || null,
        }));

        return NextResponse.json(usuarios, {
            status: 200,
        });
    } catch (error) {
        console.error("❌ ERRO /api/users:", error);

        return NextResponse.json(
            {
                message: "Erro ao buscar usuários.",
                error:
                    error instanceof Error
                        ? error.message
                        : "Erro desconhecido",
            },
            {
                status: 500,
            }
        );
    }
}