import { db } from "../../../lib/db";
import crypto from "crypto";
import { sendMagicLink } from "../../../lib/emailTemplates/magicLink";

export async function POST(req: Request) {
  const { email } = await req.json();

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 15);

  await db.query(
    "INSERT INTO auth_tokens (email, token, type, expires_at) VALUES (?, ?, 'reset', ?)",
    [email, token, expires]
  );

  const link = `${process.env.NEXT_PUBLIC_URL}/auth/reset?token=${token}`;

  await sendMagicLink({ email, link });

  return Response.json({ ok: true });
}