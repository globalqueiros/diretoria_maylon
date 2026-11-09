
import { createHash, randomUUID } from "node:crypto";
import { jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

export type SessaoValida = {
  ok: true;
  userId: string;
  userType: string;
  sessionUuid: string;
  payload: JWTPayload & Record<string, unknown>;
};

export type SessaoInvalida = {
  ok: false;
  motivo: string;
  indisponivel?: true;
};

export type ResultadoSessao = SessaoValida | SessaoInvalida;

const CONEXAO_CAIDA = new Set(["ECONNRESET", "PROTOCOL_CONNECTION_LOST", "EPIPE"]);
const MAX_NOVAS_TENTATIVAS = 10;
const CACHE_MS = 15_000;

const cache = new Map<string, { ate: number; resultado: ResultadoSessao }>();
const emAndamento = new Map<string, Promise<ResultadoSessao>>();

export function conexaoCaiu(error: unknown): boolean {
  return CONEXAO_CAIDA.has(String((error as { code?: string })?.code || ""));
}

export async function comNovaTentativa<T>(consulta: () => Promise<T>): Promise<T> {
  for (let tentativa = 0; ; tentativa++) {
    try {
      return await consulta();
    } catch (error) {
      if (!conexaoCaiu(error) || tentativa >= MAX_NOVAS_TENTATIVAS) {
        throw error;
      }

      console.warn("[db] conexão caiu, tentando de novo:", (error as { code?: string })?.code);
    }
  }
}

function limparSecret(value?: string): string {
  if (!value) return "";

  const cleaned = value.replace(/\r/g, "").trim();

  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    return cleaned.slice(1, -1);
  }

  return cleaned;
}

export const SESSAO_DIAS = 7;
export const SESSAO_SEGUNDOS = SESSAO_DIAS * 24 * 60 * 60;

export function fimDaSessao(): Date {
  return new Date(Date.now() + SESSAO_SEGUNDOS * 1000);
}

export function jwtSecret(): string {
  return limparSecret(process.env.JWT_SECRET);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function novoSessionUuid(): string {
  return randomUUID();
}

export function tokenDaRequisicao(req?: Request | null): string | null {
  if (!req) return null;

  const cookieHeader = req.headers.get("cookie") || "";

  for (const part of cookieHeader.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    if (part.slice(0, i).trim() !== "access_token") continue;

    const value = part.slice(i + 1).trim();
    if (!value) continue;

    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  const auth = req.headers.get("authorization") || "";

  if (auth.toLowerCase().startsWith("bearer ")) {
    const bearer = auth.slice(7).trim();
    if (bearer) return bearer;
  }

  return null;
}

export async function tokenAtual(req?: Request | null): Promise<string | null> {
  const token = tokenDaRequisicao(req);
  if (token) return token;

  try {
    const cookieStore = await cookies();
    return cookieStore.get("access_token")?.value || null;
  } catch {
    return null;
  }
}

function idDoPayload(payload: Record<string, unknown>): string | null {
  for (const key of ["id", "sub", "usuario_id", "userId", "user_id"]) {
    const value = payload[key];

    if (value === null || value === undefined) continue;

    const id = String(value).trim();
    if (id) return id;
  }

  return null;
}

export function infoDispositivo(userAgent: string | null) {
  const agent = userAgent || "";

  const device_name = /ipad|tablet/i.test(agent)
    ? "Tablet"
    : /mobile|android|iphone|okhttp|dart/i.test(agent)
      ? "Celular"
      : "Computador";

  const browser_name = /okhttp|dart/i.test(agent)
    ? "App Maylon"
    : /Edg\//i.test(agent)
      ? "Microsoft Edge"
      : /OPR\//i.test(agent)
        ? "Opera"
        : /Firefox\//i.test(agent)
          ? "Mozilla Firefox"
          : /Chrome\//i.test(agent)
            ? "Google Chrome"
            : /Safari\//i.test(agent)
              ? "Safari"
              : "Outro";

  const operating_system = /Windows/i.test(agent)
    ? "Windows"
    : /Android|okhttp/i.test(agent)
      ? "Android"
      : /iPhone|iPad|iPod/i.test(agent)
        ? "iOS"
        : /Mac OS|Macintosh/i.test(agent)
          ? "macOS"
          : /Linux/i.test(agent)
            ? "Linux"
            : "Outro";

  return { device_name, browser_name, operating_system };
}

export function ipDaRequisicao(req?: Request | null): string | null {
  if (!req) return null;

  const candidatos = [
    req.headers.get("cf-connecting-ip"),
    req.headers.get("x-forwarded-for")?.split(",")[0],
    req.headers.get("x-real-ip"),
  ];

  for (const candidato of candidatos) {
    const ip = candidato?.trim();

    if (ip && ip.length <= 45 && /^[0-9a-f:.]+$/i.test(ip)) {
      return ip;
    }
  }

  return null;
}

export async function criarSessao(params: {
  sessionUuid: string;
  userId: string;
  token: string;
  expiresAt: Date;
  req?: Request | null;
}) {
  const userAgent = params.req?.headers.get("user-agent") || null;
  const info = infoDispositivo(userAgent);

  await db.execute(
    `INSERT INTO user_sessions (
      session_uuid, user_id, token_hash, ip_address, user_agent,
      device_name, browser_name, operating_system,
      status, created_at, last_activity_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW(), ?)`,
    [
      params.sessionUuid,
      params.userId,
      hashToken(params.token),
      ipDaRequisicao(params.req),
      userAgent,
      info.device_name,
      info.browser_name,
      info.operating_system,
      params.expiresAt,
    ]
  );
}

type LinhaSessao = {
  session_uuid: string;
  user_id: string;
  status: string;
  expires_at: Date | string;
  last_activity_at: Date | string | null;
};

function ativa(row: LinhaSessao): boolean {
  return (
    String(row.status).toLowerCase() === "active" &&
    new Date(row.expires_at).getTime() > Date.now()
  );
}

async function tocarAtividade(row: LinhaSessao, req?: Request | null) {
  const ultima = row.last_activity_at
    ? new Date(row.last_activity_at).getTime()
    : 0;

  if (Date.now() - ultima < 60_000) return;

  await db.execute(
    `UPDATE user_sessions
      SET last_activity_at = NOW(),
          ip_address = COALESCE(?, ip_address)
      WHERE session_uuid = ?`,
    [ipDaRequisicao(req), row.session_uuid]
  ).catch(() => {});
}

export async function validarSessao(
  token: string | null | undefined,
  req?: Request | null
): Promise<ResultadoSessao> {
  if (!token) {
    return { ok: false, motivo: "sem_token" };
  }

  const emCache = cache.get(token);

  if (emCache && emCache.ate > Date.now()) {
    return emCache.resultado;
  }

  const pendente = emAndamento.get(token);
  if (pendente) return pendente;

  const promessa = validarSemCache(token, req)
    .then((resultado): ResultadoSessao => {
      if (resultado.ok === false && resultado.indisponivel === true) {
        return resultado;
      }

      if (cache.size > 5000) cache.clear();

      cache.set(token, {
        ate: Date.now() + CACHE_MS,
        resultado,
      });

      return resultado;
    })
    .finally(() => {
      emAndamento.delete(token);
    });

  emAndamento.set(token, promessa);

  return promessa;
}

async function validarSemCache(
  token: string,
  req?: Request | null
): Promise<ResultadoSessao> {
  const secret = jwtSecret();

  if (!secret) {
    return { ok: false, motivo: "sem_secret" };
  }

  let payload: JWTPayload & Record<string, unknown>;

  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });

    payload = verified.payload as JWTPayload & Record<string, unknown>;
  } catch {
    return { ok: false, motivo: "token_invalido" };
  }

  const userId = idDoPayload(payload);

  if (!userId) {
    return { ok: false, motivo: "token_sem_usuario" };
  }

  const userType = String(payload.user_type ?? "").trim().toLowerCase();

  try {
    const sid = typeof payload.sid === "string" ? payload.sid : null;

    if (sid) {
      const [rows]: any = await comNovaTentativa(() =>
        db.execute(
          `SELECT session_uuid, user_id, status, expires_at, last_activity_at
            FROM user_sessions
            WHERE session_uuid = ?
            LIMIT 1`,
          [sid]
        )
      );

      const row: LinhaSessao | undefined = rows?.[0];

      if (!row || String(row.user_id) !== userId || !ativa(row)) {
        return { ok: false, motivo: "sessao_encerrada" };
      }

      await tocarAtividade(row, req);

      return {
        ok: true,
        userId,
        userType,
        sessionUuid: row.session_uuid,
        payload,
      };
    }

    const tokenHash = hashToken(token);

    const buscarPeloHash = async (): Promise<ResultadoSessao | null> => {
      const [rows]: any = await comNovaTentativa(() =>
        db.execute(
          `SELECT session_uuid, user_id, status, expires_at, last_activity_at
            FROM user_sessions
            WHERE token_hash = ?
            LIMIT 1`,
          [tokenHash]
        )
      );

      const row: LinhaSessao | undefined = rows?.[0];

      if (!row) return null;

      if (String(row.user_id) !== userId || !ativa(row)) {
        return { ok: false, motivo: "sessao_encerrada" };
      }

      await tocarAtividade(row, req);

      return {
        ok: true,
        userId,
        userType,
        sessionUuid: row.session_uuid,
        payload,
      };
    };

    const existente = await buscarPeloHash();
    if (existente) return existente;

    const expiresAt =
      typeof payload.exp === "number"
        ? new Date(payload.exp * 1000)
        : fimDaSessao();

    const sessionUuid = novoSessionUuid();
    const userAgent = req?.headers.get("user-agent") || null;
    const info = infoDispositivo(userAgent);

    try {
      await comNovaTentativa(() =>
        db.execute(
          `INSERT INTO user_sessions (
            session_uuid, user_id, token_hash, ip_address, user_agent,
            device_name, browser_name, operating_system,
            status, created_at, last_activity_at, expires_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW(), ?)`,
          [
            sessionUuid,
            userId,
            tokenHash,
            ipDaRequisicao(req),
            userAgent,
            info.device_name,
            info.browser_name,
            info.operating_system,
            expiresAt,
          ]
        )
      );
    } catch (error: any) {
      if (error?.code === "ER_DUP_ENTRY") {
        const outra = await buscarPeloHash();
        if (outra) return outra;
      }

      throw error;
    }

    return {
      ok: true,
      userId,
      userType,
      sessionUuid,
      payload,
    };
  } catch (error) {
    console.error("[sessao] erro ao validar sessão:", error);

    return {
      ok: false,
      motivo: "erro_banco",
      indisponivel: true,
    };
  }
}

export async function payloadDaSessao(
  token: string | null | undefined
): Promise<Record<string, unknown>> {
  const sessao = await validarSessao(token);

  if (sessao.ok === false) {
    throw new Error(`Sessão inválida: ${sessao.motivo}`);
  }

  return {
    ...sessao.payload,
    id: sessao.userId,
  };
}

export async function sessaoDaRequisicao(
  req?: Request | null
): Promise<ResultadoSessao> {
  return validarSessao(await tokenAtual(req), req);
}

export async function getSessionUser() {
  const token = await tokenAtual();

  if (!token) return null;

  const sessao = await validarSessao(token);

  if (sessao.ok === false) return null;

  return {
    ...sessao.payload,
    id: sessao.userId,
    user_type: sessao.userType,
    session_uuid: sessao.sessionUuid,
  };
}

function limparCache() {
  cache.clear();
}

export async function encerrarSessao(
  sessionUuid: string,
  status: "inactive" | "revoked",
  motivo: string,
  userId?: string
) {
  const [result]: any = await db.execute(
    `UPDATE user_sessions
      SET status = ?, ended_at = NOW(), end_reason = ?
      WHERE session_uuid = ?
      ${userId ? "AND user_id = ?" : ""}
      AND status = 'active'`,
    userId
      ? [status, motivo.slice(0, 100), sessionUuid, userId]
      : [status, motivo.slice(0, 100), sessionUuid]
  );

  limparCache();

  return Number(result?.affectedRows || 0);
}

export async function revogarSessoesDoUsuario(
  userId: string,
  motivo: string,
  exceto?: string | null
) {
  const [result]: any = await db.execute(
    `UPDATE user_sessions
      SET status = 'revoked', ended_at = NOW(), end_reason = ?
      WHERE user_id = ? AND status = 'active'
      ${exceto ? "AND session_uuid <> ?" : ""}`,
    exceto
      ? [motivo.slice(0, 100), userId, exceto]
      : [motivo.slice(0, 100), userId]
  );

  limparCache();

  return Number(result?.affectedRows || 0);
}

export async function estenderSessao(
  sessionUuid: string,
  novoExpira: Date
) {
  await db.execute(
    `UPDATE user_sessions
      SET expires_at = GREATEST(expires_at, ?)
      WHERE session_uuid = ? AND status = 'active'`,
    [novoExpira, sessionUuid]
  );
}