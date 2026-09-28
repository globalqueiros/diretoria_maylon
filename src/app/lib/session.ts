import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function getSessionUser(): Promise<{ id: number } | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("access_token")?.value;

        if (!token) return null;

        const secret = process.env.JWT_SECRET;
        if (!secret) return null;

        const decoded = jwt.verify(token, secret) as { id: number };

        if (!decoded.id) return null;

        return { id: decoded.id };
    } catch {
        return null;
    }
}
