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
  Star,
  Trash2,
  UserRound,
} from "lucide-react";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

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

/* =========================================================
   MÁSCARA DE TELEFONE
========================================================= */

function formatarTelefone(telefone?: string | null): string {
  if (!telefone) return "—";

  const numeros = String(telefone).replace(/\D/g, "");

  if (!numeros) return "—";

  // Remove código do país +55
  const numeroBR = numeros.startsWith("55") && numeros.length >= 12
    ? numeros.slice(2)
    : numeros;

  // Celular: (11) 98765-4321
  if (numeroBR.length === 11) {
    return numeroBR.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  // Fixo: (11) 3456-7890
  if (numeroBR.length === 10) {
    return numeroBR.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  // Se tiver 8 ou 9 números sem DDD
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

  // Caso não seja um número brasileiro reconhecido,
  // mantém o valor original.
  return telefone;
}

function getEmail(usuario: Usuario): string {
  return (
    usuario.email ||
    usuario.email_address ||
    usuario.mail ||
    "—"
  );
}

function numero(valor: unknown) {
  const n = Number(valor);

  return Number.isFinite(n) ? n : 0;
}

function getNome(usuario: Usuario) {
  return usuario.nome || usuario.name || "Usuário";
}

function getTelefone(usuario: Usuario) {
  return usuario.telefone || usuario.phone || "";
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

/* =========================================================
   IDENTIFICAR MOTORISTA OU PASSAGEIRO
========================================================= */

function identificarTela(usuario: Usuario) {
  const valor = String(
    usuario.tipo ?? usuario.type ?? ""
  )
    .trim()
    .toLowerCase();

  if (
    valor === "driver" ||
    valor === "drivers" ||
    valor === "motorista" ||
    valor.includes("driver") ||
    valor.includes("motorista")
  ) {
    return "driver";
  }

  return "customer";
}

/* =========================================================
   PÁGINA PRINCIPAL
========================================================= */

export default function VisualizacaoUsuarioPage() {
  const params = useParams();
  const router = useRouter();

  const id = Array.isArray(params?.id)
    ? params.id[0]
    : String(params?.id ?? "");

  const [usuario, setUsuario] = useState<Usuario | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!id) {
      setErro("ID do usuário não informado.");
      setLoading(false);
      return;
    }

    async function carregarUsuario() {
      try {
        setLoading(true);
        setErro("");

        const url = `/api/usuarios/${encodeURIComponent(id)}`;

        const response = await fetch(url, {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        const texto = await response.text();

        let data: ApiResponse = {};

        if (texto) {
          try {
            data = JSON.parse(texto);
          } catch {
            throw new Error(
              `A API /api/usuarios/${id} não retornou JSON. Status: ${response.status}.`
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

    carregarUsuario();
  }, [id]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div
          className="
      flex
      h-[400px]
      w-[550px]
      max-w-full
      flex-col
      items-center
      justify-center
      rounded-2xl
      border
      border-gray-200
      bg-white
      shadow-sm
    "
        >
          <div className="text-center">
            {/* Spinner */}
            <div
              className="
          mx-auto
          mb-5
          h-12
          w-12
          animate-spin
          rounded-full
          border-[5px]
          border-gray-200
          border-t-emerald-500
        "
            />

            {/* Texto */}
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
          <div
            className="
        flex
        min-h-[400px]
        w-full
        flex-col
        justify-center
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-8
        shadow-sm
      "
          >
            {/* Ícone */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <ShieldAlert
                  size={30}
                  className="text-red-500"
                />
              </div>
            </div>

            {/* Conteúdo */}
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">
                Não foi possível visualizar o usuário
              </h1>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Ocorreu um problema ao carregar os dados
                deste usuário. Verifique as informações e
                tente novamente.
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

            {/* Botões */}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => router.back()}
                className="
            flex h-10 items-center justify-center
            gap-2 rounded-lg
            border border-gray-300
            bg-white px-5
            text-sm font-medium text-gray-700
            transition hover:bg-gray-50
          "
              >
                <ArrowLeft size={16} />
                Voltar
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="
            flex h-10 items-center justify-center
            gap-2 rounded-lg
            bg-emerald-600 px-5
            text-sm font-semibold text-white
            transition hover:bg-emerald-700
          "
              >
                Tentar novamente
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            Não foi possível concluir a solicitação.
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     IDENTIFICA MOTORISTA OU PASSAGEIRO
  ======================================================= */

  const tela = identificarTela(usuario);

  if (tela === "driver") {
    return (
      <DriverView
        usuario={usuario}
        router={router}
      />
    );
  }

  return (
    <CustomerView
      usuario={usuario}
      router={router}
    />
  );
}

/* =========================================================
   PASSAGEIRO
   SOMENTE PRIMEIRO QUADRADO
========================================================= */

function CustomerView({
  usuario,
  router,
}: {
  usuario: Usuario;
  router: ReturnType<typeof useRouter>;
}) {
  const nome = getNome(usuario);
  const telefone = getTelefone(usuario);
  const email = getEmail(usuario);
  const foto = getFoto(usuario);
  const bloqueado = estaBloqueado(usuario);

  return (
    <main className="min-h-screen p-1">
      {/* HEADER */}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-white">
            USUÁRIO
          </p>
          <h1 className="text-2xl font-bold text-white">
            Passageiro #{usuario.id}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex cursor-pointer h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>

          <button
            type="button"
            className={`flex cursor-pointer h-9 items-center gap-2 rounded-md border px-4 text-sm font-medium transition ${bloqueado
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
            className="flex cursor-pointer h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <FileText size={16} />
            Activity log
          </button>

          <Status bloqueado={bloqueado} />

          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Edit3 size={16} />
            Edit
          </button>
        </div>
      </div>

      {/* PRIMEIRO QUADRADO */}

      <section className="w-full max-w-6xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Cabeçalho */}
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

        {/* Conteúdo */}
        <div className="p-6">
          <div className="flex flex-col gap-7 lg:flex-row">
            {/* Avatar */}
            <div className="flex shrink-0 justify-center lg:justify-start">
              <div className="relative">
                <Avatar
                  nome={nome}
                  foto={foto}
                />

                {/* Indicador online/ativo */}
                <span
                  className={`absolute bottom-30 right-2 h-4 w-4 rounded-full border-2 border-white ${bloqueado ? "bg-red-500" : "bg-emerald-500"
                    }`}
                />
              </div>
            </div>

            {/* Informações */}
            <div className="min-w-0 flex-1">
              {/* Nome + status */}
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
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${bloqueado
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

              {/* Dados */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Telefone */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition hover:border-emerald-100 hover:bg-emerald-50/30">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                      <Phone size={16} />
                    </div>

                    <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Telefone
                    </span>
                  </div>

                  <p className="break-all text-sm font-medium text-gray-800">
                    {formatarTelefone(telefone)}
                  </p>
                </div>

                {/* E-mail */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition hover:border-emerald-100 hover:bg-emerald-50/30">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                      <Mail size={16} />
                    </div>

                    <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      E-mail
                    </span>
                  </div>

                  <p className="break-all text-sm font-medium text-gray-800">
                    {email}
                  </p>
                </div>

                {/* Localização */}
                {(usuario.cidade || usuario.estado) && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition hover:border-emerald-100 hover:bg-emerald-50/30">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                        <MapPin size={16} />
                      </div>

                      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Localização
                      </span>
                    </div>

                    <p className="text-sm font-medium text-gray-800">
                      {usuario.cidade || ""}
                      {usuario.cidade && usuario.estado ? " - " : ""}
                      {usuario.estado || ""}
                    </p>
                  </div>
                )}

                {/* Cadastro */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition hover:border-emerald-100 hover:bg-emerald-50/30">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                      <Clock3 size={16} />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Cadastro
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    {formatarData(usuario.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   MOTORISTA
   PRIMEIRO + SEGUNDO QUADRADO
========================================================= */

function DriverView({
  usuario,
  router,
}: {
  usuario: Usuario;
  router: ReturnType<typeof useRouter>;
}) {
  const nome = getNome(usuario);
  const telefone = getTelefone(usuario);
  const email = getEmail(usuario);
  const foto = getFoto(usuario);
  const bloqueado = estaBloqueado(usuario);

  const rating = numero(
    usuario.rating ?? usuario.avaliacao
  );

  const servico =
    usuario.servico ||
    usuario.service ||
    "Ride Request, Parcel (Capacity-Unlimited)";

  return (
    <main className="min-h-screen p-1">
      {/* HEADER */}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">
          Driver #{usuario.id}
        </h1>

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
            className="flex h-9 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-500 transition hover:bg-red-100"
          >
            <Trash2 size={16} />
            Delete
          </button>

          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Clock3 size={16} />
            Activity log
          </button>

          <Status bloqueado={bloqueado} />

          <button
            type="button"
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Suspend Driver
          </button>

          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Edit3 size={16} />
            Edit
          </button>
        </div>
      </div>

      {/* PRIMEIRO QUADRADO */}

      <section className="w-full max-w-6xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <Title
          icon={<UserRound size={19} />}
          title="Driver Information"
        />

        <div className="flex flex-col gap-6 md:flex-row">
          <Avatar
            nome={nome}
            foto={foto}
          />

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                {nome}
              </h2>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${bloqueado
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

            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-md bg-emerald-500 px-2 py-1 text-xs font-semibold text-white">
                No Level Found
              </span>

              <span className="text-sm font-medium text-gray-600">
                {rating.toFixed(1)}
              </span>

              <Star
                size={17}
                className="fill-orange-400 text-orange-400"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">
              <InfoLine
                icon={<Phone size={16} />}
                value={formatarTelefone(telefone)}
              />

              <InfoLine
                icon={<Mail size={16} />}
                value={email}
              />

              <InfoLine
                icon={<UserRound size={16} />}
                value={servico}
              />

              {usuario.ref_code && (
                <InfoLine
                  icon={<FileText size={16} />}
                  value={`Ref. Code: ${usuario.ref_code}`}
                />
              )}

              <InfoLine
                icon={<Clock3 size={16} />}
                value={`Cadastro: ${formatarData(
                  usuario.created_at
                )}`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SEGUNDO QUADRADO
          SOMENTE MOTORISTA */}

      <section className="mt-6 w-full max-w-6xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {/* DRIVER RATE */}

          <div>
            <Title
              icon={<UserRound size={19} />}
              title="Driver rate info"
            />

            <div className="mb-7 flex items-center gap-3">
              <span className="text-sm font-medium text-emerald-500">
                Average Active Rate/Day
              </span>

              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{
                    width: "0%",
                  }}
                />
              </div>

              <span className="text-xs font-medium text-emerald-500">
                0%
              </span>
            </div>

            <div className="rounded-xl border border-gray-200 p-5">
              <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
                <Circle
                  value="0 R$"
                  label="Avg. earning value"
                />

                <Circle
                  value="0%"
                  label="Positive Review Rate"
                  blue
                />

                <Circle
                  value="0%"
                  label="Success Rate"
                />

                <Circle
                  value="0%"
                  label="Cancellation Rate"
                  red
                />

                <Circle
                  value="0%"
                  label="Today Idle Hour Rate"
                  orange
                />
              </div>
            </div>
          </div>

          {/* DRIVER DETAILS */}

          <div>
            <Title
              icon={<UserRound size={19} />}
              title="Driver Details"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card
                icon={<Phone size={19} />}
                title="Telefone"
                value={formatarTelefone(telefone)}
              />

              <Card
                icon={<Mail size={19} />}
                title="E-mail"
                value={email}
              />

              <Card
                icon={<Clock3 size={19} />}
                title="Cadastro"
                value={formatarData(
                  usuario.created_at
                )}
              />

              <Card
                icon={<MapPin size={19} />}
                title="Localização"
                value={
                  usuario.cidade || usuario.estado
                    ? `${usuario.cidade || ""}${usuario.cidade &&
                      usuario.estado
                      ? " - "
                      : ""
                    }${usuario.estado || ""}`
                    : "—"
                }
              />
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
        className={`relative h-6 w-11 rounded-full ${bloqueado
          ? "bg-gray-300"
          : "bg-emerald-500"
          }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow ${bloqueado
            ? "left-1"
            : "left-6"
            }`}
        />
      </div>

      <span
        className={`text-xs font-medium ${bloqueado
          ? "text-red-500"
          : "text-emerald-600"
          }`}
      >
        {bloqueado ? "Bloqueado" : "Ativo"}
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

/* =========================================================
   TITLE
========================================================= */

function Title({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-2 text-emerald-600">
      {icon}

      <h2 className="font-semibold">
        {title}
      </h2>
    </div>
  );
}

/* =========================================================
   INFO LINE
========================================================= */

function InfoLine({
  icon,
  value,
}: {
  icon: ReactNode;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="shrink-0 text-gray-400">
        {icon}
      </span>

      <span className="truncate text-sm text-gray-700">
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   CIRCLE
========================================================= */

function Circle({
  value,
  label,
  blue = false,
  red = false,
  orange = false,
}: {
  value: string;
  label: string;
  blue?: boolean;
  red?: boolean;
  orange?: boolean;
}) {
  const classe = red
    ? "text-red-500"
    : orange
      ? "text-orange-500"
      : blue
        ? "text-blue-500"
        : "text-emerald-500";

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-[6px] border-gray-100">
        <span
          className={`text-xs font-semibold ${classe}`}
        >
          {value}
        </span>
      </div>

      <p
        className={`text-xs font-medium ${classe}`}
      >
        {label}
      </p>
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