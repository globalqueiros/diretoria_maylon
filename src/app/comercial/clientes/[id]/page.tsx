"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  Calendar,
  Check,
  CircleAlert,
  Copy,
  FileText,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  UserRound,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Status: 0 = Ativo | 1 = Inativo                                     */
/* ------------------------------------------------------------------ */

type StatusInfo = { label: string; badge: string; dot: string };

function resolverStatus(status: unknown): StatusInfo {
  // tinyint(1) pode chegar como boolean dependendo do driver/ORM:
  // false = 0 = Ativo | true = 1 = Inativo
  const valor =
    status === false
      ? "0"
      : status === true
      ? "1"
      : String(status ?? "").trim().toLowerCase();

  if (valor === "0" || valor === "ativo") {
    return {
      label: "Ativo",
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      dot: "bg-emerald-500",
    };
  }

  if (valor === "1" || valor === "inativo") {
    return {
      label: "Inativo",
      badge: "bg-slate-100 text-slate-600 ring-slate-500/20",
      dot: "bg-slate-400",
    };
  }

  return {
    label: "Não informado",
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  };
}

/* ------------------------------------------------------------------ */
/* Formatadores                                                        */
/* ------------------------------------------------------------------ */

function formatarDocumento(valor?: string | null) {
  if (!valor) return null;
  const n = valor.replace(/\D/g, "");

  if (n.length === 11) {
    return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (n.length === 14) {
    return n.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5"
    );
  }
  return valor;
}

function formatarTelefone(valor?: string | null) {
  if (!valor) return null;
  const n = valor.replace(/\D/g, "");

  if (n.length === 11) return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (n.length === 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return valor;
}

function formatarTipo(valor?: string | null) {
  if (!valor) return null;
  const v = valor.trim().toLowerCase();

  if (["f", "pf", "fisica", "física", "pessoa fisica", "pessoa física"].includes(v))
    return "Pessoa física";
  if (["j", "pj", "juridica", "jurídica", "pessoa juridica", "pessoa jurídica"].includes(v))
    return "Pessoa jurídica";
  return valor;
}

// A tabela não tem coluna "tipo": deduz pelo tamanho do documento.
function tipoPorDocumento(valor?: string | null) {
  if (!valor) return null;
  const n = valor.replace(/\D/g, "");
  if (n.length === 11) return "Pessoa física";
  if (n.length === 14) return "Pessoa jurídica";
  return null;
}

function formatarData(valor?: string | null) {
  if (!valor) return null;
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return null;

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function iniciais(nome?: string | null) {
  if (!nome) return "?";
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Componentes                                                         */
/* ------------------------------------------------------------------ */

function BotaoCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* sem permissão para a área de transferência */
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={copiado ? "Copiado" : "Copiar"}
      title={copiado ? "Copiado" : "Copiar"}
      className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
    >
      {copiado ? (
        <Check size={15} className="text-emerald-600" />
      ) : (
        <Copy size={15} />
      )}
    </button>
  );
}

function Campo({
  label,
  valor,
  icon,
  copiavel = false,
}: {
  label: string;
  valor?: string | null;
  icon: React.ReactNode;
  copiavel?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p
          className={`mt-0.5 break-words text-sm font-semibold ${
            valor ? "text-slate-900" : "font-normal italic text-slate-400"
          }`}
        >
          {valor || "Não informado"}
        </p>
      </div>

      {copiavel && valor ? <BotaoCopiar texto={valor} /> : null}
    </div>
  );
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
      <h2 className="border-b border-slate-100 px-6 py-4 text-base font-semibold text-slate-900">
        {titulo}
      </h2>
      <div className="divide-y divide-slate-100 px-6">{children}</div>
    </section>
  );
}

function Esqueleto() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true">
      <div className="h-32 rounded-2xl bg-white/80" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-2xl bg-white/80" />
        <div className="h-72 rounded-2xl bg-white/80" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function DetalhesCliente() {
  const params = useParams();
  const id = params.id;

  const [cliente, setCliente] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const buscarCliente = useCallback(async () => {
    setLoading(true);
    setErro("");

    try {
      const response = await fetch(`/api/clientes/${id}`);

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "Cliente não encontrado."
            : "Erro ao consultar o servidor."
        );
      }

      setCliente(await response.json());
    } catch (error: any) {
      setErro(error?.message || "Não foi possível carregar o cliente.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    buscarCliente();
  }, [buscarCliente]);

  const voltar = (
    <Link
      href="/comercial/clientes"
      className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3.5 py-2 text-sm font-medium text-white ring-1 ring-white/25 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
    >
      <ArrowLeft size={16} />
      Voltar para clientes
    </Link>
  );

  return (
    <main className="min-h-screen">
      <div className="pb-24 pt-6 pl-5">
        <div className="mx-auto max-w-8xl">
          {voltar}

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Detalhes do cliente
          </h1>
          <p className="mt-1 text-sm text-teal-50">
            Consulte os dados cadastrais e o status do cliente. Qualquer alteração deve ser feita solicitando ao gerente.
          </p>
        </div>
      </div>
      <div className="mx-auto -mt-16 max-w-8xl px-4 pb-12 md:px-6">
        {loading ? (
          <Esqueleto />
        ) : erro || !cliente ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200/70">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <CircleAlert size={28} />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Não foi possível abrir este cliente
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {erro || "Cliente não encontrado."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={buscarCliente}
                className="inline-flex items-center gap-2 rounded-lg bg-[#168578] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                <RefreshCw size={16} />
                Tentar novamente
              </button>
              <Link
                href="/comercial/clientes"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50"
              >
                Voltar para clientes
              </Link>
            </div>
          </div>
        ) : (
          <ClienteConteudo cliente={cliente} />
        )}
      </div>
    </main>
  );
}

function ClienteConteudo({ cliente }: { cliente: any }) {
  const status = resolverStatus(cliente.status);
  const documento: string | null = cliente.cpf ?? cliente.documento ?? null;
  const criadoEm: string | null = cliente.criado_em ?? cliente.createdAt ?? null;
  const tipo = formatarTipo(cliente.tipo) ?? tipoPorDocumento(documento);
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70">
        <div className="flex min-w-0 items-center gap-4">
          <div
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#168578] text-xl font-bold text-white"
          >
            {iniciais(cliente.nome)}
          </div>
          <div className="min-w-0">
            <h2 className="break-words text-xl font-bold text-slate-900">
              {cliente.nome || "Sem nome"}
            </h2>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-inset ${status.badge}`}
        >
          <span className={`h-2 w-2 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <Secao titulo="Dados cadastrais">
          <Campo
            label="Nome completo / Razão social"
            valor={cliente.nome}
            icon={<UserRound size={18} />}
          />
          <Campo
            label="CPF / CNPJ"
            valor={formatarDocumento(documento)}
            icon={<FileText size={18} />}
            copiavel
          />
          <Campo
            label="Tipo de pessoa"
            valor={tipo}
            icon={<FileText size={18} />}
          />
        </Secao>

        <Secao titulo="Contato e localização">
          <Campo
            label="E-mail"
            valor={cliente.email}
            icon={<Mail size={18} />}
            copiavel
          />
          <Campo
            label="Telefone"
            valor={formatarTelefone(cliente.telefone)}
            icon={<Phone size={18} />}
            copiavel
          />
          <Campo
            label="Cidade / Estado"
            valor={cliente.cidade}
            icon={<MapPin size={18} />}
          />
        </Secao>
      </div>

      <Secao titulo="Cadastro">
        <Campo
          label="Data de cadastro"
          valor={formatarData(criadoEm)}
          icon={<Calendar size={18} />}
        />
      </Secao>
    </div>
  );
}