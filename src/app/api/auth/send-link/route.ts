import { db } from "../../../lib/db";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { getClientIP } from "../../../lib/getClientIP";
import { getDevice } from "../../../lib/getDevice";
import { getLocation } from "../../../lib/getLocation";
import { sendMailWithRetry } from "../../../lib/sendMail";
import { magicLinkTemplate } from "../../../lib/emailTemplates/magicLink";
import { resetTemplate } from "../../../lib/emailTemplates/reset";

export async function POST(req: Request) {
  const ip = getClientIP(req);
  const device = getDevice(req);
  const location = await getLocation(ip);

  try {
    const { email, type } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email obrigatório" },
        { status: 400 }
      );
    }

    const [users]: any = await db.query(
      "SELECT id, email, full_name FROM users WHERE email = ?",
      [email]
    );

    if (!users.length) {
      return NextResponse.json({ success: true });
    }

    const user = users[0];

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 15);

    const tokenType = type === "reset" ? "reset" : "magic";

    await db.query(
      "INSERT INTO auth_tokens (email, token, type, expires_at) VALUES (?, ?, ?, ?)",
      [email, token, tokenType, expires]
    );

    // 🔗 LINK DINÂMICO
    let link = "";

    if (tokenType === "magic") {
      link = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`;
    } else {
      link = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    }

    console.log("🔗 LINK:", link);

    const html =
      tokenType === "magic"
        ? magicLinkTemplate(link)
        : resetTemplate(link, user.full_name, {
          ip,
          device,
          location,
        });

    await sendMailWithRetry({
      from: process.env.EMAIL_FROM,
      to: email,
      subject:
        tokenType === "magic"
          ? "Seu acesso ao Portal Connect"
          : "Recuperação de senha - Maylon",
      html,
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("ERRO EMAIL:", err);

    return NextResponse.json(
      { error: "Erro ao enviar email" },
      { status: 500 }
    );
  }
}