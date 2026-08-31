import { db } from "../../../lib/db";
import crypto from "crypto";
import { sendMagicLink } from "../../../lib/emailTemplates/magicLink";

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return Response.json({ error: "Email obrigatório" }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 15);

    await db.query(
      "INSERT INTO auth_tokens (email, token, type, expires_at) VALUES (?, ?, 'login', ?)",
      [email, token, expires]
    );

    const link = `${process.env.NEXT_PUBLIC_URL}/auth/reset?token=${token}`;

    await sendMagicLink({
      email,
      name,
      link,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}