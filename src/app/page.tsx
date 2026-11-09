"use client";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const ROUTES: Record<string, string> = {
  atendente: "/atendente",
  gerente: "/gerente",
  diretor: "/diretor",
  comercial: "/comercial",
  marketing: "/marketing",
};

const ROLE_ALIASES: Record<string, string> = {
  atendente: "atendente",
  attendant: "atendente",
  gerente: "gerente",
  manager: "gerente",
  diretor: "diretor",
  diretora: "diretor",
  director: "diretor",
};

function normalizeRole(value: unknown): string {
  const key = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  return ROLE_ALIASES[key] ?? key;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Alerta de logout
  useEffect(() => {
    if (searchParams.get("logout") !== "success") return;

    setShowAlert(true);

    const timer = setTimeout(() => {
      setShowAlert(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    const errorParam = searchParams.get("error");

    if (!errorParam) return;

    if (errorParam === "invalid") {
      setError("Não foi possível acessar sua conta. Link inválido ou já usado.");
    } else if (errorParam === "expired") {
      setError("Seu link expirou. Solicite um novo acesso.");
    } else {
      setError("Não foi possível acessar sua conta.");
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    window.history.replaceState({}, "", url.toString());
  }, [searchParams]);

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    const matriculaLimpa = matricula.trim();

    if (!matriculaLimpa) {
      setError("Digite sua matrícula.");
      return;
    }

    if (!password) {
      setError("Digite sua senha.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          matricula: matriculaLimpa,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Matrícula ou senha inválida.");
        setLoading(false);
        return;
      }

      const rawRole =
        data.user?.user_type ??
        data.user?.role ??
        data.user?.papel ??
        data.user?.cargo ??
        "";

      const role = normalizeRole(rawRole);

      const recruitmentStatus = String(data.user?.recruitment_status ?? "")
        .trim()
        .toLowerCase();

      const status = String(data.user?.status ?? "").trim().toLowerCase();

      if (status === "blocked") {
        setError(
          "A sua conta está bloqueada. Entre em contato com o departamento de Recursos Humanos."
        );
        setLoading(false);
        return;
      }

      if (recruitmentStatus === "reprovado") {
        setError("Seu processo seletivo foi encerrado.");
        setLoading(false);
        return;
      }

      if (data.forceChangePassword) {
        router.replace("/trocar-senha");
        return;
      }

      if (recruitmentStatus === "aprovado" && status === "active") {
        const destination = ROUTES[role];

        if (!destination) {
          setError(
            `Perfil de usuário não reconhecido${
              rawRole ? ` (${String(rawRole)})` : " (campo vazio)"
            }.`
          );
          setLoading(false);
          return;
        }

        router.replace(destination);
        return;
      }

      setError(
        `Seu cadastro está com o status: ${
          data.user?.recruitment_status || "indefinido"
        }.`
      );
      setLoading(false);
    } catch {
      setError("Erro de conexão com o servidor. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative flex min-h-screen w-full items-center justify-center">
        <Image
          src="/bg-login.png"
          alt=""
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/60" />

        <AnimatePresence>
          {showAlert && (
            <motion.div
              key="logout-alert"
              role="status"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed right-4 top-4 z-[99999]"
            >
              <div className="flex items-center gap-3 rounded-xl bg-green-500 px-5 py-3 text-white shadow-2xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm font-semibold">
                  Deslogado com sucesso!
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              key="error-alert"
              role="alert"
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="fixed right-5 top-5 z-[99999]"
            >
              <div className="flex max-w-md items-center gap-3 rounded-xl bg-red-500 px-5 py-3 text-white shadow-2xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M12 3l9 16H3L12 3z"
                  />
                </svg>
                <span className="text-sm font-semibold">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md">
          <h1 className="mb-8 text-center text-3xl font-bold text-white">
            Backoffice Maylon
          </h1>

          <form onSubmit={handleLogin} className="flex flex-col gap-2">
            <label htmlFor="matricula" className="text-white">
              Matrícula
            </label>

            <input
              id="matricula"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.replace(/\D/g, ""))}
              placeholder="Digite sua matrícula"
              autoComplete="username"
              required
              disabled={loading}
              className="w-full rounded-xl bg-white/20 p-3 text-sm text-white outline-none placeholder:text-white/70 focus:ring-2 focus:ring-teal-400 disabled:opacity-60"
            />

            <label htmlFor="password" className="mt-3 text-white">
              Senha
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
              disabled={loading}
              className="w-full rounded-xl bg-white/20 p-3 text-sm text-white outline-none placeholder:text-white/70 focus:ring-2 focus:ring-teal-400 disabled:opacity-60"
            />

            <div className="mb-4 mt-2 flex justify-end text-sm text-white">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="cursor-pointer transition hover:text-teal-300"
              >
                Esqueceu a senha?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-3xl p-3 font-semibold text-white transition ${
                loading
                  ? "cursor-not-allowed bg-gray-400"
                  : "cursor-pointer bg-teal-500 hover:bg-teal-600"
              }`}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="modal-recuperar-senha"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recuperar-titulo"
            className="fixed inset-0 z-[99999] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <h2
                id="recuperar-titulo"
                className="mb-2 text-lg font-bold text-gray-800"
              >
                Recuperar senha
              </h2>

              <p className="mb-5 text-sm text-gray-600">
                Para recuperar sua senha, entre em contato com o departamento de
                Recursos Humanos.
              </p>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full cursor-pointer rounded-lg bg-teal-600 p-3 text-sm font-semibold text-white transition hover:bg-teal-500"
              >
                Entendi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}