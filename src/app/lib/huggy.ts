import { promises as fs } from "fs";
import path from "path";

type HuggyToken = {
    access_token: string;
    refresh_token: string;
    expiresAt: number;
};

type PersistedToken = HuggyToken & {
    client_id?: string;
};

let cachedToken: HuggyToken | null = null;
let refreshPromise: Promise<HuggyToken> | null = null;

const BASE_URL = process.env.HUGGY_BASE_URL || "https://api.huggy.app/v3";
const AUTH_URL =
    process.env.HUGGY_AUTH_URL || "https://auth.huggy.app/oauth/access_token";
const CLIENT_ID = process.env.HUGGY_CLIENT_ID;
const CLIENT_SECRET = process.env.HUGGY_CLIENT_SECRET;
const COMPANY_ID = process.env.HUGGY_COMPANY_ID;

const TOKEN_FILE = path.join(process.cwd(), ".huggy-token.json");

function jwtExpiry(token: string): number | null {
    try {
        const payload = token.split(".")[1];
        if (!payload) return null;

        const decoded = JSON.parse(
            Buffer.from(payload, "base64url").toString()
        ) as { exp?: number };

        return typeof decoded.exp === "number"
            ? decoded.exp * 1000
            : null;
    } catch {
        return null;
    }
}

function envRefreshToken(): string | null {
    return process.env.HUGGY_REFRESH_TOKEN || null;
}

async function readPersistedToken(): Promise<PersistedToken | null> {
    try {
        const raw = await fs.readFile(TOKEN_FILE, "utf8");
        const data = JSON.parse(raw) as PersistedToken;

        if (data?.access_token && data?.refresh_token) {
            return data;
        }

        return null;
    } catch {
        return null;
    }
}

async function persistToken(token: PersistedToken) {
    try {
        await fs.writeFile(TOKEN_FILE, JSON.stringify(token), "utf8");
    } catch (error) {
        console.error("Falha ao persistir token Huggy:", error);
    }
}

async function refreshAccessToken(
    refreshToken: string
): Promise<HuggyToken> {
    const response = await fetch(AUTH_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            grant_type: "refresh_token",
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: refreshToken,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(
            `Falha ao renovar token Huggy (${response.status}): ${text}`
        );
    }

    const data = (await response.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
    };

    if (!data.access_token) {
        throw new Error("Resposta de refresh sem access_token");
    }

    return {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken,
        expiresAt:
            Date.now() + (data.expires_in ?? 2505600) * 1000 - 60_000,
    };
}

function refreshTokenOnce(refreshToken: string): Promise<HuggyToken> {
    if (!refreshPromise) {
        refreshPromise = refreshAccessToken(refreshToken).finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

export async function getHuggyToken(force = false): Promise<string> {
    if (
        !force &&
        cachedToken?.access_token &&
        Date.now() < cachedToken.expiresAt
    ) {
        return cachedToken.access_token;
    }

    if (!force && !cachedToken) {
        const persisted = await readPersistedToken();

        if (
            persisted?.access_token &&
            persisted.client_id === CLIENT_ID &&
            (persisted.expiresAt === 0 ||
                Date.now() < persisted.expiresAt)
        ) {
            cachedToken = {
                access_token: persisted.access_token,
                refresh_token: persisted.refresh_token,
                expiresAt: persisted.expiresAt,
            };
            return cachedToken.access_token;
        }

        const access_token = process.env.HUGGY_ACCESS_TOKEN;

        if (access_token) {
            const expiresAt = jwtExpiry(access_token) ?? 0;

            if (expiresAt === 0 || Date.now() < expiresAt) {
                cachedToken = {
                    access_token,
                    refresh_token: envRefreshToken() ?? "",
                    expiresAt,
                };

                return cachedToken.access_token;
            }
        }
    }

    const persisted =
        cachedToken?.refresh_token ? null : await readPersistedToken();

    const refreshToken =
        cachedToken?.refresh_token ||
        (persisted && persisted.client_id === CLIENT_ID
            ? persisted.refresh_token
            : undefined) ||
        envRefreshToken();

    if (!refreshToken) {
        throw new Error(
            "Credenciais Huggy não configuradas (HUGGY_REFRESH_TOKEN)"
        );
    }

    cachedToken = await refreshTokenOnce(refreshToken);

    await persistToken({
        ...cachedToken,
        client_id: CLIENT_ID,
    });

    return cachedToken.access_token;
}

export async function huggyFetch(
    path: string,
    init: RequestInit = {},
    opts: { company?: boolean } = {}
): Promise<Response> {
    const { company = true } = opts;

    const token = await getHuggyToken();

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept", "application/json");
    headers.set("Accept-Language", "pt-br");

    if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const url = company
        ? `${BASE_URL}/companies/${COMPANY_ID}${path}`
        : `${BASE_URL}${path}`;

    const response = await fetch(url, { ...init, headers });

    if (response.status === 401) {
        const refreshedToken = await getHuggyToken(true);
        headers.set("Authorization", `Bearer ${refreshedToken}`);

        return fetch(url, { ...init, headers });
    }

    return response;
}

export async function parseHuggyResponse(
    response: Response
): Promise<unknown> {
    const text = await response.text();

    if (!text) {
        return { ok: true };
    }

    try {
        return JSON.parse(text);
    } catch {
        return { ok: true };
    }
}
