import nodemailer from "nodemailer";

type SendMagicLinkParams = {
  email: string;
  name?: string;
  link: string;
  ip?: string;
  location?: string;
  userAgent?: string;
};

function getDeviceAndBrowser(userAgent?: string) {
  if (!userAgent) {
    return { browser: "Desconhecido", device: "Desconhecido" };
  }

  let browser = "Desconhecido";
  let device = "Desktop";

  if (/android/i.test(userAgent)) device = "Android";
  else if (/iphone|ipad|ipod/i.test(userAgent)) device = "iPhone";

  if (userAgent.includes("Edg")) browser = "Microsoft Edge";
  else if (userAgent.includes("Chrome")) browser = "Google Chrome";
  else if (userAgent.includes("Firefox")) browser = "Mozilla Firefox";
  else if (userAgent.includes("Safari")) browser = "Safari";

  return { browser, device };
}

export function magicLinkTemplate(
  link: string,
  name?: string,
  ip?: string,
  location?: string,
  userAgent?: string
) {
  const userName = name || "usuário";
  const { browser, device } = getDeviceAndBrowser(userAgent);

  return `
  <div style="font-family:Arial;background:#f4f6f8;padding:20px;">
    <div style="max-width:600px;margin:auto;background:#fff;border-radius:10px;padding:30px;">      
      <div style="text-align:center;margin-bottom:20px;">
        <img src="https://auth.maylon.com.br/storage/app/public/business/2026-02-21-699a698c29d9b.webp" width="120"/>
      </div>
      <h2>Olá, ${userName}</h2>
      <p>Detectamos uma tentativa de acesso à sua conta.</p>
      <div style="background:#f3f4f6;padding:15px;border-radius:8px;margin:20px 0;">
        <strong>🔐 Detalhes do acesso:</strong><br/>
        IP: ${ip || "Não identificado"}<br/>
        Navegador: ${browser} ${device}<br/>
        Localização: ${location || "Não identificada"}
      </div>
      <div style="text-align:center;margin:25px 0;">
        <a href="${link}" style="background:#14b8a6;color:#fff;padding:14px 26px;border-radius:8px;text-decoration:none;">
          🔐 Acessar minha conta
        </a>
      </div>
      <p style="font-size:13px;color:#6b7280;">
        Este link expira em 15 minutos.
      </p>
      <p style="font-size:13px;color:#ef4444;">
        Se não foi você, ignore este e-mail.
      </p>

    </div>
  </div>
  `;
}

export async function sendMagicLink({
  email,
  name,
  link,
  ip,
  location,
  userAgent,
}: SendMagicLinkParams) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const html = magicLinkTemplate(link, name, ip, location, userAgent);

  await transporter.sendMail({
    from: `"Maylon" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 Acesso seguro - Maylon",
    html,
  });
}