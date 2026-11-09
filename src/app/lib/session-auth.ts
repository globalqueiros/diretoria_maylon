import { createHash, randomUUID } from "node:crypto";
import { db } from "../lib/db";
import { tokenAtual, validarSessao } from "./sessaoServidor";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

type AuthUser = {
  id: string;
  user_level_id: number;
};

type SessionRow = RowDataPacket & {
  id: number;
  user_id: string;
  status: string;
  expires_at: Date;
};

function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET não configurado.");
  }

  return new TextEncoder().encode(secret);
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getAuthenticatedUser(req?: Request): Promise<{
  user: AuthUser;
  token: string;
  sessionUuid: string;
} | null> {
  // Usa o validador central: aceita o token do login (campo "id", não "sub"),
  // cookie ou Bearer, e recusa sessão revogada/encerrada.
  const token = await tokenAtual(req);
  const sessao = await validarSessao(token, req);

  if (!token || !sessao.ok) return null;

  try {
    const userId = sessao.userId;

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, user_level_id
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    if (!rows.length) return null;

    return {
      user: {
        id: String(rows[0].id),
        user_level_id: Number(rows[0].user_level_id),
      },
      token,
      sessionUuid: sessao.sessionUuid,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const authenticated = await getAuthenticatedUser();

  if (!authenticated) {
    return {
      ok: false as const,
      status: 401,
      error: "Autenticação necessária.",
    };
  }

  const levels = (process.env.SESSION_ADMIN_LEVEL_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map(Number);

  if (
    !levels.length ||
    !levels.includes(authenticated.user.user_level_id)
  ) {
    return {
      ok: false as const,
      status: 403,
      error: "Você não tem permissão para administrar sessões.",
    };
  }

  return {
    ok: true as const,
    ...authenticated,
  };
}

export async function registerSession(params: {
  userId: string;
  token: string;
  ip: string | null;
  userAgent: string | null;
  expiresAt: Date;
}) {
  const tokenHash = hashToken(params.token);

  const [existingRows] = await db.execute<RowDataPacket[]>(
    `SELECT id, status, expires_at
     FROM user_sessions
     WHERE token_hash = ?
     LIMIT 1`,
    [tokenHash]
  );

  const agent = params.userAgent || "";

  const deviceName =
    /ipad|tablet/i.test(agent)
      ? "Tablet"
      : /mobile|android|iphone/i.test(agent)
        ? "Celular"
        : "Computador";

  const browserName =
    /Edg\//i.test(agent)
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

  const operatingSystem =
    /Windows/i.test(agent)
      ? "Windows"
      : /Android/i.test(agent)
        ? "Android"
        : /iPhone|iPad|iPod/i.test(agent)
          ? "iOS"
          : /Mac OS|Macintosh/i.test(agent)
            ? "macOS"
            : /Linux/i.test(agent)
              ? "Linux"
              : "Outro";

  if (existingRows.length > 0) {
    const existing = existingRows[0];

    if (
      existing.status === "active" &&
      new Date(existing.expires_at).getTime() > Date.now()
    ) {
      await db.execute<ResultSetHeader>(
        `UPDATE user_sessions
         SET last_activity_at = NOW(),
             ip_address = ?,
             user_agent = ?,
             device_name = ?,
             browser_name = ?,
             operating_system = ?
         WHERE id = ?`,
        [
          params.ip,
          params.userAgent,
          deviceName,
          browserName,
          operatingSystem,
          existing.id,
        ]
      );

      return;
    }

    await db.execute<ResultSetHeader>(
      `UPDATE user_sessions
       SET session_uuid = ?,
           user_id = ?,
           ip_address = ?,
           user_agent = ?,
           device_name = ?,
           browser_name = ?,
           operating_system = ?,
           status = 'active',
           created_at = NOW(),
           last_activity_at = NOW(),
           expires_at = ?,
           ended_at = NULL,
           end_reason = NULL
       WHERE id = ?`,
      [
        randomUUID(),
        params.userId,
        params.ip,
        params.userAgent,
        deviceName,
        browserName,
        operatingSystem,
        params.expiresAt,
        existing.id,
      ]
    );

    return;
  }

  await db.execute<ResultSetHeader>(
    `INSERT INTO user_sessions (
      session_uuid,
      user_id,
      token_hash,
      ip_address,
      user_agent,
      device_name,
      browser_name,
      operating_system,
      status,
      created_at,
      last_activity_at,
      expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW(), ?)`,
    [
      randomUUID(),
      params.userId,
      tokenHash,
      params.ip,
      params.userAgent,
      deviceName,
      browserName,
      operatingSystem,
      params.expiresAt,
    ]
  );
}

export async function isSessionActive(token: string) {
  const [rows] = await db.execute<SessionRow[]>(
    `SELECT id, user_id, status, expires_at
     FROM user_sessions
     WHERE token_hash = ?
       AND status = 'active'
       AND expires_at > NOW()
     LIMIT 1`,
    [hashToken(token)]
  );

  if (!rows.length) return false;

  await db.execute<ResultSetHeader>(
    `UPDATE user_sessions
     SET last_activity_at = NOW()
     WHERE id = ?
       AND (
         last_activity_at IS NULL
         OR last_activity_at < DATE_SUB(NOW(), INTERVAL 1 MINUTE)
       )`,
    [rows[0].id]
  );

  return true;
}

export async function endCurrentSession(
  token: string,
  reason = "logout"
) {
  await db.execute<ResultSetHeader>(
    `UPDATE user_sessions
     SET status = 'inactive',
         ended_at = NOW(),
         end_reason = ?
     WHERE token_hash = ?
       AND status = 'active'`,
    [reason, hashToken(token)]
  );
}