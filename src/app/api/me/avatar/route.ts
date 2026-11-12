import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TokenPayload {
  id: number;
  role?: string;
  iat?: number;
  exp?: number;
}

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "avatars");
const URL_BASE = "/api/me/avatar/";
const MAX_BYTES = 5 * 520 * 520;

function erro(message: string, status: number) {
  return NextResponse.json({ error: message, message }, { status });
}

function detectarExtensao(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (
    buf
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "png";
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  )
    return "webp";
  return null;
}

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get("access_token")?.value;
    if (!token) return erro("Não autenticado", 401);

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET não configurado");
      return erro("Erro interno de autenticação", 500);
    }

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, secret) as TokenPayload;
    } catch {
      return erro("Token inválido ou sessão expirada", 401);
    }

    if (!decoded.id) return erro("Token inválido", 401);
    const userId = decoded.id;

    const form = await req.formData();
    const file = form.get("avatar");

    if (!(file instanceof File)) {
      return erro("Envie uma imagem no campo 'avatar'.", 400);
    }

    if (file.size > MAX_BYTES) {
      return erro("A imagem deve ter no máximo 5 MB.", 413);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = detectarExtensao(buffer);

    if (!ext) {
      return erro("Selecione uma imagem JPG, PNG ou WEBP.", 415);
    }

    const nomeArquivo = `${userId}-${Date.now()}-${crypto
      .randomBytes(4)
      .toString("hex")}.${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, nomeArquivo), buffer);

    const novaUrl = `${URL_BASE}${nomeArquivo}`;

    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT profile_image FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    if (!rows.length) {
      await unlink(path.join(UPLOAD_DIR, nomeArquivo)).catch(() => {});
      return erro("Usuário não encontrado", 404);
    }

    const antiga: string | null = rows[0].profile_image ?? null;

    await db.query("UPDATE users SET profile_image = ? WHERE id = ?", [
      novaUrl,
      userId,
    ]);

    if (antiga?.startsWith(URL_BASE)) {
      await unlink(path.join(UPLOAD_DIR, path.basename(antiga))).catch(
        () => {}
      );
    }

    return NextResponse.json({
      message: "Foto atualizada com sucesso!",
      profile_image: novaUrl,
    });
  } catch (error) {
    console.error("Erro /api/me/avatar:", error);
    return erro("Não foi possível salvar a foto.", 500);
  }
}