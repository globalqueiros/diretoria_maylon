"use client";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Lock,
  LockOpen,
  RefreshCw,
  Search,
  Send,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Passageiro = {
  id: number;
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
  fcm_token: string | null;
  phone_verified_at: string | null;
  email_verified_at: string | null;
  loyalty_points: number | null;
  password: string | null;
  ref_code: string | null;
  user_type: string | number | null;
  role_id: number | null;
  remember_token: string | null;
  is_active: boolean | number | string | null;
  current_language_key: string | null;
  deleted_at: string | null;
  created_at: string | null;
};

const PAGE_SIZE = 50;

function isActive(passageiro: Passageiro) {
  return (
    passageiro.is_active === true ||
    passageiro.is_active === 1 ||
    String(passageiro.is_active).toLowerCase() === "1" ||
    String(passageiro.is_active).toLowerCase() === "true"
  );
}

function isBlocked(passageiro: Passageiro) {
  return !isActive(passageiro);
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

export default function PassageirosPage() {
  const [passageiros, setPassageiros] = useState<Passageiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "todos" | "ativo" | "inativo"
  >("todos");

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedPassenger, setSelectedPassenger] =
    useState<Passageiro | null>(null);

  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSuccess, setRequestSuccess] = useState(false);

  const fetchPassageiros = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/passageiros", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Não foi possível carregar os passageiros."
        );
      }

      setPassageiros(
        Array.isArray(data?.passageiros) ? data.passageiros : []
      );

      setCurrentPage(1);
    } catch (error) {
      console.error("Erro ao buscar passageiros:", error);

      setPassageiros([]);

      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os passageiros."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassageiros();
  }, []);

  const stats = useMemo(() => {
    const total = passageiros.length;

    const ativos = passageiros.filter((passageiro) =>
      isActive(passageiro)
    ).length;

    const inativos = total - ativos;

    return {
      total,
      ativos,
      inativos,
    };
  }, [passageiros]);

  const filteredPassengers = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return passageiros.filter((passageiro) => {
      const active = isActive(passageiro);

      if (statusFilter === "ativo" && !active) {
        return false;
      }

      if (statusFilter === "inativo" && active) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      const values = [
        passageiro.id,
        passageiro.full_name,
        passageiro.first_name,
        passageiro.last_name,
        passageiro.email,
        passageiro.phone,
        passageiro.identification_number,
        passageiro.identification_type,
        passageiro.ref_code,
      ];

      return values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(searchTerm)
      );
    });
  }, [passageiros, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPassengers.length / PAGE_SIZE)
  );

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredPassengers.slice(start, start + PAGE_SIZE);
  }, [filteredPassengers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openUnlockModal = (passageiro: Passageiro) => {
    setSelectedPassenger(passageiro);
    setUnlockReason("");
    setRequestMessage("");
    setRequestSuccess(false);
    setShowUnlockModal(true);
  };

  const closeUnlockModal = () => {
    if (sendingRequest) return;

    setShowUnlockModal(false);
    setSelectedPassenger(null);
    setUnlockReason("");
    setRequestMessage("");
    setRequestSuccess(false);
  };

  const requestUnlock = async () => {
    if (!selectedPassenger) return;

    const motivo = unlockReason.trim();

    if (!motivo) {
      setRequestMessage("Informe o motivo da solicitação.");
      setRequestSuccess(false);
      return;
    }

    try {
      setSendingRequest(true);
      setRequestMessage("");
      setRequestSuccess(false);

      const response = await fetch("/api/passageiros/desbloqueio", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario_id: selectedPassenger.id,
          motivo,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
          "Não foi possível enviar a solicitação de desbloqueio."
        );
      }

      setRequestSuccess(true);

      setRequestMessage(
        data?.message ||
        "Solicitação de desbloqueio enviada com sucesso."
      );

      window.setTimeout(() => {
        setShowUnlockModal(false);
        setSelectedPassenger(null);
        setUnlockReason("");
        setRequestMessage("");
        setRequestSuccess(false);
      }, 1500);
    } catch (error) {
      console.error("Erro ao solicitar desbloqueio:", error);

      setRequestSuccess(false);

      setRequestMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a solicitação."
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
            Aguarde, carregando página...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-8xl space-y-6">
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Passageiros
              </h1>

              <p className="mt-0 text-sm text-white/80">
                Gerencie os passageiros cadastrados na plataforma.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchPassageiros}
              disabled={loading}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#35a989] shadow-sm transition-all duration-200 hover:bg-white/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />

              {loading ? "Atualizando..." : "Atualizar"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setStatusFilter("todos")}
            className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${statusFilter === "todos"
                ? "border-[#35a989] ring-2 ring-[#35a989]/10"
                : "border-slate-200"
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total de passageiros
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats.total}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#35a989]/10 text-[#35a989]">
                <Users size={24} />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("ativo")}
            className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${statusFilter === "ativo"
                ? "border-green-500 ring-2 ring-green-500/10"
                : "border-slate-200"
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Passageiros ativos
                </p>

                <p className="mt-2 text-3xl font-bold text-green-600">
                  {stats.ativos}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <UserCheck size={24} />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("inativo")}
            className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${statusFilter === "inativo"
                ? "border-red-500 ring-2 ring-red-500/10"
                : "border-slate-200"
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Bloqueados
                </p>

                <p className="mt-2 text-3xl font-bold text-red-600">
                  {stats.inativos}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <UserX size={24} />
              </div>
            </div>
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Digite o nome ou número de telefone..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#35a989] focus:bg-white focus:ring-4 focus:ring-[#35a989]/10"
              />
            </div>

            <div className="flex w-full gap-2 overflow-x-auto lg:w-auto">
              <button
                type="button"
                onClick={() => setStatusFilter("todos")}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${statusFilter === "todos"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                Todos ({stats.total})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("ativo")}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${statusFilter === "ativo"
                    ? "bg-green-600 text-white"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
              >
                Ativos ({stats.ativos})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("inativo")}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${statusFilter === "inativo"
                    ? "bg-red-600 text-white"
                    : "bg-red-50 text-red-700 hover:bg-red-100"
                  }`}
              >
                Bloqueados ({stats.inativos})
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Passageiro
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Contato
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Documento
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Cadastro
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <Loader2
                          size={30}
                          className="animate-spin text-[#35a989]"
                        />

                        <p className="mt-3 text-sm font-medium text-slate-500">
                          Carregando passageiros...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <Users size={26} />
                        </div>

                        <p className="mt-4 text-base font-semibold text-slate-700">
                          Nenhum passageiro encontrado
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Tente alterar sua busca ou filtro.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((item) => {
                    const active = isActive(item);
                    const blocked = isBlocked(item);

                    return (
                      <tr
                        key={item.id}
                        className={`border-t transition-all ${blocked
                            ? "border-red-200 bg-red-50 hover:bg-red-100"
                            : "border-slate-100 bg-white hover:bg-slate-50"
                          }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl font-bold ${blocked
                                  ? "bg-red-100 text-red-700"
                                  : "bg-[#35a989]/10 text-[#35a989]"
                                }`}
                            >
                              {item.profile_image ? (
                                <img
                                  src={item.profile_image}
                                  alt={getPassengerName(item)}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                getPassengerName(item)
                                  .charAt(0)
                                  .toUpperCase()
                              )}
                            </div>

                            <div className="min-w-0">
                              <p
                                className={`truncate text-sm font-bold ${blocked
                                    ? "text-red-900"
                                    : "text-slate-900"
                                  }`}
                              >
                                {getPassengerName(item)}
                              </p>

                              <p
                                className={`mt-0.5 text-xs ${blocked
                                    ? "text-red-600"
                                    : "text-slate-500"
                                  }`}
                              >
                                ID #{item.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div>
                            <p
                              className={`text-sm font-medium ${blocked
                                  ? "text-red-900"
                                  : "text-slate-700"
                                }`}
                            >
                              {item.email || "-"}
                            </p>

                            <p
                              className={`mt-1 text-xs ${blocked
                                  ? "text-red-600"
                                  : "text-slate-500"
                                }`}
                            >
                              {item.phone || "-"}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div>
                            <p
                              className={`text-sm font-medium ${blocked
                                  ? "text-red-900"
                                  : "text-slate-700"
                                }`}
                            >
                              {item.identification_number || "-"}
                            </p>

                            <p
                              className={`mt-1 text-xs ${blocked
                                  ? "text-red-600"
                                  : "text-slate-500"
                                }`}
                            >
                              {item.identification_type || "Documento"}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`text-sm ${blocked
                                ? "text-red-800"
                                : "text-slate-600"
                              }`}
                          >
                            {formatDate(item.created_at)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {active ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                              Bloqueado
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/atendente/passageiros/${item.id}`}
                              title="Visualizar passageiro"
                              className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition-all ${blocked
                                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                              <Eye size={17} />
                            </Link>
                            {blocked ? (
                              <button
                                type="button"
                                title="Solicitar desbloqueio"
                                onClick={() =>
                                  openUnlockModal(item)
                                }
                                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-red-100 text-red-600 transition-all duration-200 hover:scale-105 hover:bg-red-200 hover:text-red-700"
                              >
                                <Lock size={18} />
                              </button>
                            ) : (
                              <span
                                title="Usuário desbloqueado"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-600"
                              >
                                <LockOpen size={18} />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredPassengers.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Mostrando{" "}
                <span className="font-semibold text-slate-700">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>{" "}
                até{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(
                    currentPage * PAGE_SIZE,
                    filteredPassengers.length
                  )}
                </span>{" "}
                de{" "}
                <span className="font-semibold text-slate-700">
                  {filteredPassengers.length}
                </span>{" "}
                passageiros
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1)
                    )
                  }
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-slate-900 px-3 text-sm font-bold text-white">
                  {currentPage}
                </div>

                <span className="text-sm text-slate-400">
                  de
                </span>

                <div className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-600">
                  {totalPages}
                </div>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showUnlockModal && selectedPassenger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <Lock size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Solicitar desbloqueio
                  </h2>

                  <p className="text-sm text-slate-500">
                    Passageiro bloqueado
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeUnlockModal}
                disabled={sendingRequest}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-red-500">
                  Passageiro
                </p>

                <p className="mt-1 text-base font-bold text-red-900">
                  {getPassengerName(selectedPassenger)}
                </p>

                <p className="mt-1 text-sm text-red-700">
                  ID #{selectedPassenger.id}
                </p>

                {selectedPassenger.email && (
                  <p className="mt-1 text-sm text-red-700">
                    {selectedPassenger.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="unlockReason"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Motivo da solicitação
                </label>

                <textarea
                  id="unlockReason"
                  value={unlockReason}
                  onChange={(event) =>
                    setUnlockReason(event.target.value)
                  }
                  disabled={sendingRequest || requestSuccess}
                  placeholder="Informe o motivo pelo qual deseja solicitar o desbloqueio deste passageiro..."
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-[#35a989] focus:bg-white focus:ring-4 focus:ring-[#35a989]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {requestMessage && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium ${requestSuccess
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                    }`}
                >
                  {requestMessage}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeUnlockModal}
                  disabled={sendingRequest}
                  className="h-11 cursor-pointer rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={requestUnlock}
                  disabled={sendingRequest || requestSuccess}
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingRequest ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Enviando...
                    </>
                  ) : requestSuccess ? (
                    "Solicitação enviada"
                  ) : (
                    <>
                      <Send size={17} />
                      Solicitar desbloqueio
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}