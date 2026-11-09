"use client";
import Image from "next/image";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EyeOff, Eye } from "lucide-react";

export default function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [success, setSuccess] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState<"fraca" | "média" | "forte" | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const checkStrength = (value: string) => {
    let score = 0;
    if (value.length >= 6) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    if (score <= 1) return "fraca";
    if (score === 2 || score === 3) return "média";
    return "forte";
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setStrength(checkStrength(value));
    setError("");
  };

  const handleReset = async () => {
    if (loading || success) return;
    setError("");
    if (!token) {
      setError("Token inválido");
      return;
    }

    if (!password || !confirm) {
      setError("Preencha todos os campos");
      return;
    }

    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao redefinir senha");
        return;
      }
      setSuccess("Senha redefinida com sucesso!");

      setTimeout(() => {
        router.push("/login");
      }, 5000);

    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <Image
        src="/bg-login.png"
        alt="Background"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/70" />

      {success && (
        <div className="fixed top-5 right-5 z-[99999]">
          <div className="flex items-center gap-3 bg-green-500 text-white px-5 py-3 rounded-xl shadow-2xl animate-slideIn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
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
              {success}
            </span>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
        <h1 className="text-xl text-white font-bold mb-6 text-center">
          Redefinir senha
        </h1>
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-red-500 bg-red-500/10 text-red-400 text-sm">
            {error}
          </div>
        )}
        <label className="text-white">Senha</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nova senha"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            className="w-full p-3 text-sm mt-2 mb-3 rounded-xl bg-white/20 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-teal-400 mb-2 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white cursor-pointer"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {password && (
          <div className="mb-2">
            <p className="text-xs text-white">
              Força da senha:
              <span
                className={`ml-1 ${
                  strength === "fraca"
                    ? "text-red-400"
                    : strength === "média"
                    ? "text-yellow-400"
                    : "text-green-400"
                }`}
              >
                {strength}
              </span>
            </p>
          </div>
        )}
        <label className="text-white">Confirmar Senha</label>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Confirmar senha"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setError("");
          }}
          className="w-full p-3 text-sm mt-2 rounded-xl bg-white/20 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-teal-400 mb-4"
        />
        <button
          onClick={handleReset}
          disabled={loading || !!success}
          className={`w-full p-3 rounded-3xl mt-3 font-semibold text-white flex items-center justify-center transition ${
            loading || success
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-teal-500 hover:bg-teal-600"
          }`}
        >
          {loading ? "Salvando..." : "Redefinir Senha"}
        </button>
      </div>
    </div>
  );
}