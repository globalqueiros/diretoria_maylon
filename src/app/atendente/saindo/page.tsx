"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem("token");
    sessionStorage.clear();
    document.cookie = "token=; path=/; max-age=0";

    const timer = setTimeout(() => {
      router.replace("/?logout=success");
    }, 1200);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#40b99d] px-4">
      <div className="flex w-full max-w-sm flex-col items-center">
        <div className="w-full rounded-3xl bg-white px-8 py-10 text-center shadow-xl">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#d8f7eb] p-4 shadow-sm">
            <Image
              src="/favicon.ico"
              alt="Logo"
              width={90}
              height={90}
              priority
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="mt-6 text-xl font-bold text-[#102a43]">
            Saindo da sua conta
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#607d94]">
            Estamos encerrando sua sessão.
            <br />
            Aguarde um instante...
          </p>
          <div className="mt-7 flex flex-col items-center">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#d8f7eb] border-t-[#00a99d]" />
            <span className="mt-4 text-xs font-semibold text-[#00a99d]">
              Saindo...
            </span>
          </div>
        </div>
        <p className="mt-5 text-xs font-medium text-white/80">
          Até logo! 👋
        </p>
      </div>
    </main>
  );
}
