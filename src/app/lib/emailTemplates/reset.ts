export const resetTemplate = (
  link: string,
  name: string,
  info: { ip: string; device: string; location: string }
) => {
  return `
  <div style="font-family: Arial; background:#f4f4f4; padding:20px;">
    <div style="max-width:500px;margin:auto;background:#fff;padding:20px;border-radius:10px;">

      <h2 style="color:#0f766e;">Olá, ${name}</h2>

      <p>Detectamos uma solicitação de redefinição de senha.</p>

      <div style="margin:20px 0; padding:15px; background:#f9fafb; border-radius:8px;">
        <strong>🔐 Detalhes do acesso:</strong><br/><br/>

        <b>IP:</b> ${info.ip} <br/>
        <b>Navegador:</b> ${info.device} <br/>
        <b>Localização:</b> ${info.location}
      </div>

      <a href="${link}" 
         style="display:inline-block;margin-top:15px;padding:12px 20px;
         background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;">
         Redefinir senha
      </a>

      <p style="margin-top:20px;font-size:12px;color:#555;">
        Este link expira em 15 minutos.
      </p>

      <p style="font-size:12px;color:red;">
        Se você não solicitou isso, ignore este email.
      </p>

    </div>
  </div>
  `;
};