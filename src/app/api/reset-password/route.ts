import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";

interface TokenPayload {
    id: number;
    role: string;
    iat: number;
    exp: number;
}

export async function POST(req: NextRequest) {
    try {
        if (!process.env.JWT_SECRET) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Erro interno do servidor.",
                },
                { status: 500 }
            );
        }
        const token = req.cookies.get("access_token")?.value;
        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Sua sessão expirou. Faça login novamente.",
                },
                { status: 401 }
            );
        }
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        ) as TokenPayload;
        const { password } = await req.json();
        if (!password) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Informe a nova senha.",
                },
                { status: 400 }
            );
        }
        if (password.length < 8) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "A senha deve possuir no mínimo 8 caracteres.",
                },
                { status: 400 }
            );
        }
        const hash = await bcrypt.hash(password, 10);
        await db.query(
            "UPDATE users SET password = ? WHERE id = ?",
            [hash, decoded.id]
        );
        return NextResponse.json(
            {
                success: true,
                message: "Senha alterada com sucesso.",
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("RESET PASSWORD:", error);
        if (
            error instanceof jwt.TokenExpiredError ||
            error instanceof jwt.JsonWebTokenError
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Sua sessão expirou. Faça login novamente.",
                },
                { status: 401 }
            );
        }
        return NextResponse.json(
            {
                success: false,
                message: "Erro interno do servidor.",
            },
            { status: 500 }
        );
    }
}