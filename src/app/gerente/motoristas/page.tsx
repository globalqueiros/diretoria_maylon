"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Users,
  UserRoundPlus,
} from "lucide-react";

type Usuario = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  user_type?: string;
  is_active: string | number | boolean;
  profile_image?: string | null;
  created_at?: string | null;
};

type ApiResponse = { motoristas: Usuario[] };
type Filtro = "todos" | "ativos" | "inativos";

const POR_PAGINA = 10;

const estaAtivo = (v: Usuario["is_active"]) =>
  v === true ||
  v === 1 ||
  ["1", "true", "ativo", "active"].includes(
    String(v).toLowerCase()
  );

const formatPhone = (phone?: string) => {
  const d = (phone ?? "").replace(/\D/g, "");

  if (/^\d{13}$/.test(d)) {
    return d.replace(
      /^(\d{2})(\d{2})(\d{5})(\d{4})$/,
      "+$1 ($2) $3-$4"
    );
  }

  if (/^\d{11}$/.test(d)) {
    return d.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  if (/^\d{12}$/.test(d)) {
    return d.replace(
      /^(\d{2})(\d{2})(\d{4})(\d{4})$/,
      "+$1 ($2) $3-$4"
    );
  }

  if (/^\d{10}$/.test(d)) {
    return d.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      "($1) $2-$3"
    );
  }

  return phone || "—";
};

const formatData = (iso?: string | null) => {
  if (!iso) return "—";

  const data = new Date(iso);

  if (Number.isNaN(data.getTime())) return "—";

  return data.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
};

const iniciais = (nome?: string) => {
  const partes = (nome ?? "?").trim().split(/\s+/).filter(Boolean);

  if (partes.length === 0) return "?";

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
};

/**
 * Avatar que mostra as iniciais quando:
 * - Não existe foto cadastrada.
 * - O endereço da imagem é inválido.
 * - O servidor da imagem não responde.
 */
function AvatarMotorista({
  nome,
  foto,
}: {
  nome: string;
  foto?: string | null;
}) {
  const [erroImagem, setErroImagem] = useState(false);

  const urlFoto = foto?.trim();

  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-50 text-sm font-bold text-teal-700 ring-2 ring-slate-100"
      aria-label={`Foto de ${nome}`}
    >
      {urlFoto && !erroImagem ? (
        <img
          src={urlFoto}
          alt={`Foto de ${nome}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setErroImagem(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{iniciais(nome)}</span>
      )}
    </div>
  );
}

export default function MotoristasPage() {
  const [motoristas, setMotoristas] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [pagina, setPagina] = useState(1);

  const carregar = useCallback(async (manual = false) => {
    try {
      if (manual) {
        setAtualizando(true);
      } else {
        setLoading(true);
      }

      setErro(null);

      const res = await fetch("/api/motoristas", {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Sua sessão expirou ou você não tem permissão para acessar os motoristas."
            : "Não foi possível carregar os motoristas da sua carteira."
        );
      }

      const data: ApiResponse = await res.json();

      setMotoristas(
        Array.isArray(data.motoristas) ? data.motoristas : []
      );

      setPagina(1);
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Erro inesperado."
      );
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const qDigitos = q.replace(/\D/g, "");

    return motoristas.filter((m) => {
      const ativo = estaAtivo(m.is_active);

      if (filtro === "ativos" && !ativo) return false;
      if (filtro === "inativos" && ativo) return false;

      if (!q) return true;

      return (
        (m.full_name ?? "").toLowerCase().includes(q) ||
        (m.email ?? "").toLowerCase().includes(q) ||
        (qDigitos !== "" &&
          (m.phone ?? "").replace(/\D/g, "").includes(qDigitos))
      );
    });
  }, [motoristas, busca, filtro]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(filtrados.length / POR_PAGINA)
  );

  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;

  const visiveis = filtrados.slice(
    inicio,
    inicio + POR_PAGINA
  );

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Minha carteira
          </h1>
          <p className="mt-0 text-sm text-white/90">
            Gerencie os motoristas vinculados à sua carteira.
          </p>
        </div>
        <button
          type="button"
          onClick={() => carregar(true)}
          disabled={atualizando || loading}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-teal-800 shadow-lg transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              atualizando ? "animate-spin" : ""
            }`}
          />
          Atualizar
        </button>
      </header>

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-teal-950/10">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Users className="h-6 w-6" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Motoristas da minha carteira
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Consulte os dados e o status dos seus motoristas.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">
              Total de motoristas
            </p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {motoristas.length}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row">
          <label className="relative block w-full sm:max-w-md">
            <span className="sr-only">Buscar motorista</span>

            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por nome, e-mail ou telefone..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            />
          </label>

          <label className="relative block w-full sm:w-52">
            <span className="sr-only">Filtrar por status</span>

            <Filter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <select
              value={filtro}
              onChange={(e) => {
                setFiltro(e.target.value as Filtro);
                setPagina(1);
              }}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            >
              <option value="todos">Todos os status</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </label>
        </div>

        {loading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-4"
              >
                <div className="h-11 w-11 rounded-full bg-slate-100" />

                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 rounded bg-slate-100" />
                  <div className="h-3 w-56 max-w-full rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : erro ? (
          <div className="m-5 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-700">
              {erro}
            </p>

            <button
              type="button"
              onClick={() => carregar()}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-red-700 underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center sm:py-20">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-teal-700">
              {motoristas.length === 0 ? (
                <UserRoundPlus className="h-9 w-9" />
              ) : (
                <Search className="h-9 w-9" />
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              {motoristas.length === 0
                ? "Sua carteira está vazia"
                : "Nenhum motorista encontrado"}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {motoristas.length === 0
                ? "Nenhum motorista está vinculado à sua carteira no momento. Quando houver motoristas vinculados, eles aparecerão aqui."
                : "Não encontramos motoristas com os filtros informados. Tente alterar a busca ou selecionar outro status."}
            </p>

            {(busca || filtro !== "todos") && (
              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setFiltro("todos");
                  setPagina(1);
                }}
                className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-4">
                      Motorista
                    </th>

                    <th scope="col" className="px-5 py-4">
                      Contato
                    </th>

                    <th scope="col" className="px-5 py-4">
                      Status
                    </th>

                    <th scope="col" className="px-5 py-4">
                      Cadastro
                    </th>

                    <th
                      scope="col"
                      className="px-5 py-4 text-center"
                    >
                      Ação
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visiveis.map((m) => {
                    const ativo = estaAtivo(m.is_active);

                    return (
                      <tr
                        key={m.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <AvatarMotorista
                              nome={m.full_name}
                              foto={m.profile_image}
                            />

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {m.full_name}
                              </p>

                              <p className="truncate text-xs text-slate-500">
                                {m.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatPhone(m.phone)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                              ativo
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                ativo
                                  ? "bg-emerald-500"
                                  : "bg-red-500"
                              }`}
                            />

                            {ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                          {formatData(m.created_at)}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <Link
                            href={`/atendente/motoristas/${m.id}`}
                            aria-label={`Ver detalhes de ${m.full_name}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                          >
                            <Eye size={18} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Mostrando{" "}
                <b className="text-slate-800">
                  {inicio + 1}
                </b>{" "}
                até{" "}
                <b className="text-slate-800">
                  {Math.min(
                    inicio + POR_PAGINA,
                    filtrados.length
                  )}
                </b>{" "}
                de{" "}
                <b className="text-slate-800">
                  {filtrados.length}
                </b>{" "}
                motoristas
              </p>

              <nav
                aria-label="Paginação"
                className="flex items-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => setPagina(paginaAtual - 1)}
                  disabled={paginaAtual <= 1}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>

                <span className="text-sm text-slate-600">
                  Página{" "}
                  <b className="text-slate-900">
                    {paginaAtual}
                  </b>{" "}
                  de{" "}
                  <b className="text-slate-900">
                    {totalPaginas}
                  </b>
                </span>

                <button
                  type="button"
                  onClick={() => setPagina(paginaAtual + 1)}
                  disabled={paginaAtual >= totalPaginas}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próxima
                </button>
              </nav>
            </footer>
          </>
        )}
      </section>
    </main>
  );
}