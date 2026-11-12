export function getDevice(req: Request) {
  const ua = req.headers.get("user-agent") || "Desconhecido";

  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";

  return ua;
}