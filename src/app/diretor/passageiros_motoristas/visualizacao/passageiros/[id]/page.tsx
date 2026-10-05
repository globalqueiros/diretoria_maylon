"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Edit3,
  FileText,
  Lock,
  LockOpen,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Usuario = {
  id: string;

  name?: string | null;
  nome?: string | null;

  email?: string | null;
  email_address?: string | null;
  mail?: string | null;

  phone?: string | null;
  telefone?: string | null;

  type?: string | null;
  tipo?: string | null;

  is_active?: number | boolean | null;
  is_temp_blocked?: number | boolean | null;
  bloqueado?: boolean | null;
  blocked_at?: string | null;

  created_at?: string | null;

  foto?: string | null;
  foto_url?: string | null;
  avatar?: string | null;

  cidade?: string | null;
  estado?: string | null;
};

type ApiResponse = {
  usuario?: Usuario;
  data?: Usuario;
  user?: Usuario;

  error?: string;
  message?: string;
};

function formatarData(data?: string | null) {
  if (!data) return "—";

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return data;
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatarTelefone(
  telefone?: string | null
): string {
  if (!telefone) return "—";

  const numeros = String(telefone).replace(
    /\D/g,
    ""
  );

  if (!numeros) return "—";

  const numeroBR =
    numeros.startsWith("55") &&
    numeros.length >= 12
      ? numeros.slice(2)
      : numeros;

  if (numeroBR.length === 11) {
    return numeroBR.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  if (numeroBR.length === 10) {
    return numeroBR.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  if (numeroBR.length === 9) {
    return numeroBR.replace(
      /^(\d{5})(\d{4})$/,
      "$1-$2"
    );
  }

  if (numeroBR.length === 8) {
    return numeroBR.replace(
      /^(\d{4})(\d{4})$/,
      "$1-$2"
    );
  }

  return telefone;
}

function getNome(usuario: Usuario) {
  return (
    usuario.nome ||
    usuario.name ||
    "Usuário"
  );
}

function getEmail(usuario: Usuario) {
  return (
    usuario.email ||
    usuario.email_address ||
    usuario.mail ||
    "—"
  );
}

function getTelefone(usuario: Usuario) {
  return (
    usuario.telefone ||
    usuario.phone ||
    ""
  );
}

function getFoto(usuario: Usuario) {
  return (
    usuario.foto_url ||
    usuario.foto ||
    usuario.avatar ||
    ""
  );
}

function estaBloqueado(usuario: Usuario) {
  return (
    usuario.bloqueado === true ||
    Number(usuario.is_active) === 0 ||
    Number(usuario.is_temp_blocked) === 1 ||
    Boolean(usuario.blocked_at)
  );
}

export default function PassageiroPage() {
  const params = useParams();
  const router = useRouter();

  const id = Array.isArray(params?.id)
    ? params.id[0]
    : String(params?.id ?? "");

  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!id) {
      setErro("ID não informado.");
      setLoading(false);
      return;
    }

    async function carregar() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/usuarios/${encodeURIComponent(id)}`,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const texto = await response.text();

        let data: ApiResponse = {};

        try {
          data = texto
            ? JSON.parse(texto)
            : {};
        } catch {
          throw new Error(
            "A API não retornou JSON."
          );
        }

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.message ||
              `Erro ${response.status}`
          );
        }

        const encontrado =
          data.usuario ??
          data.data ??
          data.user;

        if (!encontrado) {
          throw new Error(
            "Usuário não encontrado."
          );
        }

        setUsuario(encontrado);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar usuário."
        );
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-500" />

          <p className="text-sm text-gray-500">
            Carregando passageiro...
          </p>
        </div>
      </main>
    );
  }

  if (erro || !usuario) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <ShieldAlert
              size={30}
              className="text-red-500"
            />
          </div>

          <h1 className="text-xl font-bold text-gray-900">
            Não foi possível visualizar o passageiro
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {erro}
          </p>

          <button
            onClick={() => router.back()}
            className="mt-6 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Voltar
          </button>
        </div>
      </main>
    );
  }

  const nome = getNome(usuario);
  const telefone = getTelefone(usuario);
  const email = getEmail(usuario);
  const foto = getFoto(usuario);
  const bloqueado = estaBloqueado(usuario);

  return (
    <main className="min-h-screen p-1">
      {/* HEADER */}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white">
            USUÁRIO
          </p>

          <h1 className="text-2xl font-bold text-white">
            Passageiro #{usuario.id}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => router.back()}
            className="flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>

          <button
            className={`flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium ${
              bloqueado
                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                : "border-red-200 bg-red-50 text-red-500"
            }`}
          >
            {bloqueado ? (
              <>
                <LockOpen size={16} />
                Desbloquear
              </>
            ) : (
              <>
                <Lock size={16} />
                Bloquear
              </>
            )}
          </button>

          <button className="flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700">
            <FileText size={16} />
            Activity log
          </button>

          <Status bloqueado={bloqueado} />

          <button className="flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700">
            <Edit3 size={16} />
            Edit
          </button>
        </div>
      </div>

      {/* CARD */}

      <section className="w-full max-w-6xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <UserRound size={18} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Informações do Passageiro
            </h2>

            <p className="text-xs text-gray-400">
              Dados cadastrais e informações de contato
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-7 lg:flex-row">
            <div className="flex shrink-0 justify-center lg:justify-start">
              <Avatar
                nome={nome}
                foto={foto}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {nome}
                  </h3>

                  <p className="mt-1 text-xs text-gray-400">
                    ID: {usuario.id}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    bloqueado
                      ? "bg-red-50 text-red-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {bloqueado ? (
                    <>
                      <Lock size={13} />
                      Bloqueado
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} />
                      Ativo
                    </>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoCard
                  icon={<Phone size={16} />}
                  title="Telefone"
                  value={formatarTelefone(
                    telefone
                  )}
                />

                <InfoCard
                  icon={<Mail size={16} />}
                  title="E-mail"
                  value={email}
                />

                {(usuario.cidade ||
                  usuario.estado) && (
                  <InfoCard
                    icon={<MapPin size={16} />}
                    title="Localização"
                    value={`${usuario.cidade || ""}${
                      usuario.cidade &&
                      usuario.estado
                        ? " - "
                        : ""
                    }${
                      usuario.estado || ""
                    }`}
                  />
                )}

                <InfoCard
                  icon={<Clock3 size={16} />}
                  title="Cadastro"
                  value={formatarData(
                    usuario.created_at
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Status({
  bloqueado,
}: {
  bloqueado: boolean;
}) {
  return (
    <div className="flex h-9 items-center gap-3 rounded-md border border-gray-300 bg-white px-3">
      <span className="text-sm text-gray-700">
        Status
      </span>

      <div
        className={`relative h-6 w-11 rounded-full ${
          bloqueado
            ? "bg-gray-300"
            : "bg-emerald-500"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow ${
            bloqueado
              ? "left-1"
              : "left-6"
          }`}
        />
      </div>

      <span
        className={`text-xs font-medium ${
          bloqueado
            ? "text-red-500"
            : "text-emerald-600"
        }`}
      >
        {bloqueado
          ? "Bloqueado"
          : "Ativo"}
      </span>
    </div>
  );
}

function Avatar({
  nome,
  foto,
}: {
  nome: string;
  foto: string;
}) {
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();

  if (foto) {
    return (
      <div className="h-36 w-36 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        <img
          src={foto}
          alt={nome}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-xl bg-gray-100">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-500">
        {iniciais || (
          <UserRound size={38} />
        )}
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition hover:border-emerald-100 hover:bg-emerald-50/30">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
          {icon}
        </div>

        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {title}
        </span>
      </div>

      <p className="break-all text-sm font-medium text-gray-800">
        {value}
      </p>
    </div>
  );
}
