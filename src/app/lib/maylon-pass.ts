import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const COL_SENHA = "password";

export type PlanoId = "basico" | "plus" | "premium";

// Preços sempre definidos no servidor (nunca confie no valor vindo da tela)
export const PRECOS: Record<PlanoId, number> = {
    basico: 29.9,
    plus: 59.9,
    premium: 89.9,
};

export const ADICIONAIS: Record<string, number> = {
    home: 50,
    van_escolar: 210,
};

// Perfis (users.user_type, em minúsculas) que podem consultar usuários e
// enviar solicitações de plano. Só o gerente aprova (isso fica na rota PATCH).
// "comercial" foi incluído porque a tela fica em /comercial: confirme no
// terminal qual é o seu tipo e remova se não for esse.
export const TIPOS_ATENDIMENTO = ["atendente", "comercial", "gerente"];

export function calcularValor(plano: PlanoId, adicionais: string[]) {
    const extras = adicionais.reduce((s, a) => s + (ADICIONAIS[a] ?? 0), 0);
    return Math.round((PRECOS[plano] + extras) * 100) / 100;
}

/* ----------------------------- Sessão ----------------------------- */

export interface UsuarioLogado {
    id: number;
    nome: string;
    tipo: string;
}

// Lê o cookie access_token (JWT) e confirma o usuário no banco
export async function getUsuarioLogado(): Promise<UsuarioLogado | null> {
    try {
        const token = (await cookies()).get("access_token")?.value;
        if (!token || !process.env.JWT_SECRET) return null;

        const payload = jwt.verify(token, process.env.JWT_SECRET) as any;
        const id = payload?.id ?? payload?.sub ?? payload?.userId;
        if (!id) return null;

        const [rows]: any = await db.query(
            "SELECT id, full_name, user_type FROM users WHERE id = ? LIMIT 1",
            [id]
        );
        const u = rows?.[0];
        if (!u) return null;

        return {
            id: Number(u.id),
            nome: String(u.full_name ?? ""),
            // minúsculas e sem espaços, para "Gerente " bater com "gerente"
            tipo: String(u.user_type ?? "").trim().toLowerCase(),
        };
    } catch {
        return null;
    }
}

/* ----------------------------- Autorização do gerente ----------------------------- */

const HASH_FALSO = "$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5BiT9bQe7QxkT7xK5m6o2Zl1b0y8u";

// Confere e-mail/matrícula + senha de um usuário do tipo gerente
export async function validarGerente(login: string, senha: string) {
    const [rows]: any = await db.query(
        `SELECT id, full_name, ${COL_SENHA} AS senha_hash
           FROM users
          WHERE user_type = 'gerente' AND (email = ? OR matricula = ?)
          LIMIT 1`,
        [login, login]
    );
    const g = rows?.[0];

    // compara sempre, para não revelar se o gerente existe pelo tempo de resposta
    const ok = await bcrypt.compare(senha, g?.senha_hash ?? HASH_FALSO);
    if (!g || !ok) return null;

    return { id: Number(g.id), nome: String(g.full_name ?? "") };
}

/* ----------------------------- Limite de tentativas ----------------------------- */

const MAX_FALHAS = 5;
const JANELA_MS = 10 * 60 * 1000;
const falhas = new Map<number, { n: number; ate: number }>();

export function bloqueado(atendenteId: number) {
    const f = falhas.get(atendenteId);
    if (!f) return false;
    if (Date.now() > f.ate) {
        falhas.delete(atendenteId);
        return false;
    }
    return f.n >= MAX_FALHAS;
}

export function registrarFalha(atendenteId: number) {
    const f = falhas.get(atendenteId);
    if (!f || Date.now() > f.ate) {
        falhas.set(atendenteId, { n: 1, ate: Date.now() + JANELA_MS });
    } else {
        f.n += 1;
    }
}

export function limparFalhas(atendenteId: number) {
    falhas.delete(atendenteId);
}