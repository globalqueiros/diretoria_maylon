import { db } from "../../lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const { token, password } = await req.json();

  const [rows]: any = await db.query(
    "SELECT * FROM auth_tokens WHERE token=? AND type='reset' AND used=FALSE",
    [token]
  );

  const record = rows[0];

  if (!record) return new Response("Invalid", { status: 400 });

  const hash = await bcrypt.hash(password, 10);

  await db.query("UPDATE users SET password=? WHERE email=?", [
    hash,
    record.email,
  ]);

  await db.query("UPDATE auth_tokens SET used=TRUE WHERE id=?", [record.id]);

  return Response.json({ ok: true });
}