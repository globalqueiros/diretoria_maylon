import { transporter } from "./mail";

type MailOptions = {
    from?: string;
    to: string;
    subject: string;
    html: string;
};

export async function sendMailWithRetry(options: MailOptions) {
    const maxRetries = Number(process.env.EMAIL_RETRY || 3);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const info = await transporter.sendMail({
                from: options.from || process.env.EMAIL_FROM,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });

            console.log("Email enviado com sucesso:", info.messageId);
            return true;

        } catch (error) {
            console.error(`Tentativa ${attempt} falhou`, error);

            if (attempt === maxRetries) {
                console.error("Falha total ao enviar email");
                throw error;
            }

            await new Promise((resolve) =>
                setTimeout(resolve, 1000 * attempt)
            );
        }
    }
}