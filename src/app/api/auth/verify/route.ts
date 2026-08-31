import { db } from "../../../lib/db";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/?error=invalid", url.origin)
      );
    }

    const [rows]: any = await db.query(
      `SELECT * FROM auth_tokens 
       WHERE token = ? 
       AND type='magic'`,
      [token]
    );

    const record = rows[0];

    if (!record) {
      return NextResponse.redirect(
        new URL("/?error=invalid", url.origin)
      );
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.redirect(
        new URL("/?error=expired", url.origin)
      );
    }

    const [users]: any = await db.query(
      "SELECT id, email, user_type FROM users WHERE email = ?",
      [record.email]
    );

    const user = users[0];

    if (!user) {
      return NextResponse.redirect(
        new URL("/?error=notfound", url.origin)
      );
    }

    await db.query(
      "UPDATE auth_tokens SET used = TRUE WHERE id = ?",
      [record.id]
    );

    const jwtToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const response = NextResponse.redirect(
      new URL("/auth/success", req.url)
    );

    response.cookies.set("access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    response.cookies.set("access_token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (error) {
    console.error("VERIFY ERROR:", error);

    const url = new URL(req.url);

    return NextResponse.redirect(
      new URL("/?error=server", url.origin)
    );
  }
}