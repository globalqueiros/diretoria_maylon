"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lock,
  LockOpen,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  User,
  UserX,
  X,
} from "lucide-react";

const LISTA_MOTORISTAS_URL = "/gerente/motoristas";

type Motorista = {
  id: string;
  passsageiro_tea?: boolean | number | string | null;
  full_name: string | null;
  user_level_id?: number | null;
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
  user_type?: string | number | null;
  role_id?: number | null;
  is_active: boolean | number | string | null;
  current_language_key: string | null;
  deleted_at?: string | null;
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

type EditForm = {
  full_name: string;
  email: string;
  phone: string;
  identification_number: string;
  identification_type: string;
};

const CORRIDAS_PER_PAGE = 35;

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

/**
 * A API pode devolver o motorista em chaves diferentes
 * (motorista, driver, passageiro, user, data...). Esta função
 * tenta todas e normaliza o id.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMotorista(data: any): Motorista | null {
  const raw =
    data?.motorista ??
    data?.driver ??
    data?.passageiro ??
    data?.user ??
    data?.data?.motorista ??
    data?.data ??
    data ??
    null;

  const item = Array.isArray(raw) ? raw[0] : raw;

  if (!item || typeof item !== "object") return null;

  const resolvedId = item.id ?? item.user_id ?? item.uuid;

  if (resolvedId === undefined || resolvedId === null || resolvedId === "") {
    return null;
  }

  return { ...item, id: String(resolvedId) } as Motorista;
}

function validarCNH(value: string) {
  const cnh = onlyNumbers(value);

  if (cnh.length !== 11 || /^(\d)\1{10}$/.test(cnh)) {
    return false;
  }

  let soma = 0;
  let multiplicador = 9;

  for (let i = 0; i < 9; i++) {
    soma += Number(cnh[i]) * multiplicador--;
  }

  let digito1 = soma % 11;

  if (digito1 >= 10) digito1 = 0;

  soma = 0;
  multiplicador = 1;

  for (let i = 0; i < 9; i++) {
    soma += Number(cnh[i]) * multiplicador++;
  }

  let digito2 = soma % 11;

  if (digito2 >= 10) digito2 = 0;

  return digito1 === Number(cnh[9]) && digito2 === Number(cnh[10]);
}

function nomeCompletoValido(value: string) {
  const nome = value.trim().replace(/\s+/g, " ");
  const partes = nome.split(" ");

  return partes.length >= 2 && partes.every((parte) => parte.length > 0);
}

function isActive(motorista: Motorista) {
  return (
    motorista.is_active === true ||
    motorista.is_active === 1 ||
    String(motorista.is_active).toLowerCase() === "1" ||
    String(motorista.is_active).toLowerCase() === "true"
  );
}

function getMotoristaName(motorista: Motorista) {
  if (motorista.full_name?.trim()) {
    return motorista.full_name.trim();
  }

  const name = [motorista.first_name?.trim(), motorista.last_name?.trim()]
    .filter(Boolean)
    .join(" ");

  return name || "Motorista sem nome";
}

function parseDateSafely(value: string) {
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? value.replace(" ", "T")
    : value;

  return new Date(normalized);
}

function formatDate(date: string | null) {
  if (!date) return "-";

  const parsedDate = parseDateSafely(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function formatDateTime(date: string | null) {
  if (!date) return "-";

  const parsedDate = parseDateSafely(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function formatCurrency(value: number | string | null) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numero =
    typeof value === "string" ? Number(value.replace(",", ".")) : value;

  if (!Number.isFinite(numero)) return "-";

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDocument(value: string | null, type: string | null) {
  if (!value) return "-";

  const normalizedType = String(type || "").trim().toLowerCase();
  const numbers = onlyNumbers(value);

  if (normalizedType.includes("cnh")) {
    return numbers || value;
  }

  if (normalizedType.includes("cpf") && numbers.length === 11) {
    return numbers.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }

  return value;
}

function formatPhone(value: string | null) {
  if (!value) return "-";

  const numbers = onlyNumbers(value);

  if (numbers.length === 11) {
    return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }

  if (numbers.length === 10) {
    return numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }

  if (numbers.length === 13 && numbers.startsWith("55")) {
    return numbers
      .slice(2)
      .replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }

  return value;
}

function statusBadgeClass(status: string | null) {
  const normalized = String(status || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

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

function isMissing(value: string | null | undefined) {
  return !value || !value.trim();
}

export default function MotoristaDetalhesPage() {
  const params = useParams<{ id?: string | string[] }>();
  const router = useRouter();

  const id = useMemo(() => {
    const value = params?.id;

    if (Array.isArray(value)) return value[0] || "";

    return value ? String(value) : "";
  }, [params]);

  const identityGateChecked = useRef(false);

  const [motorista, setMotorista] = useState<Motorista | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [unlockError, setUnlockError] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [savingPersonalInfo, setSavingPersonalInfo] = useState(false);
  const [personalInfoError, setPersonalInfoError] = useState("");
  const [personalInfoSuccess, setPersonalInfoSuccess] = useState("");

  const [editForm, setEditForm] = useState<EditForm>({
    full_name: "",
    email: "",
    phone: "",
    identification_number: "",
    identification_type: "CNH",
  });

  const [showIdentityGate, setShowIdentityGate] = useState(false);
  const [identityName, setIdentityName] = useState("");
  const [identityCNH, setIdentityCNH] = useState("");
  const [identityError, setIdentityError] = useState("");
  const [savingIdentity, setSavingIdentity] = useState(false);

  const [corridas, setCorridas] = useState<Corrida[]>([]);
  const [loadingCorridas, setLoadingCorridas] = useState(true);
  const [errorCorridas, setErrorCorridas] = useState("");
  const [corridasPage, setCorridasPage] = useState(1);

  const fetchMotorista = useCallback(async () => {
    if (!id) {
      setError("ID do motorista não informado.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/motoristas/${encodeURIComponent(id)}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Não foi possível carregar os dados do motorista."
        );
      }

      const motoristaData = extractMotorista(data);

      if (!motoristaData) {
        console.error("Resposta inesperada da API /api/motoristas:", data);
        throw new Error("Motorista não encontrado.");
      }

      setMotorista(motoristaData);

      if (!identityGateChecked.current) {
        identityGateChecked.current = true;
        setIdentityName("");
        setIdentityCNH("");
        setIdentityError("");
        setShowIdentityGate(true);
      }
    } catch (err) {
      console.error("Erro ao buscar motorista:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os dados do motorista."
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
        `/api/motoristas/${encodeURIComponent(id)}/corridas`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível carregar as corridas.");
      }

      const lista: Corrida[] = data?.corridas ?? data ?? [];

      setCorridas(Array.isArray(lista) ? lista : []);
      setCorridasPage(1);
    } catch (err) {
      console.error("Erro ao buscar corridas:", err);

      setErrorCorridas(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as corridas."
      );
    } finally {
      setLoadingCorridas(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchMotorista();
    void fetchCorridas();
  }, [fetchMotorista, fetchCorridas]);

  const missingPersonalInfo = useMemo(() => {
    if (!motorista) return [];

    const fields = [
      {
        label: "Nome completo",
        value:
          motorista.full_name?.trim() ||
          [motorista.first_name?.trim(), motorista.last_name?.trim()]
            .filter(Boolean)
            .join(" "),
      },
      { label: "E-mail", value: motorista.email },
      { label: "Telefone", value: motorista.phone },
      { label: "CNH", value: motorista.identification_number },
      { label: "Tipo de documento", value: motorista.identification_type },
    ];

    return fields
      .filter(({ value }) => isMissing(value))
      .map(({ label }) => label);
  }, [motorista]);

  const openEditModal = () => {
    if (!motorista) return;

    setEditForm({
      full_name:
        motorista.full_name ||
        [motorista.first_name, motorista.last_name].filter(Boolean).join(" "),
      email: motorista.email || "",
      phone: motorista.phone || "",
      identification_number: motorista.identification_number || "",
      identification_type: motorista.identification_type || "CNH",
    });

    setPersonalInfoError("");
    setPersonalInfoSuccess("");
    setShowEditModal(true);
  };

  const handleSaveIdentity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIdentityError("");

    const nome = identityName.trim().replace(/\s+/g, " ");
    const cnh = onlyNumbers(identityCNH);

    if (!nomeCompletoValido(nome)) {
      setIdentityError(
        "Informe seu nome completo, incluindo nome e sobrenome."
      );
      return;
    }

    if (!validarCNH(cnh)) {
      setIdentityError("Informe uma CNH válida com 11 dígitos verificadores.");
      return;
    }

    try {
      setSavingIdentity(true);

      const response = await fetch(`/api/motoristas/${encodeURIComponent(id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: nome,
          identification_number: cnh,
          identification_type: "CNH",
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível salvar os dados.");
      }

      const updated = extractMotorista(data);

      if (!updated) {
        throw new Error("A API não retornou os dados atualizados.");
      }

      setMotorista((atual) => (atual ? { ...atual, ...updated } : atual));

      setIdentityName(nome);
      setIdentityCNH(cnh);
      setShowIdentityGate(false);
    } catch (err) {
      setIdentityError(
        err instanceof Error ? err.message : "Erro ao salvar as informações."
      );
    } finally {
      setSavingIdentity(false);
    }
  };

  const handleSavePersonalInfo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id) return;

    const nome = editForm.full_name.trim().replace(/\s+/g, " ");
    const email = editForm.email.trim();
    const telefone = onlyNumbers(editForm.phone);
    const tipo = editForm.identification_type;
    const documento =
      tipo.toLowerCase() === "cnh"
        ? onlyNumbers(editForm.identification_number)
        : editForm.identification_number.trim();

    if (!nome || !email || !telefone || !documento || !tipo) {
      setPersonalInfoError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!nomeCompletoValido(nome)) {
      setPersonalInfoError("Informe o nome completo do motorista.");
      return;
    }

    if (tipo.toLowerCase() === "cnh" && !validarCNH(documento)) {
      setPersonalInfoError("Informe uma CNH válida.");
      return;
    }

    try {
      setSavingPersonalInfo(true);
      setPersonalInfoError("");
      setPersonalInfoSuccess("");

      const response = await fetch(`/api/motoristas/${encodeURIComponent(id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: nome,
          email,
          phone: telefone,
          identification_number: documento,
          identification_type: tipo,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível atualizar o cadastro.");
      }

      const updated = extractMotorista(data);

      if (updated) {
        setMotorista((atual) => (atual ? { ...atual, ...updated } : atual));
      } else {
        await fetchMotorista();
      }

      setPersonalInfoSuccess("Informações atualizadas com sucesso!");
      setShowEditModal(false);
    } catch (err) {
      setPersonalInfoError(
        err instanceof Error ? err.message : "Erro ao salvar as informações."
      );
    } finally {
      setSavingPersonalInfo(false);
    }
  };

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
    if (!motorista || !unlockReason.trim()) return;

    try {
      setSendingRequest(true);
      setUnlockError("");

      setUnlockError(
        "A solicitação ainda não está conectada a uma API de desbloqueio. Configure o endpoint para enviar o pedido."
      );
    } catch (err) {
      console.error("Erro ao solicitar desbloqueio:", err);
      setUnlockError("Não foi possível enviar a solicitação.");
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <p className="font-medium text-gray-500">
            Aguarde, carregando dados do motorista...
          </p>
        </div>
      </div>
    );
  }

  if (error || !motorista) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-[1600px]">
          <Link
            href={LISTA_MOTORISTAS_URL}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#27876c] transition hover:text-[#35a989]"
          >
            <ArrowLeft size={18} />
            Voltar para motoristas
          </Link>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <UserX size={28} />
            </div>

            <h1 className="mt-4 text-xl font-bold text-red-900">
              Motorista não encontrado
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error || "Não foi possível localizar este motorista."}
            </p>

            <button
              type="button"
              onClick={() => router.push(LISTA_MOTORISTAS_URL)}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const active = isActive(motorista);
  const name = getMotoristaName(motorista);

  return (
    <>
      <main className="min-h-screen">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href={LISTA_MOTORISTAS_URL}
                className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-white transition"
              >
                <ArrowLeft size={18} />
                Voltar para motoristas
              </Link>

              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Detalhes do motorista
              </h1>

              <p className="mt-1 text-sm text-white">
                Consulte as informações cadastrais do motorista.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void fetchMotorista();
                  void fetchCorridas();
                }}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#35a989] shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
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
                    setUnlockError("");
                    setShowUnlockModal(true);
                  }
                }}
                disabled={active}
                className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
                  active
                    ? "cursor-default bg-green-100 text-green-700"
                    : "cursor-pointer bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                {active ? <LockOpen size={18} /> : <Lock size={18} />}
                {active ? "Motorista Ativo" : "Motorista Bloqueado"}
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
                      className={`flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-4 border-white text-3xl font-bold shadow-lg ${
                        active
                          ? "bg-[#35a989]/10 text-[#35a989]"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {motorista.profile_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={motorista.profile_image}
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
                      ID {motorista.id}
                    </p>
                  </div>

                  <div className="mt-6 space-y-3">
                    <ContactItem
                      icon={<Mail size={18} />}
                      label="E-mail"
                      value={motorista.email}
                    />

                    <ContactItem
                      icon={<Phone size={18} />}
                      label="Telefone"
                      value={formatPhone(motorista.phone)}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <ShieldCheck size={19} className="text-[#35a989]" />
                  Situação da conta
                </h3>

                <div
                  className={`mt-4 rounded-2xl border p-4 ${
                    active
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {active ? (
                      <CheckCircle2 size={22} className="text-green-600" />
                    ) : (
                      <UserX size={22} className="text-red-600" />
                    )}

                    <div>
                      <p
                        className={`text-sm font-bold ${
                          active ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        {active ? "Conta ativa" : "Conta bloqueada"}
                      </p>

                      <p
                        className={`mt-0.5 text-xs ${
                          active ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {active
                          ? "O motorista está habilitado para utilizar a plataforma."
                          : "O motorista está impedido de utilizar a plataforma."}
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
                  value={formatDate(motorista.created_at)}
                  iconClass="bg-[#35a989]/10 text-[#35a989]"
                />

                <StatCard
                  icon={<FileText size={21} />}
                  label="CNH"
                  value={formatDocument(
                    motorista.identification_number,
                    motorista.identification_type
                  )}
                  iconClass="bg-blue-50 text-blue-600"
                />

                <StatCard
                  icon={<User size={21} />}
                  label="Tipo de documento"
                  value={motorista.identification_type}
                  iconClass="bg-purple-50 text-purple-600"
                />

                <StatCard
                  icon={<ShieldCheck size={21} />}
                  label="Verificação"
                  value={
                    motorista.email_verified_at || motorista.phone_verified_at
                      ? "Verificado"
                      : "Pendente"
                  }
                  iconClass="bg-orange-50 text-orange-600"
                />
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Informações pessoais
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Dados cadastrais do motorista.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openEditModal}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#35a989]/30 bg-[#35a989]/10 px-4 text-sm font-bold text-[#27876c] transition hover:bg-[#35a989]/20"
                  >
                    <Pencil size={16} />
                    Editar informações
                  </button>
                </div>

                {missingPersonalInfo.length > 0 && (
                  <div className="mx-6 mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <AlertCircle
                          size={22}
                          className="mt-0.5 shrink-0 text-amber-600"
                        />

                        <div>
                          <p className="font-bold text-amber-900">
                            Informações pessoais incompletas
                          </p>

                          <p className="mt-1 text-sm text-amber-800">
                            Faltam preencher: {missingPersonalInfo.join(", ")}.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={openEditModal}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#35a989] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2f987b]"
                      >
                        <Pencil size={17} />
                        Completar informações
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-6 md:grid-cols-2">
                  <InfoItem
                    label="Nome completo"
                    value={name}
                    icon={<User size={17} />}
                  />

                  <InfoItem
                    label="E-mail"
                    value={motorista.email}
                    icon={<Mail size={17} />}
                  />

                  <InfoItem
                    label="Telefone"
                    value={formatPhone(motorista.phone)}
                    icon={<Phone size={17} />}
                  />

                  <InfoItem
                    label="CNH"
                    value={formatDocument(
                      motorista.identification_number,
                      motorista.identification_type
                    )}
                    icon={<FileText size={17} />}
                  />

                  <InfoItem
                    label="Tipo de documento"
                    value={motorista.identification_type}
                    icon={<FileText size={17} />}
                  />

                  <InfoItem
                    label="Código de indicação"
                    value={motorista.ref_code}
                    icon={<User size={17} />}
                  />

                  <InfoItem
                    label="Pontos de fidelidade"
                    value={
                      motorista.loyalty_points !== null &&
                      motorista.loyalty_points !== undefined
                        ? String(motorista.loyalty_points)
                        : null
                    }
                    icon={<CheckCircle2 size={17} />}
                  />

                  <InfoItem
                    label="Idioma"
                    value={motorista.current_language_key}
                    icon={<MapPin size={17} />}
                  />

                  <InfoItem
                    label="Data de cadastro"
                    value={formatDateTime(motorista.created_at)}
                    icon={<CalendarDays size={17} />}
                  />

                  <InfoItem
                    label="E-mail verificado"
                    value={formatDateTime(motorista.email_verified_at)}
                    icon={<Mail size={17} />}
                  />

                  <InfoItem
                    label="Telefone verificado"
                    value={formatDateTime(motorista.phone_verified_at)}
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
                    title="CNH / Documento de identificação"
                    available={Boolean(motorista.identification_image)}
                    href={motorista.identification_image}
                  />

                  <DocumentCard
                    title="Documento anterior"
                    available={Boolean(motorista.old_identification_image)}
                    href={motorista.old_identification_image}
                  />

                  <DocumentCard
                    title="Outros documentos"
                    available={Boolean(motorista.other_documents)}
                    href={motorista.other_documents}
                  />

                  <DocumentCard
                    title="Foto do perfil"
                    available={Boolean(motorista.profile_image)}
                    href={motorista.profile_image}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Car size={19} className="text-[#35a989]" />
                Últimas Corridas
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Histórico recente de corridas do motorista.
              </p>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[850px] table-auto text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-semibold">ID</th>
                    <th className="px-6 py-3 font-semibold">Data</th>
                    <th className="px-6 py-3 font-semibold">Origem</th>
                    <th className="px-6 py-3 font-semibold">Destino</th>
                    <th className="px-6 py-3 font-semibold">Motorista</th>
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
                        className="bg-red-50 px-6 py-8 text-center text-red-500"
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
                        Nenhuma corrida encontrada.
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

            {!loadingCorridas && !errorCorridas && corridas.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Mostrando{" "}
                  <span className="font-semibold text-slate-700">
                    {(corridasPage - 1) * CORRIDAS_PER_PAGE + 1}
                  </span>{" "}
                  -{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.min(corridasPage * CORRIDAS_PER_PAGE, corridas.length)}
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
                      setCorridasPage((page) => Math.max(1, page - 1))
                    }
                    disabled={corridasPage === 1}
                    aria-label="Página anterior"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                    aria-label="Próxima página"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {showEditModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!savingPersonalInfo) setShowEditModal(false);
          }}
        >
          <div
            className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Editar informações pessoais
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Atualize os dados cadastrais do motorista.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                disabled={savingPersonalInfo}
                aria-label="Fechar edição"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePersonalInfo}>
              <div className="grid max-h-[65vh] grid-cols-1 gap-5 overflow-y-auto p-6 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Nome completo *
                  </span>

                  <input
                    required
                    maxLength={150}
                    autoComplete="name"
                    value={editForm.full_name}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        full_name: event.target.value,
                      })
                    }
                    placeholder="Nome completo do motorista"
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-[#35a989] focus:ring-4 focus:ring-[#35a989]/10"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    E-mail *
                  </span>

                  <input
                    required
                    type="email"
                    maxLength={254}
                    autoComplete="email"
                    value={editForm.email}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        email: event.target.value,
                      })
                    }
                    placeholder="email@exemplo.com"
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-[#35a989] focus:ring-4 focus:ring-[#35a989]/10"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Telefone *
                  </span>

                  <input
                    required
                    type="tel"
                    maxLength={20}
                    autoComplete="tel"
                    value={editForm.phone}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        phone: event.target.value,
                      })
                    }
                    placeholder="(13) 99999-9999"
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-[#35a989] focus:ring-4 focus:ring-[#35a989]/10"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Tipo de documento *
                  </span>

                  <select
                    required
                    value={editForm.identification_type}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        identification_type: event.target.value,
                      })
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-[#35a989] focus:ring-4 focus:ring-[#35a989]/10"
                  >
                    <option value="CNH">CNH</option>
                    <option value="RG">RG</option>
                    <option value="Passaporte">Passaporte</option>
                  </select>
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Número da CNH / Documento *
                  </span>

                  <input
                    required
                    maxLength={30}
                    inputMode={
                      editForm.identification_type === "CNH"
                        ? "numeric"
                        : "text"
                    }
                    value={editForm.identification_number}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        identification_number:
                          editForm.identification_type === "CNH"
                            ? onlyNumbers(event.target.value).slice(0, 11)
                            : event.target.value,
                      })
                    }
                    placeholder={
                      editForm.identification_type === "CNH"
                        ? "Digite os 11 dígitos da CNH"
                        : "Número do documento"
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-[#35a989] focus:ring-4 focus:ring-[#35a989]/10"
                  />
                </label>

                {personalInfoError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2"
                  >
                    {personalInfoError}
                  </div>
                )}

                {personalInfoSuccess && (
                  <div
                    role="status"
                    className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 sm:col-span-2"
                  >
                    {personalInfoSuccess}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={savingPersonalInfo}
                  onClick={() => setShowEditModal(false)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingPersonalInfo}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#35a989] px-5 text-sm font-bold text-white transition hover:bg-[#2f987b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPersonalInfo ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Salvar informações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUnlockModal && !active && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!sendingRequest) setShowUnlockModal(false);
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

                <p className="mt-1 text-sm text-slate-500">
                  Informe o motivo da solicitação.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                disabled={sendingRequest}
                aria-label="Fechar solicitação"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
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
                      Motorista bloqueado
                    </p>

                    <p className="truncate text-xs text-red-600">{name}</p>
                  </div>
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Motivo da solicitação *
                </span>

                <textarea
                  required
                  value={unlockReason}
                  onChange={(event) => setUnlockReason(event.target.value)}
                  placeholder="Digite o motivo para solicitar o desbloqueio..."
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#35a989] focus:bg-white focus:ring-4 focus:ring-[#35a989]/10"
                />
              </label>

              {unlockError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                >
                  {unlockError}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowUnlockModal(false);
                    setUnlockReason("");
                    setUnlockError("");
                  }}
                  disabled={sendingRequest}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void handleUnlockRequest();
                  }}
                  disabled={sendingRequest || !unlockReason.trim()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#35a989] px-5 text-sm font-bold text-white transition hover:bg-[#2f987b] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingRequest ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
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

      {showIdentityGate && motorista && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="identity-gate-title"
            className="my-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <ShieldCheck size={28} />
            </div>

            <h2
              id="identity-gate-title"
              className="text-xl font-black text-slate-900"
            >
              Complete sua identificação
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Para continuar, informe seu nome completo e o número da sua CNH.
              Os dados serão salvos no cadastro deste motorista.
            </p>

            <form onSubmit={handleSaveIdentity} className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Nome completo *
                </span>

                <input
                  required
                  autoComplete="name"
                  maxLength={150}
                  value={identityName}
                  onChange={(event) => setIdentityName(event.target.value)}
                  placeholder="Digite seu nome e sobrenome"
                  className="h-12 w-full capitalize rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-[#35a989] focus:ring-4 focus:ring-[#35a989]/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  CNH *
                </span>

                <input
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  minLength={11}
                  maxLength={11}
                  value={identityCNH}
                  onChange={(event) =>
                    setIdentityCNH(onlyNumbers(event.target.value).slice(0, 11))
                  }
                  placeholder="Digite os 11 dígitos da CNH"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-[#35a989] focus:ring-4 focus:ring-[#35a989]/10"
                />

                <span className="mt-2 block text-xs text-slate-400">
                  {identityCNH.length}/11 dígitos
                </span>
              </label>

              {identityError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {identityError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push(LISTA_MOTORISTAS_URL)}
                  disabled={savingIdentity}
                  className="inline-flex cursor-pointer h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingIdentity}
                  className="inline-flex cursor-pointer h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#35a989] px-5 text-sm font-bold text-white transition hover:bg-[#2f987b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingIdentity ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      Salvando informações...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Salvar e continuar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function ContactItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">{label}</p>

        <p className="break-words text-sm font-semibold text-slate-700">
          {value || "-"}
        </p>
      </div>
    </div>
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
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            available
              ? "bg-green-100 text-green-600"
              : "bg-slate-200 text-slate-400"
          }`}
        >
          <FileText size={19} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800">{title}</p>

          <p className="mt-0.5 text-xs text-slate-500">
            {available ? "Documento disponível" : "Não enviado"}
          </p>
        </div>
      </div>

      {available && href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#35a989] shadow-sm transition hover:bg-[#35a989] hover:text-white"
        >
          Visualizar
        </a>
      ) : (
        <span className="shrink-0 rounded-xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-400">
          Indisponível
        </span>
      )}
    </div>
  );
}