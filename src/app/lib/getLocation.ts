export async function getLocation(ip: string) {
    try {
        if (ip === "Ambiente local" || ip === "Não identificado") {
            return "Não identificada";
        }

        const res = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await res.json();

        return `${data.city || "Cidade?"} - ${data.country_name || "País?"}`;
    } catch {
        return "Não identificada";
    }
}