"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const publicRoutes = [
      "/",
    ];
    if (publicRoutes.includes(pathname)) {
      return;
    }
    let cancelled = false;
    async function checkAuth() {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok && !cancelled) {
          router.replace(
            "/?error=" +
            encodeURIComponent(
              "Sua sessão expirou. Faça login novamente."
            )
          );
        }
      } catch {
        if (!cancelled) {
          router.replace(
            "/?error=" +
            encodeURIComponent(
              "Você precisa estar logado."
            )
          );
        }
      }
    }
    checkAuth();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);
  return <>{children}</>;
}