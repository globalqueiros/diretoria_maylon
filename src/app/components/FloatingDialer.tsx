"use client";

import { useState } from "react";
import {
  Phone,
  PhoneOff,
  Search,
  X,
  Delete,
  Clock3,
  User,
  ChevronDown,
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
    phone: "(13) 4000-1000",
  },
  {
    name: "Central Operacional",
    phone: "(13) 4000-2000",
  },
  {
    name: "Ambulância",
    phone: "192",
  },
];

const userStatuses = [
  {
    label: "Online agora",
    color: "bg-green-400",
  },
  {
    label: "Offline",
    color: "bg-slate-400",
  },
  {
    label: "Em Reunião",
    color: "bg-yellow-400",
  },
  {
    label: "Ocupado",
    color: "bg-red-400",
  },
];

export default function FloatingDialer() {
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [userStatus, setUserStatus] = useState("Online agora");
  const [showStatus, setShowStatus] = useState(false);

  const handleAdd = (digit: string) => {
    setNumber((prev) => prev + digit);
  };

  const handleDelete = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (!number) return;
    alert(`Ligando para ${number}`);
  };

  const currentStatus = userStatuses.find(
    (status) => status.label === userStatus
  );

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow-[0_15px_40px_rgba(13,148,136,0.40)] transition-all hover:scale-110 sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
        >
          <Phone size={26} />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[999] flex items-end justify-end bg-black/30 p-0 backdrop-blur-sm sm:p-4 md:p-6">
          <div className="flex h-[100dvh] max-h-[100dvh] w-full max-w-[420px] flex-col overflow-hidden rounded-t-3xl border border-white/30 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.20)] sm:h-auto sm:max-h-[calc(100dvh-32px)] sm:rounded-3xl">
            <div className="shrink-0 bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-500 p-4 text-white sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 sm:h-12 sm:w-12">
                    <Phone size={20} />
                  </div>

                  <div className="relative">
                    <h3 className="font-semibold">
                      Central de Atendimento Maylon
                    </h3>

                    <button
                      onClick={() => setShowStatus(!showStatus)}
                      className="mt-1 flex cursor-pointer items-center gap-1.5 text-xs text-white/80 hover:text-white"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${currentStatus?.color}`}
                      />

                      <span>{userStatus}</span>

                      <ChevronDown size={13} />
                    </button>

                    {showStatus && (
                      <div className="absolute left-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl bg-white p-1 text-slate-700 shadow-xl">
                        {userStatuses.map((status) => (
                          <button
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
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-xl p-2 hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="border-b p-3 sm:p-4">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    placeholder="Buscar contato..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="px-4 pt-4 sm:px-5 sm:pt-5">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:p-4">
                  <input
                    value={number}
                    readOnly
                    placeholder="+55"
                    className="min-w-0 flex-1 bg-transparent text-center text-2xl font-light outline-none"
                  />

                  <button
                    onClick={handleDelete}
                    className="ml-2 shrink-0 cursor-pointer rounded-lg p-1 hover:bg-slate-200"
                  >
                    <Delete size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-4 sm:gap-3 sm:p-5">
                {keypad.map((key) => (
                  <button
                    key={key.number}
                    onClick={() => handleAdd(key.number)}
                    className="flex h-[64px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg active:scale-95 sm:h-20 sm:rounded-3xl"
                  >
                    <div className="text-2xl font-light sm:text-3xl">
                      {key.number}
                    </div>

                    <div className="text-[10px] text-slate-500 sm:text-xs">
                      {key.letters}
                    </div>
                  </button>
                ))}
              </div>

              <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                <div className="flex gap-3">
                  <button
                    onClick={handleCall}
                    className="flex min-w-0 flex-1 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 p-3 font-semibold text-white shadow-lg transition hover:brightness-105 active:scale-[0.98] sm:p-4"
                  >
                    <Phone size={18} className="mr-2 shrink-0" />
                    Ligar
                  </button>

                  <button
                    onClick={() => setNumber("")}
                    className="flex w-14 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-slate-300 hover:bg-slate-100"
                  >
                    <PhoneOff size={18} />
                  </button>
                </div>
              </div>

              <div className="border-t bg-slate-50 p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Clock3 size={16} className="text-slate-500" />

                  <span className="font-medium">
                    Chamadas Recentes
                  </span>
                </div>

                <div className="space-y-3">
                  {recentCalls.map((call) => (
                    <div
                      key={call.phone}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100">
                          <User
                            size={18}
                            className="text-teal-700"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {call.name}
                          </p>

                          <p className="truncate text-xs text-slate-500">
                            {call.phone}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setNumber(call.phone)}
                        className="shrink-0 cursor-pointer rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-700 hover:bg-teal-100"
                      >
                        Usar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
