import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import { db } from "./db";

export type Perfil = "atendente" | "gerente" | "diretor" | "comercial" | "marketing";

export type UsuarioSessao = {
  id: number;
  user_type: Perfil;
  full_name: string;
};

const BASE_POR_PERFIL: Record<Perfil, string> = {
  atendente: "/atendente",
  gerente: "/gerente",
  diretor: "/diretor",
  comercial: "/comercial",
  marketing: "/marketing",
};

const PERFIS: Perfil[] = ["atendente", "gerente", "diretor", "comercial", "marketing"];

function normalizar(valor: unknown): string {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function normalizarPerfil(valor: unknown): Perfil | null {
  const tipo = normalizar(valor);
  if (PERFIS.includes(tipo as Perfil)) return tipo as Perfil;

  const aliases: Record<string, Perfil> = {
    admin: "diretor",
    administrador: "diretor",
    diretoria: "diretor",
    gerencia: "gerente",
    atendimento: "atendente",
    suporte: "atendente",
    vendas: "comercial",
  };

  return aliases[tipo] ?? null;
}

export function baseDoPerfil(perfil: Perfil) {
  return BASE_POR_PERFIL[perfil];
}

export async function getUsuarioSessao(): Promise<UsuarioSessao | null> {
  const token = (await cookies()).get("access_token")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) return null;

  let decoded: { id?: number | string; role?: string };

  try {
    decoded = jwt.verify(token, secret) as typeof decoded;
  } catch {
    return null;
  }

  const id = Number(decoded?.id);

  if (!Number.isSafeInteger(id) || id <= 0) return null;

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, full_name, user_type FROM users WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!rows.length) return null;

    const perfil = normalizarPerfil(rows[0].user_type);

    if (!perfil) return null;

    return {
      id: Number(rows[0].id),
      user_type: perfil,
      full_name: String(rows[0].full_name ?? ""),
    };
  } catch {
    return null;
  }
}

export async function exigirPerfilNaPagina(perfis: Perfil[]) {
  const usuario = await getUsuarioSessao();

  if (!usuario) {
    redirect("/?error=" + encodeURIComponent("Sua sessão expirou. Faça login novamente."));
  }

  if (!perfis.includes(usuario.user_type)) {
    redirect(baseDoPerfil(usuario.user_type));
  }

  return usuario;
}

export type ResultadoPerfilApi = {
  ok: boolean;
  usuario?: UsuarioSessao;
  status?: number;
  error?: string;
};

export async function exigirPerfilNaApi(perfis: Perfil[]): Promise<ResultadoPerfilApi> {
  const usuario = await getUsuarioSessao();

  if (!usuario) {
    return { ok: false, status: 401, error: "Não autenticado." };
  }

  if (!perfis.includes(usuario.user_type)) {
    return { ok: false, status: 403, error: "Sem permissão para este recurso." };
  }

  return { ok: true, usuario };
}
