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

import Motorista from "../motoristas/Motorista";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

/* =========================================================
   TIPOS
========================================================= */

type Usuario = {
  id: string;

  name?: string | null;
  nome?: string | null;

  email?: string | null;
  email_address?: string | null;
  mail?: string | null;
  email_usuario?: string | null;

  phone?: string | null;
  telefone?: string | null;

  type?: string | null;
  tipo?: string | null;

  ref_code?: string | null;

  is_active?: number | boolean | null;
  is_temp_blocked?: number | boolean | null;
  bloqueado?: boolean | null;
  blocked_at?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  foto?: string | null;
  foto_url?: string | null;
  avatar?: string | null;

  cidade?: string | null;
  estado?: string | null;

  servico?: string | null;
  service?: string | null;

  rating?: number | string | null;
  avaliacao?: number | string | null;
};

type ApiResponse = {
  sucesso?: boolean;

  usuario?: Usuario;
  data?: Usuario;
  user?: Usuario;

  error?: string;
  message?: string;
};

/* =========================================================
   HELPERS
========================================================= */

function formatarData(
  data?: string | null
): string {
  if (!data) {
    return "—";
  }

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
  if (!telefone) {
    return "—";
  }

  const numeros = String(telefone).replace(
    /\D/g,
    ""
  );

  if (!numeros) {
    return "—";
  }

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

function getNome(
  usuario: Usuario
): string {
  return (
    usuario.nome ||
    usuario.name ||
    "Usuário"
  );
}

function getEmail(
  usuario: Usuario
): string {
  return (
    usuario.email ||
    usuario.email_address ||
    usuario.mail ||
    usuario.email_usuario ||
    "—"
  );
}

function getTelefone(
  usuario: Usuario
): string {
  return (
    usuario.telefone ||
    usuario.phone ||
    ""
  );
}

function getFoto(
  usuario: Usuario
): string {
  return (
    usuario.foto_url ||
    usuario.foto ||
    usuario.avatar ||
    ""
  );
}

function estaBloqueado(
  usuario: Usuario
): boolean {
  return (
    usuario.bloqueado === true ||
    Number(usuario.is_active) === 0 ||
    Number(usuario.is_temp_blocked) === 1 ||
    Boolean(usuario.blocked_at)
  );
}

/* =========================================================
   IDENTIFICAR TIPO
========================================================= */

type TipoTela =
  | "driver"
  | "customer";

function identificarTela(
  usuario: Usuario
): TipoTela {
  const valor = String(
    usuario.tipo ??
      usuario.type ??
      ""
  )
    .trim()
    .toLowerCase();

  const ehMotorista =
    valor === "driver" ||
    valor === "drivers" ||
    valor === "motorista" ||
    valor === "motoristas" ||
    valor.includes("driver") ||
    valor.includes("motorista");

  return ehMotorista
    ? "driver"
    : "customer";
}

/* =========================================================
   PÁGINA
========================================================= */

export default function VisualizacaoUsuarioClient() {
  const params = useParams();
  const router = useRouter();

  const id = Array.isArray(params?.id)
    ? params.id[0]
    : String(params?.id ?? "");

  const [
    usuario,
    setUsuario,
  ] = useState<Usuario | null>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  /* =======================================================
     BUSCAR USUÁRIO
  ======================================================= */

  useEffect(() => {
    if (!id) {
      setErro(
        "ID do usuário não informado."
      );

      setLoading(false);

      return;
    }

    let ativo = true;

    async function carregarUsuario() {
      try {
        setLoading(true);
        setErro("");

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

        const texto =
          await response.text();

        let data: ApiResponse = {};

        if (texto) {
          try {
            data = JSON.parse(texto);
          } catch {
            throw new Error(
              `A API não retornou JSON. Status: ${response.status}.`
            );
          }
        }

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.message ||
              `Erro ${response.status} ao buscar usuário.`
          );
        }

        const encontrado =
          data.usuario ??
          data.data ??
          data.user;

        if (!encontrado) {
          throw new Error(
            "A API respondeu, mas não enviou os dados do usuário."
          );
        }

        if (!ativo) {
          return;
        }

        setUsuario(encontrado);
      } catch (error) {
        if (!ativo) {
          return;
        }

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar usuário."
        );
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregarUsuario();

    return () => {
      ativo = false;
    };
  }, [id]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="flex h-[400px] w-[550px] max-w-full flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="text-center">

            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-[5px] border-gray-200 border-t-emerald-500" />

            <p className="text-sm font-medium text-gray-500">
              Carregando usuário...
            </p>

          </div>

        </div>
      </main>
    );
  }

  /* =======================================================
     ERRO
  ======================================================= */

  if (erro || !usuario) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">

        <div className="w-[550px] max-w-full">

          <div className="flex min-h-[400px] w-full flex-col justify-center rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

            <div className="mb-6 flex justify-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">

                <ShieldAlert
                  size={30}
                  className="text-red-500"
                />

              </div>

            </div>

            <div className="text-center">

              <h1 className="text-xl font-bold text-gray-900">
                Não foi possível visualizar o usuário
              </h1>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Ocorreu um problema ao carregar
                os dados deste usuário.
              </p>

              {erro && (
                <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-left">

                  <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                    Detalhes do erro
                  </p>

                  <p className="mt-1 break-words text-sm text-red-700">
                    {erro}
                  </p>

                </div>
              )}

            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">

              <button
                type="button"
                onClick={() => router.back()}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <ArrowLeft size={16} />
                Voltar
              </button>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Tentar novamente
              </button>

            </div>

          </div>

        </div>

      </main>
    );
  }

  /* =======================================================
     IDENTIFICAR TELA
  ======================================================= */

  const tela =
    identificarTela(usuario);

  /* =======================================================
     MOTORISTA
  ======================================================= */

  if (tela === "driver") {
    return (
      <Motorista
        usuario={usuario}
      />
    );
  }

  /* =======================================================
     PASSAGEIRO
  ======================================================= */

  return (
    <CustomerView
      usuario={usuario}
    />
  );
}

/* =========================================================
   PASSAGEIRO
========================================================= */

function CustomerView({
  usuario,
}: {
  usuario: Usuario;
}) {
  const router = useRouter();

  const nome = getNome(usuario);
  const telefone =
    getTelefone(usuario);
  const email = getEmail(usuario);
  const foto = getFoto(usuario);
  const bloqueado =
    estaBloqueado(usuario);

  const localizacao =
    usuario.cidade ||
    usuario.estado
      ? `${usuario.cidade || ""}${
          usuario.cidade &&
          usuario.estado
            ? " - "
            : ""
        }${usuario.estado || ""}`
      : "—";

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">

      {/* HEADER */}

      <div className="mx-auto mb-5 flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">

        <div>

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            PASSAGEIRO
          </p>

          <h1 className="text-2xl font-bold text-gray-900">
            Passageiro #{usuario.id}
          </h1>

        </div>

        <div className="flex flex-wrap items-center gap-2">

          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>

          <button
            type="button"
            className={`flex h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium transition ${
              bloqueado
                ? "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                : "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
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

          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <FileText size={16} />
            Activity log
          </button>

          <Status
            bloqueado={bloqueado}
          />

          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Edit3 size={16} />
            Edit
          </button>

        </div>

      </div>

      {/* INFORMAÇÕES */}

      <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">

          <div className="flex items-center gap-2">

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

        </div>

        <div className="p-6">

          <div className="flex flex-col gap-7 lg:flex-row">

            {/* AVATAR */}

            <div className="flex shrink-0 justify-center lg:justify-start">

              <div className="relative">

                <Avatar
                  nome={nome}
                  foto={foto}
                />

                <span
                  className={`absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-white ${
                    bloqueado
                      ? "bg-red-500"
                      : "bg-emerald-500"
                  }`}
                />

              </div>

            </div>

            {/* DADOS */}

            <div className="min-w-0 flex-1">

              <div className="mb-6 flex flex-wrap items-center gap-3">

                <div>

                  <h3 className="text-xl font-bold tracking-tight text-gray-900">
                    {nome}
                  </h3>

                  <p className="mt-1 text-xs text-gray-400">
                    ID: {usuario.id}
                  </p>

                </div>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    bloqueado
                      ? "bg-red-50 text-red-600 ring-1 ring-red-100"
                      : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
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

                <Card
                  icon={<Phone size={16} />}
                  title="Telefone"
                  value={formatarTelefone(
                    telefone
                  )}
                />

                <Card
                  icon={<Mail size={16} />}
                  title="E-mail"
                  value={email}
                />

                <Card
                  icon={<MapPin size={16} />}
                  title="Localização"
                  value={localizacao}
                />

                <Card
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

/* =========================================================
   STATUS
========================================================= */

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

/* =========================================================
   AVATAR
========================================================= */

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
    .map(
      (item) => item[0]
    )
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

/* =========================================================
   CARD
========================================================= */

function Card({
  icon,
  title,
  value,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-sm ${className}`}
    >

      <div className="mb-3 flex items-center gap-2 text-emerald-600">

        {icon}

        <span className="text-sm font-semibold text-gray-900">
          {title}
        </span>

      </div>

      <p className="break-words text-sm text-gray-700">
        {value}
      </p>

    </div>
  );
}
