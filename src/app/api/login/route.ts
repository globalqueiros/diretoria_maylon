import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";

interface User extends RowDataPacket {
  id: number;
  full_name: string;
  phone: string;
  profile_image: string | null;
  matricula: string;
  password: string;
  status: string;
  user_type: string;
  recruitment_status: string;
}

// Sessão: 2 horas e 30 minutos
const SESSION_DURATION_SECONDS = 2 * 60 * 60 + 30 * 60;

export async function POST(req: Request) {
  try {
    // Recebe matrícula e senha
    const body = await req.json();

    const matricula = String(body.matricula || "").trim();
    const password = String(body.password || "");

    // Validação
    if (!matricula || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Matrícula e senha são obrigatórias.",
        },
        { status: 400 }
      );
    }

    // JWT
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

    if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
      console.error(
        "JWT_SECRET ou JWT_REFRESH_SECRET não configurado."
      );

      return NextResponse.json(
        {
          success: false,
          error: "Configuração de autenticação inválida.",
        },
        { status: 500 }
      );
    }

    // Busca o usuário pela matrícula
    const [rows] = await db.query<User[]>(
      `
      SELECT
        id,
        matricula,
        full_name,
        phone,
        profile_image,
        password,
        status,
        user_type,
        recruitment_status
      FROM users
      WHERE matricula = ?
      LIMIT 1
      `,
      [matricula]
    );

    // Matrícula não encontrada
    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Matrícula ou senha inválida.",
        },
        { status: 401 }
      );
    }

    const user = rows[0];

    // Verifica se existe senha cadastrada
    if (!user.password) {
      console.error(
        `Usuário ${user.id} não possui senha cadastrada.`
      );

      return NextResponse.json(
        {
          success: false,
          error: "Matrícula ou senha inválida.",
        },
        { status: 401 }
      );
    }

    // Compatibilidade com bcrypt $2y$
    const passwordHash = user.password.replace(
      /^\$2y\$/,
      "$2a$"
    );

    // Verifica a senha
    const validPassword = await bcrypt.compare(
      password,
      passwordHash
    );

    if (!validPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Matrícula ou senha inválida.",
        },
        { status: 401 }
      );
    }

    // Usuário desativado
    if (user.status === "inactive") {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário desativado.",
        },
        { status: 403 }
      );
    }

    // Verifica se está usando a senha padrão
    const forceChangePassword = await bcrypt.compare(
      "112233445566",
      passwordHash
    );

    // ==========================================
    // ACCESS TOKEN - 2 HORAS E 30 MINUTOS
    // ==========================================
    const accessToken = jwt.sign(
      {
        id: user.id,
        role: user.user_type,
      },
      JWT_SECRET,
      {
        expiresIn: SESSION_DURATION_SECONDS,
      }
    );

    // ==========================================
    // REFRESH TOKEN - 2 HORAS E 30 MINUTOS
    // ==========================================
    const refreshToken = jwt.sign(
      {
        id: user.id,
      },
      JWT_REFRESH_SECRET,
      {
        expiresIn: SESSION_DURATION_SECONDS,
      }
    );

    // Cria hash do Refresh Token
    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      10
    );

    // IP do usuário
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers
        .get("x-forwarded-for")
        ?.split(",")[0]
        .trim() ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0";

    // Navegador/dispositivo
    const userAgent =
      req.headers.get("user-agent") || "unknown";

    // Salva sessão
    await db.query(
      `
      INSERT INTO sessions
        (user_id, ip, user_agent, refresh_token)
      VALUES
        (?, ?, ?, ?)
      `,
      [
        user.id,
        ip,
        userAgent,
        refreshTokenHash,
      ]
    );

    // Resposta
    const response = NextResponse.json({
      success: true,

      forceChangePassword,

      user: {
        id: user.id,
        full_name: user.full_name,
        matricula: user.matricula,
        phone: user.phone,
        profile_image: user.profile_image,
        user_type: user.user_type,
        recruitment_status: user.recruitment_status,
        status: user.status,
      },
    });

    // ==========================================
    // COOKIE ACCESS TOKEN - 2H30
    // ==========================================
    response.cookies.set(
      "access_token",
      accessToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: SESSION_DURATION_SECONDS,
      }
    );

    // ==========================================
    // COOKIE REFRESH TOKEN - 2H30
    // ==========================================
    response.cookies.set(
      "refresh_token",
      refreshToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: SESSION_DURATION_SECONDS,
      }
    );

    return response;
  } catch (error: any) {
    console.error("ERRO LOGIN:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Erro interno do servidor.",
      },
      {
        status: 500,
      }
    );
  }
}
