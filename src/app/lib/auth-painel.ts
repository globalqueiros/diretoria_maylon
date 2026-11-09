import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "./db";

const PERFIS_PERMITIDOS = ["atendente", "diretor", "gerente"];

export type UsuarioPainel = { id: number; user_type: string };

export type ResultadoAuth = {
  ok: boolean;
  status?: number;
  error?: string;
  user?: UsuarioPainel;
};

function normalizar(valor: unknown): string {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function exigirPainel(): Promise<ResultadoAuth> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return { ok: false, status: 401, error: "Não autenticado" };
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET não configurado");
    return { ok: false, status: 500, error: "Erro interno de autenticação" };
  }

  let decoded: { id?: number };

  try {
    decoded = jwt.verify(token, secret) as typeof decoded;
  } catch {
    return {
      ok: false,
      status: 401,
      error: "Token inválido ou sessão expirada",
    };
  }

  if (!decoded?.id) {
    return { ok: false, status: 401, error: "Token inválido" };
  }

  const [rows]: any = await db.query(
    "SELECT id, user_type FROM users WHERE id = ? LIMIT 1",
    [decoded.id]
  );

  if (!rows || rows.length === 0) {
    return { ok: false, status: 401, error: "Usuário não encontrado" };
  }

  const tipo = normalizar(rows[0].user_type);

  if (!PERFIS_PERMITIDOS.includes(tipo)) {
    return { ok: false, status: 403, error: "Sem permissão." };
  }

  return { ok: true, user: { id: rows[0].id, user_type: tipo } };
}