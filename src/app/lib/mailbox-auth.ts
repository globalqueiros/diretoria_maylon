import "server-only";
import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "maylon_mailbox_session";
const SESSION_SECONDS = 8 * 60 * 60;

function sign(value: string) {
  const secret = process.env.MAILBOX_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("MAILBOX_SESSION_SECRET inválido.");
  }

  return createHmac("sha256", secret)
    .update(value)
    .digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return (
    left.length === right.length &&
    timingSafeEqual(left, right)
  );
}

export function validarCredenciais(
  usuario: string,
  senha: string,
) {
  const usuarioValido = process.env.MAILBOX_ACCESS_USER;
  const senhaValida = process.env.MAILBOX_ACCESS_PASSWORD;

  if (!usuarioValido || !senhaValida) return false;

  return (
    safeEqual(usuario, usuarioValido) &&
    safeEqual(senha, senhaValida)
  );
}

export async function criarSessao() {
  const expires = Math.floor(Date.now() / 1000) +
    SESSION_SECONDS;

  const value = String(expires);
  const token = `${value}.${sign(value)}`;

  const store = await cookies();

  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function encerrarSessao() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function temAcessoMailbox() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;

  if (!token) return false;

  const [expires, signature, extra] = token.split(".");

  if (!expires || !signature || extra) return false;

  const expiry = Number(expires);

  if (
    !Number.isSafeInteger(expiry) ||
    expiry <= Math.floor(Date.now() / 1000)
  ) {
    return false;
  }

  try {
    return safeEqual(signature, sign(expires));
  } catch {
    return false;
  }
}