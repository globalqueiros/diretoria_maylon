import "server-only";
import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { simpleParser } from "mailparser";

function required(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variável ${name} não configurada.`);
  }

  return value;
}

export function criarClienteImap() {
  return new ImapFlow({
    host: required("MAIL_IMAP_HOST"),
    port: Number(process.env.MAIL_IMAP_PORT || 993),
    secure: true,
    auth: {
      user: required("MAIL_IMAP_USER"),
      pass: required("MAIL_IMAP_PASSWORD"),
    },
    logger: false,
  });
}

export function criarTransportadorSmtp() {
  return nodemailer.createTransport({
    host: required("MAIL_SMTP_HOST"),
    port: Number(process.env.MAIL_SMTP_PORT || 465),
    secure: true,
    auth: {
      user: required("MAIL_SMTP_USER"),
      pass: required("MAIL_SMTP_PASSWORD"),
    },
  });
}

export async function listarEmails() {
  const client = criarClienteImap();

  try {
    await client.connect();

    const lock = await client.getMailboxLock("INBOX");

    try {
      const mailbox = client.mailbox;
      const total =
        mailbox && typeof mailbox === "object" ? mailbox.exists ?? 0 : 0;

      if (!total) return [];

      const inicio = Math.max(1, total - 19);

      const mensagens = [];

      for await (const msg of client.fetch(
        `${inicio}:*`,
        {
          uid: true,
          envelope: true,
          source: true,
          flags: true,
        },
      )) {
        if (!msg.source) continue;

        const parsed = await simpleParser(msg.source);

        mensagens.push({
          uid: msg.uid,
          assunto: parsed.subject || "(Sem assunto)",
          remetente:
            parsed.from?.text || "Remetente desconhecido",
          destinatario: (Array.isArray(parsed.to) ? parsed.to[0]?.text : parsed.to?.text) || "",
          data: parsed.date?.toISOString() || null,
          texto: (parsed.text || "").slice(0, 20000),
          lido: msg.flags.has("\\Seen"),
        });
      }

      return mensagens.reverse();
    } finally {
      lock.release();
    }
  } finally {
    if (client.usable) {
      await client.logout();
    }
  }
}