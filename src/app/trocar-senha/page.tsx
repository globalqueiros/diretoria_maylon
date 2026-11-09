"use client";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function Page() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "danger" | ""
  >("");
  function getPasswordStrength(password: string) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    switch (score) {
      case 0:
      case 1:
        return {
          label: "Muito Fraca",
          color: "bg-red-500",
          width: "20%",
        };
      case 2:
        return {
          label: "Fraca",
          color: "bg-orange-500",
          width: "40%",
        };
      case 3:
        return {
          label: "Média",
          color: "bg-yellow-500",
          width: "60%",
        };
      case 4:
        return {
          label: "Boa",
          color: "bg-blue-500",
          width: "80%",
        };
      default:
        return {
          label: "Forte",
          color: "bg-green-500",
          width: "100%",
        };
    }
  }
  const strength = getPasswordStrength(password);
  async function handleSave(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setMessage("");
    if (password.length < 8) {
      setMessageType("danger");
      setMessage("A senha deve possuir no mínimo 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setMessageType("danger");
      setMessage("As senhas não coincidem.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/reset-password", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erro ao alterar senha.");
      }
      setMessageType("success");
      setMessage("Senha alterada com sucesso!");
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setMessageType("danger");
      setMessage(error.message || "Erro ao alterar senha.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <Image
        src="/bg-login.png"
        alt="Background"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-lg">
        <h1 className="mb-6 text-center text-3xl font-bold text-white">
          Trocar Senha
        </h1>
        {message && (
          <div
            className={`mb-5 rounded-xl border p-3 text-sm font-medium ${messageType === "success"
              ? "border-green-400 bg-green-100 text-green-700"
              : "border-red-400 bg-red-100 text-red-700"
              }`}
          >
            {message}
          </div>
        )}
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-12 text-white placeholder:text-gray-300 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-sm text-white">
                <span>Força da senha</span>
                <span className="font-semibold">{strength.label}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className={`h-full transition-all duration-300 ${strength.color}`}
                  style={{ width: strength.width }}
                />
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p
                  className={
                    password.length >= 8
                      ? "text-green-400"
                      : "text-gray-300"
                  }
                >
                  ✔ Mínimo de 8 caracteres
                </p>
                <p
                  className={
                    /[A-Z]/.test(password)
                      ? "text-green-400"
                      : "text-gray-300"
                  }
                >
                  ✔ Uma letra maiúscula
                </p>
                <p
                  className={
                    /[a-z]/.test(password)
                      ? "text-green-400"
                      : "text-gray-300"
                  }
                >
                  ✔ Uma letra minúscula
                </p>
                <p
                  className={
                    /\d/.test(password)
                      ? "text-green-400"
                      : "text-gray-300"
                  }
                >
                  ✔ Um número
                </p>
                <p
                  className={
                    /[^A-Za-z0-9]/.test(password)
                      ? "text-green-400"
                      : "text-gray-300"
                  }
                >
                  ✔ Um caractere especial
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              Confirmar Senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirme sua senha"
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-12 text-white placeholder:text-gray-300 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400"
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-teal-500 py-3 text-lg font-semibold text-white transition hover:bg-teal-600 disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar Nova Senha"}
          </button>
        </form>
      </div>
    </div>
  );
}