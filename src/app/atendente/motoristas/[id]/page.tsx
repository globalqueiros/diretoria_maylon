<<<<<<< HEAD
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Lock,
  LockOpen,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  UserX,
  X,
} from "lucide-react";

type Passageiro = {
  id: string;
  passsageiro_tea: boolean | number | string | null;
  full_name: string | null;
  user_level_id: number | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  identification_number: string | null;
  identification_type: string | null;
  identification_image: string | null;
  old_identification_image: string | null;
  other_documents: string | null;
  profile_image: string | null;
  phone_verified_at: string | null;
  email_verified_at: string | null;
  loyalty_points: number | null;
  ref_code: string | null;
  user_type: string | number | null;
  role_id: number | null;
  is_active: boolean | number | string | null;
  current_language_key: string | null;
  deleted_at: string | null;
  created_at: string | null;
};

type Corrida = {
  id: string;
  origem: string | null;
  destino: string | null;
  motorista: string | null;
  valor: number | string | null;
  status: string | null;
  data: string | null;
};

const CORRIDAS_PER_PAGE = 35;

function isActive(passageiro: Passageiro) {
  return (
    passageiro.is_active === true ||
    passageiro.is_active === 1 ||
    String(passageiro.is_active).toLowerCase() === "1" ||
    String(passageiro.is_active).toLowerCase() === "true"
  );
}

function getPassengerName(passageiro: Passageiro) {
  if (passageiro.full_name?.trim()) {
    return passageiro.full_name.trim();
  }

  const name = [
    passageiro.first_name?.trim(),
    passageiro.last_name?.trim(),
  ]
    .filter(Boolean)
    .join(" ");

  return name || "Passageiro sem nome";
}

function formatDate(date: string | null) {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(date: string | null) {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number | string | null) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numero =
    typeof value === "string" ? Number(value.replace(",", ".")) : value;

  if (Number.isNaN(numero)) {
    return "-";
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

function formatCPF(value: string | null) {
  if (!value) return "-";

  const numbers = onlyNumbers(value);

  if (numbers.length !== 11) {
    return value;
  }

  return numbers.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    "$1.$2.$3-$4"
  );
}

function formatDocument(
  value: string | null,
  type: string | null
) {
  if (!value) return "-";

  const normalizedType = String(type || "")
    .trim()
    .toLowerCase();

  const isCpf =
    normalizedType.includes("cpf") ||
    onlyNumbers(value).length === 11;

  if (isCpf) {
    return formatCPF(value);
  }

  return value;
}

function formatPhone(value: string | null) {
  if (!value) return "-";

  const numbers = onlyNumbers(value);

  if (numbers.length === 11) {
    return numbers.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  if (numbers.length === 10) {
    return numbers.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  if (numbers.length === 13 && numbers.startsWith("55")) {
    const withoutCountry = numbers.slice(2);

    if (withoutCountry.length === 11) {
      return withoutCountry.replace(
        /^(\d{2})(\d{5})(\d{4})$/,
        "($1) $2-$3"
      );
    }
  }

  return value;
}

function statusBadgeClass(status: string | null) {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("conclu") || normalized.includes("finaliz")) {
    return "bg-green-100 text-green-700";
  }

  if (normalized.includes("cancel")) {
    return "bg-red-100 text-red-700";
  }

  if (normalized.includes("andamento") || normalized.includes("progresso")) {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default function PassageiroDetalhesPage() {
  const params = useParams();
  const router = useRouter();

  const id = useMemo(() => {
    const value = params?.id;

    if (Array.isArray(value)) {
      return value[0] || "";
    }

    return value ? String(value) : "";
  }, [params]);

  const [passageiro, setPassageiro] =
    useState<Passageiro | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  const [corridas, setCorridas] = useState<Corrida[]>([]);
  const [loadingCorridas, setLoadingCorridas] = useState(true);
  const [errorCorridas, setErrorCorridas] = useState("");
  const [corridasPage, setCorridasPage] = useState(1);

  const fetchPassageiro = useCallback(async () => {
    if (!id) {
      setError("ID do passageiro não informado.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/passageiros/${encodeURIComponent(id)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
          "Não foi possível carregar os dados do passageiro."
        );
      }

      const passengerData = data?.passageiro ?? data;

      if (!passengerData) {
        throw new Error("Passageiro não encontrado.");
      }

      setPassageiro(passengerData);
    } catch (error) {
      console.error("Erro ao buscar passageiro:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os dados do passageiro."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchCorridas = useCallback(async () => {
    if (!id) {
      setLoadingCorridas(false);
      return;
    }

    try {
      setLoadingCorridas(true);
      setErrorCorridas("");
      const response = await fetch(
        `/api/passageiros/${encodeURIComponent(id)}/corridas`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Não foi possível carregar as corridas."
        );
      }

      const lista: Corrida[] = data?.corridas ?? data ?? [];

      setCorridas(Array.isArray(lista) ? lista : []);
      setCorridasPage(1);
    } catch (error) {
      console.error("Erro ao buscar corridas:", error);

      setErrorCorridas(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as corridas."
      );
    } finally {
      setLoadingCorridas(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPassageiro();
    fetchCorridas();
  }, [fetchPassageiro, fetchCorridas]);

  const totalCorridasPages = Math.max(
    1,
    Math.ceil(corridas.length / CORRIDAS_PER_PAGE)
  );

  const paginatedCorridas = useMemo(() => {
    const start = (corridasPage - 1) * CORRIDAS_PER_PAGE;
    return corridas.slice(start, start + CORRIDAS_PER_PAGE);
  }, [corridas, corridasPage]);

  useEffect(() => {
    if (corridasPage > totalCorridasPages) {
      setCorridasPage(totalCorridasPages);
    }
  }, [corridasPage, totalCorridasPages]);

  const handleUnlockRequest = async () => {
    if (!passageiro) return;

    if (!unlockReason.trim()) {
      return;
    }

    try {
      setSendingRequest(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setShowUnlockModal(false);
      setUnlockReason("");
    } catch (error) {
      console.error(
        "Erro ao solicitar desbloqueio:",
        error
      );
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">
            Aguarde, carregando dados do passageiro...
          </p>
        </div>
      </div>
    );
  }

  if (error || !passageiro) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-6">
            <Link
              href="/atendente/passageiros"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-white/80"
            >
              <ArrowLeft size={18} />
              Voltar para passageiros
            </Link>
          </div>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <UserX size={28} />
            </div>

            <h1 className="mt-4 text-xl font-bold text-red-900">
              Passageiro não encontrado
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error ||
                "Não foi possível localizar este passageiro."}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/atendente/passageiros")
              }
              className="mt-6 inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const active = isActive(passageiro);
  const name = getPassengerName(passageiro);

  return (
    <>
      <div className="min-h-screen">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/atendente/passageiros"
                className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white"
              >
                <ArrowLeft size={18} />
                Voltar para passageiros
              </Link>

              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Detalhes do passageiro
              </h1>

              <p className="mt-1 text-sm text-white/80">
                Consulte as informações cadastrais do passageiro.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchPassageiro}
                disabled={loading}
                title="Atualizar dados"
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#35a989] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  className={loading ? "animate-spin" : ""}
                />
                Atualizar
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!active) {
                    setShowUnlockModal(true);
                  }
                }}
                disabled={active}
                className={`inline-flex h-11 items-center gap-2 self-start rounded-xl px-4 text-sm font-bold transition sm:self-auto ${active
                  ? "cursor-default bg-green-100 text-green-700"
                  : "cursor-pointer bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
              >
                {active ? (
                  <LockOpen size={18} />
                ) : (
                  <Lock size={18} />
                )}

                {active
                  ? "Passageiro Ativo"
                  : "Passageiro Bloqueado"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="h-28 bg-gradient-to-r from-[#35a989] via-[#2f9d80] to-[#58d68d]" />

                <div className="px-6 pb-6">
                  <div className="-mt-14 flex justify-center">
                    <div
                      className={`flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-4 border-white text-3xl font-bold shadow-lg ${active
                        ? "bg-[#35a989]/10 text-[#35a989]"
                        : "bg-red-100 text-red-700"
                        }`}
                    >
                      {passageiro.profile_image ? (
                        <img
                          src={passageiro.profile_image}
                          alt={name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <h2 className="text-xl font-bold text-slate-900">
                      {name}
                    </h2>

                    <p className="mt-1 break-all text-sm text-slate-500">
                      ID {passageiro.id}
                    </p>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                        <Mail size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-400">
                          E-mail
                        </p>

                        <p className="truncate text-sm font-semibold text-slate-700">
                          {passageiro.email || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                        <Phone size={18} />
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Telefone
                        </p>
                        <p className="text-sm font-semibold text-slate-700">
                          {formatPhone(passageiro.phone)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <ShieldCheck
                    size={19}
                    className="text-[#35a989]"
                  />
                  Situação da conta
                </h3>

                <div
                  className={`mt-4 rounded-2xl border p-4 ${active
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {active ? (
                      <CheckCircle2
                        size={22}
                        className="text-green-600"
                      />
                    ) : (
                      <UserX
                        size={22}
                        className="text-red-600"
                      />
                    )}

                    <div>
                      <p
                        className={`text-sm font-bold ${active
                          ? "text-green-800"
                          : "text-red-800"
                          }`}
                      >
                        {active
                          ? "Conta ativa"
                          : "Conta bloqueada"}
                      </p>

                      <p
                        className={`mt-0.5 text-xs ${active
                          ? "text-green-700"
                          : "text-red-700"
                          }`}
                      >
                        {active
                          ? "O passageiro está habilitado para utilizar a plataforma."
                          : "O passageiro está impedido de utilizar a plataforma."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon={<CalendarDays size={21} />}
                  label="Cadastro"
                  value={formatDate(passageiro.created_at)}
                  iconClass="bg-[#35a989]/10 text-[#35a989]"
                />

                <StatCard
                  icon={<FileText size={21} />}
                  label="Documento"
                  value={formatDocument(
                    passageiro.identification_number,
                    passageiro.identification_type
                  )}
                  iconClass="bg-blue-50 text-blue-600"
                />

                <StatCard
                  icon={<User size={21} />}
                  label="Tipo de documento"
                  value={passageiro.identification_type}
                  iconClass="bg-purple-50 text-purple-600"
                />

                <StatCard
                  icon={<ShieldCheck size={21} />}
                  label="Verificação"
                  value={
                    passageiro.email_verified_at ||
                      passageiro.phone_verified_at
                      ? "Verificado"
                      : "Pendente"
                  }
                  iconClass="bg-orange-50 text-orange-600"
                />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    Informações pessoais
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Dados cadastrais do passageiro.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-6 md:grid-cols-2">
                  <InfoItem
                    label="Nome completo"
                    value={name}
                    icon={<User size={17} />}
                  />

                  <InfoItem
                    label="E-mail"
                    value={passageiro.email}
                    icon={<Mail size={17} />}
                  />

                  <InfoItem
                    label="Telefone"
                    value={formatPhone(passageiro.phone)}
                    icon={<Phone size={17} />}
                  />

                  <InfoItem
                    label="CPF / Documento"
                    value={formatDocument(
                      passageiro.identification_number,
                      passageiro.identification_type
                    )}
                    icon={<FileText size={17} />}
                  />

                  <InfoItem
                    label="Tipo de documento"
                    value={passageiro.identification_type}
                    icon={<FileText size={17} />}
                  />

                  <InfoItem
                    label="Código de indicação"
                    value={passageiro.ref_code}
                    icon={<User size={17} />}
                  />

                  <InfoItem
                    label="Pontos de fidelidade"
                    value={
                      passageiro.loyalty_points !== null
                        ? String(passageiro.loyalty_points)
                        : null
                    }
                    icon={<CheckCircle2 size={17} />}
                  />

                  <InfoItem
                    label="Idioma"
                    value={passageiro.current_language_key}
                    icon={<MapPin size={17} />}
                  />

                  <InfoItem
                    label="Data de cadastro"
                    value={formatDateTime(
                      passageiro.created_at
                    )}
                    icon={<CalendarDays size={17} />}
                  />

                  <InfoItem
                    label="E-mail verificado"
                    value={formatDateTime(
                      passageiro.email_verified_at
                    )}
                    icon={<Mail size={17} />}
                  />

                  <InfoItem
                    label="Telefone verificado"
                    value={formatDateTime(
                      passageiro.phone_verified_at
                    )}
                    icon={<Phone size={17} />}
                  />

                  <InfoItem
                    label="Situação"
                    value={active ? "Ativo" : "Bloqueado"}
                    icon={<ShieldCheck size={17} />}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    Documentação
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Documentos vinculados ao cadastro.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                  <DocumentCard
                    title="Documento de identificação"
                    available={Boolean(
                      passageiro.identification_image
                    )}
                    href={passageiro.identification_image}
                  />

                  <DocumentCard
                    title="Documento anterior"
                    available={Boolean(
                      passageiro.old_identification_image
                    )}
                    href={passageiro.old_identification_image}
                  />

                  <DocumentCard
                    title="Outros documentos"
                    available={Boolean(
                      passageiro.other_documents
                    )}
                    href={passageiro.other_documents}
                  />

                  <DocumentCard
                    title="Foto do perfil"
                    available={Boolean(
                      passageiro.profile_image
                    )}
                    href={passageiro.profile_image}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="w-full rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Car size={19} className="text-[#35a989]" />
                  Últimas Corridas
                </h2>
                <p className="mt-0 text-sm text-slate-500">
                  Histórico recente de corridas do passageiro.
                </p>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-full table-auto text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">ID</th>
                    <th className="px-6 py-3 font-semibold">Data</th>
                    <th className="px-6 py-3 font-semibold">Origem</th>
                    <th className="px-6 py-3 font-semibold">Destino</th>
                    <th className="px-6 py-3 font-semibold">
                      Motorista
                    </th>
                    <th className="px-6 py-3 font-semibold">Valor</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {loadingCorridas ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-slate-400"
                      >
                        Carregando corridas...
                      </td>
                    </tr>
                  ) : errorCorridas ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 bg-red-50 text-center text-red-500"
                      >
                        {errorCorridas}
                      </td>
                    </tr>
                  ) : corridas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-slate-400"
                      >
                        Nenhuma corrida encontrada
                      </td>
                    </tr>
                  ) : (
                    paginatedCorridas.map((corrida) => (
                      <tr
                        key={corrida.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 text-slate-600">
                          {corrida.id}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {formatDateTime(corrida.data)}
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          {corrida.origem || "-"}
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          {corrida.destino || "-"}
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {corrida.motorista || "-"}
                        </td>

                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {formatCurrency(corrida.valor)}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                              corrida.status
                            )}`}
                          >
                            {corrida.status || "-"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loadingCorridas &&
              !errorCorridas &&
              corridas.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Mostrando{" "}
                    <span className="font-semibold text-slate-700">
                      {(corridasPage - 1) * CORRIDAS_PER_PAGE + 1}
                    </span>
                    {" - "}
                    <span className="font-semibold text-slate-700">
                      {Math.min(
                        corridasPage * CORRIDAS_PER_PAGE,
                        corridas.length
                      )}
                    </span>{" "}
                    de{" "}
                    <span className="font-semibold text-slate-700">
                      {corridas.length}
                    </span>{" "}
                    corridas
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCorridasPage((page) =>
                          Math.max(1, page - 1)
                        )
                      }
                      disabled={corridasPage === 1}
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={17} />
                    </button>

                    <span className="min-w-[90px] text-center text-xs font-semibold text-slate-600">
                      Página {corridasPage} de {totalCorridasPages}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setCorridasPage((page) =>
                          Math.min(totalCorridasPages, page + 1)
                        )
                      }
                      disabled={corridasPage === totalCorridasPages}
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {showUnlockModal && !active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!sendingRequest) {
              setShowUnlockModal(false);
            }
          }}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Solicitar desbloqueio
                </h2>
                <p className="mt-0 text-sm text-slate-500">
                  Informe o motivo da solicitação.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                disabled={sendingRequest}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-5 rounded-2xl bg-red-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <Lock size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-red-800">
                      Passageiro bloqueado
                    </p>

                    <p className="truncate text-xs text-red-600">
                      {name}
                    </p>
                  </div>
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Motivo da solicitação
                </span>

                <textarea
                  value={unlockReason}
                  onChange={(event) =>
                    setUnlockReason(event.target.value)
                  }
                  placeholder="Digite o motivo para solicitar o desbloqueio..."
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#35a989] focus:bg-white focus:ring-4 focus:ring-[#35a989]/10"
                />
              </label>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowUnlockModal(false);
                    setUnlockReason("");
                  }}
                  disabled={sendingRequest}
                  className="h-11 rounded-xl cursor-pointer border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleUnlockRequest}
                  disabled={
                    sendingRequest ||
                    !unlockReason.trim()
                  }
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#35a989] px-5 text-sm font-bold text-white transition hover:bg-[#2f987b] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingRequest ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <LockOpen size={17} />
                      Solicitar desbloqueio
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  iconClass,
}: {
  icon: ReactNode;
  label: string;
  value: string | null | undefined;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

function DocumentCard({
  title,
  available,
  href,
}: {
  title: string;
  available: boolean;
  href: string | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${available
            ? "bg-green-100 text-green-600"
            : "bg-slate-200 text-slate-400"
            }`}
        >
          <FileText size={19} />
        </div>

        <div>
          <p className="text-sm font-bold text-slate-800">
            {title}
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            {available
              ? "Documento disponível"
              : "Não enviado"}
          </p>
        </div>
      </div>

      {available && href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#35a989] shadow-sm transition hover:bg-[#35a989] hover:text-white"
        >
          Visualizar
        </a>
      ) : (
        <span className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-400">
          Indisponível
        </span>
      )}
    </div>
  );
}
=======
type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MotoristaPage({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Motorista
      </h1>

      <p className="mt-2 text-slate-600">
        ID: {id}
      </p>
    </main>
  );
}
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
