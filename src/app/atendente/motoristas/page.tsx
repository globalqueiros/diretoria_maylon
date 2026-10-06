"use client";

import Link from "next/link";
<<<<<<< HEAD
import { Eye, LockKeyhole, RefreshCw, Search, UserRound, UsersRound, UnlockKeyhole, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Passageiro = {
  id: number | string;
  full_name: string;
  email?: string;
  phone?: string;
  user_type?: string;
  is_active: string | number | boolean;
  document?: string;
  document_number?: string;
  cpf?: string;
  passport?: string;
  created_at?: string;
  createdAt?: string;
  registration_date?: string;
  photo?: string;
  avatar?: string;
};

type ApiResponse = {
  motoristas: Passageiro[];
};

export default function motoristas() {
  const [motoristas, setmotoristas] = useState<Passageiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "bloqueados">("todos");

  const fetchmotoristas = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch("/api/motoristas", { cache: "no-store" });

      if (!res.ok) throw new Error("Erro ao buscar motoristas");

      const data: ApiResponse = await res.json();
      setmotoristas(data.motoristas || []);
    } catch (error) {
      console.error("Erro ao carregar motoristas:", error);
      setmotoristas([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchmotoristas();
  }, []);

  const isActive = (passageiro: Passageiro) => {
    return (
      passageiro.is_active === true ||
      passageiro.is_active === "true" ||
      passageiro.is_active === "1" ||
      passageiro.is_active === 1 ||
      String(passageiro.is_active).toLowerCase() === "ativo"
    );
  };

  const togglemotoristastatus = (id: number | string) => {
    setmotoristas((prev) =>
      prev.map((passageiro) => {
        if (String(passageiro.id) !== String(id)) return passageiro;
        const ativo = isActive(passageiro);
        return { ...passageiro, is_active: ativo ? "0" : "1" };
      })
    );
  };

  const formatPhone = (phone?: string) => {
    const numbers = phone?.replace(/\D/g, "");
    if (!numbers) return "-";
    if (numbers.length === 13) return numbers.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})$/, "+$1 $2 $3-$4");
    if (numbers.length === 11) return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    if (numbers.length === 10) return numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
    return phone || "-";
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    const names = name.trim().split(/\s+/);
    if (names.length === 1) return names[0].slice(0, 2).toUpperCase();
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString("pt-BR");
  };

  const getRegistrationDate = (passageiro: Passageiro) => {
    return passageiro.registration_date || passageiro.created_at || passageiro.createdAt || "";
  };

  const getDocument = (passageiro: Passageiro) => {
    return passageiro.document_number || passageiro.cpf || passageiro.passport || passageiro.document || "-";
  };

  const motoristasAtivos = motoristas.filter(isActive).length;
  const motoristasBloqueados = motoristas.length - motoristasAtivos;

  const motoristasFiltrados = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    return motoristas.filter((passageiro) => {
      const matchesSearch =
        !searchTerm ||
        passageiro.full_name?.toLowerCase().includes(searchTerm) ||
        passageiro.email?.toLowerCase().includes(searchTerm) ||
        passageiro.phone?.toLowerCase().includes(searchTerm) ||
        getDocument(passageiro).toLowerCase().includes(searchTerm);

      const active = isActive(passageiro);

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "ativos" && active) ||
        (statusFilter === "bloqueados" && !active);

      return matchesSearch && matchesStatus;
    });
  }, [motoristas, search, statusFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("todos");
  };

  const hasFilters = search.trim() !== "" || statusFilter !== "todos";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm px-10 py-8 flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-teal-100" />
            <div className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-800">Carregando motoristas</p>
            <p className="text-sm text-slate-500 mt-1">Aguarde enquanto carregamos os dados...</p>
          </div>
=======
import { Eye } from "lucide-react";
import { useEffect, useState } from "react";

type Usuario = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  user_type: string;
  is_active: string;
};

type ApiResponse = {
  motoristas: Usuario[];
  passageiros: Usuario[];
};

export default function Usuarios() {
  const [motoristas, setMotoristas] = useState<Usuario[]>([]);
  const [passageiros, setPassageiros] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await fetch("/api/motoristas");

        const data: ApiResponse = await res.json();

        setMotoristas(data.motoristas || []);
        setPassageiros(data.passageiros || []);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>

          <p className="text-gray-500 font-medium">
            Aguarde, carregando página...
          </p>
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
        </div>
      </div>
    );
  }

<<<<<<< HEAD
  return (
    <div className="min-h-screen">
      <div className="w-full mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Motoristas</h1>
            <p className="text-sm text-white/95 mt-1">Gerencie os motoristas cadastrados na plataforma.</p>
          </div>
          <button
            type="button"
            onClick={() => fetchmotoristas(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-white text-teal-600 text-sm font-semibold shadow-sm hover:bg-slate-50 transition disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total de motoristas</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{motoristas.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center">
                <UsersRound size={22} className="text-teal-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Motoristas ativos</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{motoristasAtivos}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <UserRound size={22} className="text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Bloqueados</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{motoristasBloqueados}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                <UserRound size={22} className="text-red-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1">
              <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Digite o nome ou número de telefone..."
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm text-slate-800 placeholder:text-slate-400 transition focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setStatusFilter("todos")}
                className={`h-11 px-5 rounded-xl text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === "todos" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Todos ({motoristas.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("ativos")}
                className={`h-11 px-5 rounded-xl text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === "ativos" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                Ativos ({motoristasAtivos})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("bloqueados")}
                className={`h-11 px-5 rounded-xl text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === "bloqueados" ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100"
                }`}
              >
                Bloqueados ({motoristasBloqueados})
              </button>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-11 w-11 flex-shrink-0 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
                  title="Limpar filtros"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {motoristasFiltrados.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-14 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
              <UsersRound size={28} className="text-slate-400" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-slate-800">Nenhum motorista encontrado</h2>
            <p className="text-sm text-slate-500 mt-2">Tente alterar os filtros ou realizar uma nova busca.</p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="hidden lg:grid grid-cols-[2.2fr_1.7fr_1fr_0.9fr_0.9fr_110px] gap-4 px-5 py-4 bg-slate-50 border-b border-slate-200 text-[12px] font-bold uppercase tracking-wide text-slate-500">
              <div>Motorista</div>
              <div>Contato</div>
              <div>Documento</div>
              <div>Cadastro</div>
              <div>Status</div>
              <div className="text-center">Ações</div>
            </div>

            <div className="divide-y divide-slate-100">
              {motoristasFiltrados.map((item) => {
                const active = isActive(item);

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 lg:grid-cols-[2.2fr_1.7fr_1fr_0.9fr_0.9fr_110px] gap-4 px-5 py-4 items-center hover:bg-slate-50/70 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.photo || item.avatar ? (
                        <img
                          src={item.photo || item.avatar}
                          alt={item.full_name}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold flex-shrink-0">
                          {getInitials(item.full_name)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{item.full_name || "Não informado"}</p>
                        <p className="text-[11px] text-slate-500 mt-1 truncate">ID #{item.id}</p>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 truncate">{item.email || "-"}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatPhone(item.phone)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-700 truncate">{getDocument(item)}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{item.passport ? "Passaporte" : "Documento"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-700">{formatDate(getRegistrationDate(item))}</p>
                    </div>

                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-red-500"}`} />
                        {active ? "Ativo" : "Bloqueado"}
                      </span>
                    </div>

                    <div className="flex items-center justify-start lg:justify-end gap-2">
                      <Link
                        href={`/atendente/motoristas/${item.id}`}
                        title="Visualizar motorista"
                        className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white flex items-center justify-center transition cursor-pointer"
                      >
                        <Eye size={18} />
                      </Link>

                      <button
                        type="button"
                        title={active ? "Bloquear motorista" : "Desbloquear motorista"}
                        onClick={() => togglemotoristastatus(item.id)}
                        className={`w-10 h-10 cursor-pointer rounded-xl flex items-center justify-center transition ${
                          active
                            ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                            : "bg-red-100 text-red-600 hover:bg-red-500 hover:text-white"
                        }`}
                      >
                        {active ? <LockKeyhole size={18} /> : <UnlockKeyhole size={18} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-4 bg-slate-50 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Exibindo{" "}
                <span className="font-semibold text-slate-800">{motoristasFiltrados.length}</span>{" "}
                de{" "}
                <span className="font-semibold text-slate-800">{motoristas.length}</span>{" "}
                motoristas
              </p>
            </div>
          </div>
        )}
=======
  const formatPhone = (phone: string) => {
    return phone
      ?.replace(/\D/g, "")
      .replace(
        /^(\d{2})(\d{2})(\d{5})(\d{4})$/,
        "+$1 ($2) $3-$4"
      );
  };

  return (
    <div className="p-6 space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Motorista
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Lista de motoristas cadastrados
            </p>
          </div>
          <div className="bg-teal-50 text-teal-700 px-4 py-2 rounded-xl text-sm font-semibold">
            {motoristas.length} Motoristas
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {motoristas.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 bg-red-600 text-white text-center text-red-500"
                  >
                    Nenhum motorista encontrado
                  </td>
                </tr>
              ) : (
                motoristas.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      {item.full_name}
                    </td>

                    <td className="px-6 py-4">
                      {item.email}
                    </td>

                    <td className="px-6 py-4">
                      {formatPhone(item.phone)}
                    </td>

                    <td className="px-6 py-4">
                      {item.is_active ? (
                        <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-700">
                          Inativo
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/motoristas/detalhes/${item.id}`}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-100 hover:text-teal-700 transition-all"
                      >
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
      </div>
    </div>
  );
}