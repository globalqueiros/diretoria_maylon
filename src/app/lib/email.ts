import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export function getClientIP(req: any) {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfIp = req.headers.get("cf-connecting-ip");

  let ip =
    cfIp ||
    (forwarded ? forwarded.split(",")[0].trim() : null) ||
    realIp ||
    "Não identificado";

  if (ip === "::1" || ip === "127.0.0.1") {
    ip = "Ambiente local";
  }

  return ip;
}