"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // 🔥 Limpa autenticação
    localStorage.removeItem("token");
    sessionStorage.clear();

    // Se usar cookies (frontend simples)
    document.cookie = "token=; path=/; max-age=0";

    // Redireciona com flag de sucesso
    setTimeout(() => {
      router.replace("/?logout=success");
    }, 500);
  }, []);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <p className="text-gray-600 text-lg animate-pulse">
          Saindo...
        </p>
      </div>
    </div>
  );
}