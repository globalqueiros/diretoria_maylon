import { db } from "../../../lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return Response.json(
        {
          ok: false,
          message: "Token e senha são obrigatórios.",
        },
        { status: 400 }
      );
    }

    const [rows]: any = await db.query(
      "SELECT * FROM auth_tokens WHERE token = ? AND type = 'reset' AND used = FALSE",
      [token]
    );

    const record = rows[0];

    if (!record) {
      return Response.json(
        {
          ok: false,
          message: "Token inválido ou já utilizado.",
        },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    await db.query(
      "UPDATE users SET password = ? WHERE email = ?",
      [hash, record.email]
    );

    await db.query(
      "UPDATE auth_tokens SET used = TRUE WHERE id = ?",
      [record.id]
    );

    return Response.json({
      ok: true,
      message: "Senha alterada com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);

    return Response.json(
      {
        ok: false,
        message: "Erro interno ao redefinir a senha.",
      },
      { status: 500 }
    );
  }
}
