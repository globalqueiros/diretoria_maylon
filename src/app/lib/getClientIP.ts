export function getClientIP(req: Request) {
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