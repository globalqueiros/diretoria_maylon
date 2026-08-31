import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {

    const cookieStore = cookies();

    const token = (await cookieStore).get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      id: number;
    };

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

    if (!rows.length) {
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

    console.error(error);

    return NextResponse.json(
      { error: "Token inválido" },
      { status: 401 }
    );
  }
}