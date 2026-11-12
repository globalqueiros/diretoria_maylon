
"use client";

import { useMemo, useState } from "react";
import {
  Phone,
  PhoneOff,
  Search,
  X,
  Delete,
  Clock3,
  User,
  ChevronDown,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const keypad = [
  { number: "1", letters: "" },
  { number: "2", letters: "ABC" },
  { number: "3", letters: "DEF" },
  { number: "4", letters: "GHI" },
  { number: "5", letters: "JKL" },
  { number: "6", letters: "MNO" },
  { number: "7", letters: "PQRS" },
  { number: "8", letters: "TUV" },
  { number: "9", letters: "WXYZ" },
  { number: "*", letters: "" },
  { number: "0", letters: "+" },
  { number: "#", letters: "" },
];

const recentCalls = [
  {
    name: "Suporte Maylon",
    phone: "1340001000",
  },
  {
    name: "Central Operacional",
    phone: "1340002000",
  },
];

const userStatuses = [
  { label: "Online agora", color: "bg-green-400" },
  { label: "Offline", color: "bg-slate-400" },
  { label: "Em Reunião", color: "bg-yellow-400" },
  { label: "Ocupado", color: "bg-red-400" },
];

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }

  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }

  return value;
}

export default function FloatingDialer() {
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [search, setSearch] = useState("");
  const [userStatus, setUserStatus] = useState("Online agora");
  const [showStatus, setShowStatus] = useState(false);
  const [calling, setCalling] = useState(false);
  const [callMessage, setCallMessage] = useState("");
  const [callError, setCallError] = useState("");

  const currentStatus = userStatuses.find(
    (status) => status.label === userStatus
  );

  const filteredCalls = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return recentCalls;

    return recentCalls.filter(
      (call) =>
        call.name.toLowerCase().includes(term) ||
        call.phone.includes(term.replace(/\D/g, ""))
    );
  }, [search]);

  function handleAdd(digit: string) {
    setNumber((previous) => {
      if (previous.length >= 20) return previous;
      return previous + digit;
    });

    setCallMessage("");
    setCallError("");
  }

  function handleDelete() {
    setNumber((previous) => previous.slice(0, -1));
    setCallMessage("");
    setCallError("");
  }

  function handleClear() {
    setNumber("");
    setCallMessage("");
    setCallError("");
  }

  async function handleCall() {
    const destination = number.replace(/\D/g, "");

    setCallMessage("");
    setCallError("");

    if (destination.length < 10 || destination.length > 15) {
      setCallError(
        "Informe um telefone válido com DDD. Para números internacionais, inclua o código do país."
      );
      return;
    }

    if (calling) return;

    setCalling(true);

    try {
      const response = await fetch("/api/nvoip/calls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ destination }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error ||
          data?.message ||
          "Não foi possível solicitar a ligação."
        );
      }

      setCallMessage(
        data.message || "Solicitação enviada à Nvoip."
      );
    } catch (error) {
      setCallError(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao solicitar a ligação."
      );
    } finally {
      setCalling(false);
    }
  }

  function useContact(phone: string) {
    setNumber(phone);
    setCallMessage("");
    setCallError("");
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          aria-label="Abrir discador telefônico"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow-[0_15px_40px_rgba(13,148,136,0.40)] transition-all hover:scale-110 sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
        >
          <Phone size={26} />
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[999] flex items-end justify-end bg-black/30 p-0 backdrop-blur-sm sm:p-4 md:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !calling) {
              setOpen(false);
              setShowStatus(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Discador Maylon"
            className="flex h-[100dvh] max-h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden rounded-t-3xl border border-white/30 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.20)] sm:h-auto sm:max-h-[calc(100dvh-32px)] sm:rounded-3xl"
          >
            {/* Cabeçalho */}
            <header className="shrink-0 bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-500 p-4 text-white sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 sm:h-12 sm:w-12">
                    <Phone size={20} />
                  </div>

                  <div className="relative min-w-0">
                    <h3 className="font-semibold">
                      Central de Atendimento Maylon
                    </h3>

                    <button
                      type="button"
                      onClick={() => setShowStatus((previous) => !previous)}
                      className="mt-1 flex cursor-pointer items-center gap-1.5 text-xs text-white/80 hover:text-white"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${currentStatus?.color ?? "bg-slate-400"}`}
                      />
                      <span>{userStatus}</span>
                      <ChevronDown size={13} />
                    </button>

                    {showStatus && (
                      <div className="absolute left-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl bg-white p-1 text-slate-700 shadow-xl">
                        {userStatuses.map((status) => (
                          <button
                            type="button"
                            key={status.label}
                            onClick={() => {
                              setUserStatus(status.label);
                              setShowStatus(false);
                            }}
                            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
                          >
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${status.color}`}
                            />
                            <span>{status.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Fechar discador"
                  disabled={calling}
                  onClick={() => {
                    setOpen(false);
                    setShowStatus(false);
                  }}
                  className="cursor-pointer rounded-xl p-2 hover:bg-white/10 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>
            </header>

            {/* Conteúdo rolável */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* Pesquisa de contato */}
              <div className="border-b p-3 sm:p-4">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar contato..."
                    aria-label="Buscar contato"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="px-4 pt-4 sm:px-5 sm:pt-5">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 sm:p-4">
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={number}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (/^[0-9+*#().\s-]*$/.test(value) && value.length <= 20) {
                        setNumber(value);
                        setCallMessage("");
                        setCallError("");
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleCall();
                      }
                    }}
                    placeholder="Digite o telefone"
                    aria-label="Número de telefone"
                    className="min-w-0 flex-1 bg-transparent text-center text-xl font-light outline-none sm:text-2xl"
                  />

                  <button
                    type="button"
                    aria-label="Apagar último dígito"
                    onClick={handleDelete}
                    disabled={!number || calling}
                    className="ml-2 shrink-0 cursor-pointer rounded-lg p-1 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Delete size={20} />
                  </button>
                </div>
              </div>


              {/* Teclado */}
              <div className="grid grid-cols-3 gap-2 p-4 sm:gap-3 sm:p-5">
                {keypad.map((key) => (
                  <button
                    type="button"
                    key={key.number}
                    onClick={() => handleAdd(key.number)}
                    disabled={calling}
                    className="flex h-[64px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-20 sm:rounded-3xl"
                  >
                    <span className="text-2xl font-light sm:text-3xl">
                      {key.number}
                    </span>
                    <span className="text-[10px] text-slate-500 sm:text-xs">
                      {key.letters}
                    </span>
                  </button>
                ))}
              </div>

              {/* Ações de chamada */}
              <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCall}
                    disabled={calling}
                    className="flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 p-3 font-semibold text-white shadow-lg transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:p-4"
                  >
                    {calling ? (
                      <LoaderCircle
                        size={18}
                        className="mr-2 animate-spin"
                      />
                    ) : (
                      <Phone size={18} className="mr-2 shrink-0" />
                    )}
                    {calling ? "Solicitando..." : "Ligar"}
                  </button>

                  <button
                    type="button"
                    aria-label="Limpar número"
                    onClick={handleClear}
                    disabled={calling}
                    className="flex w-14 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-slate-300 hover:bg-slate-100 disabled:opacity-50"
                  >
                    <PhoneOff size={18} />
                  </button>
                </div>

                {callMessage && (
                  <div
                    role="status"
                    className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
                  >
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    <span>{callMessage}</span>
                  </div>
                )}

                {callError && (
                  <div
                    role="alert"
                    className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{callError}</span>
                  </div>
                )}
              </div>

              {/* Contatos recentes */}
              <div className="border-t bg-slate-50 p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Clock3 size={16} className="text-slate-500" />
                  <span className="font-medium">Contatos rápidos</span>
                </div>

                <div className="space-y-3">
                  {filteredCalls.length > 0 ? (
                    filteredCalls.map((contact) => (
                      <div
                        key={contact.phone}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100">
                            <User size={18} className="text-teal-700" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {contact.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {formatPhone(contact.phone)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => useContact(contact.phone)}
                          disabled={calling}
                          className="shrink-0 cursor-pointer rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-700 hover:bg-teal-100 disabled:opacity-50"
                        >
                          Usar
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl bg-white p-4 text-center text-sm text-slate-500">
                      Nenhum contato encontrado.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
