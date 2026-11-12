
"use client";

import { ArrowLeft, BadgeCheck, CalendarDays, CheckCircle2, Clock3, Edit3, FileText, Hash, Lock, LockOpen, Mail, MapPin, Phone, RefreshCw, ShieldAlert, Star, UserRound } from "lucide-react";
import Motorista from "../motoristas/Motorista";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

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
  verification?: Verificacao;
  error?: string;
  message?: string;
};

type VerificacaoDocumento = {
  status?: string | null;
  didit_status?: string | null;
  is_verified?: boolean | null;
  identity_match?: unknown;
  documento_tipo?: string | null;
};

type ProvaVida = {
  devida?: boolean | null;
  last_liveness_at?: string | null;
};

type Verificacao = {
  documento?: VerificacaoDocumento | null;
  prova_vida?: ProvaVida | null;
};

function formatarData(data?: string | null): string {
  if (!data) return "—";
  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return data;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatarDataHora(data?: string | null): string {
  if (!data) return "—";
  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return data;
  return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatarTelefone(telefone?: string | null): string {
  if (!telefone) return "—";
  const numeros = String(telefone).replace(/\D/g, "");
  if (!numeros) return "—";
  const numeroBR = numeros.startsWith("55") && numeros.length >= 12 ? numeros.slice(2) : numeros;
  if (numeroBR.length === 11) return numeroBR.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (numeroBR.length === 10) return numeroBR.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  if (numeroBR.length === 9) return numeroBR.replace(/^(\d{5})(\d{4})$/, "$1-$2");
  if (numeroBR.length === 8) return numeroBR.replace(/^(\d{4})(\d{4})$/, "$1-$2");
  return telefone;
}

function getNome(usuario: Usuario): string {
  return usuario.nome || usuario.name || "Usuário";
}

function getEmail(usuario: Usuario): string {
  return usuario.email || usuario.email_address || usuario.mail || usuario.email_usuario || "—";
}

function getTelefone(usuario: Usuario): string {
  return usuario.telefone || usuario.phone || "";
}

function getFoto(usuario: Usuario): string {
  return usuario.foto_url || usuario.foto || usuario.avatar || "";
}

function getAvaliacao(usuario: Usuario): string {
  const valor = usuario.avaliacao ?? usuario.rating;
  if (valor === null || valor === undefined || valor === "") return "—";
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero.toFixed(1) : String(valor);
}

function getLocalizacao(usuario: Usuario): string {
  const partes = [usuario.cidade, usuario.estado].filter(Boolean);
  return partes.length ? partes.join(" - ") : "—";
}

function estaBloqueado(usuario: Usuario): boolean {
  return usuario.bloqueado === true || Number(usuario.is_active) === 0 || Number(usuario.is_temp_blocked) === 1 || Boolean(usuario.blocked_at);
}

type TipoTela = "driver" | "customer";

function identificarTela(usuario: Usuario): TipoTela {
  const valor = String(usuario.tipo ?? usuario.type ?? "").trim().toLowerCase();
  const ehMotorista = valor === "driver" || valor === "drivers" || valor === "motorista" || valor === "motoristas" || valor.includes("driver") || valor.includes("motorista");
  return ehMotorista ? "driver" : "customer";
}

export default function VisualizacaoUsuarioClient() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : String(params?.id ?? "");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verificacao, setVerificacao] = useState<Verificacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!id) {
      setErro("ID do usuário não informado.");
      setLoading(false);
      return;
    }

    let ativo = true;

    async function carregarUsuario() {
      try {
        setLoading(true);
        setErro("");
        const response = await fetch(`/api/usuarios/${encodeURIComponent(id)}`, {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" }
        });

        const texto = await response.text();
        let data: ApiResponse = {};

        if (texto) {
          try {
            data = JSON.parse(texto);
          } catch {
            throw new Error(`A API não retornou JSON. Status: ${response.status}.`);
          }
        }

        if (!response.ok) {
          throw new Error(data.error || data.message || `Erro ${response.status} ao buscar usuário.`);
        }

        const encontrado = data.usuario ?? data.data ?? data.user;

        if (!encontrado) {
          throw new Error("A API respondeu, mas não enviou os dados do usuário.");
        }

        if (!ativo) return;
        setUsuario(encontrado);
        setVerificacao(data.verification ?? null);
      } catch (error) {
        if (!ativo) return;
        setErro(error instanceof Error ? error.message : "Erro ao carregar usuário.");
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarUsuario();
    return () => {
      ativo = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div role="status" aria-live="polite" className="flex w-full max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-white px-8 py-14 shadow-sm">
          <div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
          <p className="mt-5 text-sm font-medium text-slate-600">Carregando dados do usuário...</p>
        </div>
      </main>
    );
  }

  if (erro || !usuario) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <ShieldAlert size={26} className="text-red-500" />
          </div>
          <h1 className="mt-5 text-lg font-bold text-slate-900">Não foi possível abrir o usuário</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Verifique sua conexão e tente novamente.</p>
          {erro && <p className="mt-5 break-words rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-left text-sm text-red-700">{erro}</p>}
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => router.back()} className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
              <ArrowLeft size={16} />
              Voltar
            </button>
            <button type="button" onClick={() => window.location.reload()} className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
              <RefreshCw size={16} />
              Tentar novamente
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (identificarTela(usuario) === "driver") {
    return <Motorista usuario={usuario} verificacao={verificacao} />;
  }

  return <CustomerView usuario={usuario} />;
}

function CustomerView({ usuario }: { usuario: Usuario }) {
  const router = useRouter();
  const nome = getNome(usuario);
  const telefone = getTelefone(usuario);
  const email = getEmail(usuario);
  const foto = getFoto(usuario);
  const bloqueado = estaBloqueado(usuario);
  const localizacao = getLocalizacao(usuario);
  const avaliacao = getAvaliacao(usuario);

  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-8xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Detalhes do passageiro</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => router.back()} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
              <ArrowLeft size={16} />
              Voltar
            </button>
            <button type="button" className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
              <FileText size={16} />
              Histórico de atividades
            </button>
            <button type="button" className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${bloqueado ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:outline-emerald-600" : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 focus-visible:outline-red-500"}`}>
              {bloqueado ? <LockOpen size={16} /> : <Lock size={16} />}
              {bloqueado ? "Desbloquear" : "Bloquear"}
            </button>
            <button type="button" className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
              <Edit3 size={16} />
              Editar
            </button>
          </div>
        </header>

        {bloqueado && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-red-500" />
            <div className="text-sm">
              <p className="font-semibold text-red-700">Este passageiro está bloqueado</p>
              <p className="mt-0.5 text-red-600/90">
                {usuario.blocked_at ? `Bloqueado em ${formatarDataHora(usuario.blocked_at)}.` : "Ele não consegue solicitar corridas enquanto o bloqueio estiver ativo."}
              </p>
            </div>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-24 bg-gradient-to-r from-emerald-600 to-teal-500 md:h-28" />
          <div className="px-6 pb-6 md:px-8">
            <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="relative w-fit">
                <Avatar nome={nome} foto={foto} />
                <span title={bloqueado ? "Bloqueado" : "Ativo"} className={`absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full border-2 border-white ${bloqueado ? "bg-red-500" : "bg-emerald-500"}`} />
              </div>
              <div className="min-w-0 flex-1 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-bold tracking-tight text-slate-900">{nome}</h2>
                  <StatusBadge bloqueado={bloqueado} />
                </div>
                <p className="mt-1 text-sm text-slate-500">Passageiro · ID {usuario.id}</p>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-1 divide-y divide-slate-100 rounded-xl border border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <Resumo icon={<CalendarDays size={16} />} label="Cliente desde" value={formatarData(usuario.created_at)} />
              <Resumo icon={<Star size={16} />} label="Avaliação" value={avaliacao} />
              <Resumo icon={<BadgeCheck size={16} />} label="Situação da conta" value={bloqueado ? "Bloqueada" : "Ativa"} />
            </dl>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Painel className="lg:col-span-2" icon={<UserRound size={18} />} titulo="Informações de contato" descricao="Dados usados para comunicação com o passageiro">
            <dl className="divide-y divide-slate-100">
              <Linha icon={<Phone size={16} />} label="Telefone" value={formatarTelefone(telefone)} />
              <Linha icon={<Mail size={16} />} label="E-mail" value={email} />
              <Linha icon={<MapPin size={16} />} label="Localização" value={localizacao} />
            </dl>
          </Painel>

          <Painel icon={<Hash size={18} />} titulo="Dados da conta" descricao="Identificação e histórico de cadastro">
            <dl className="divide-y divide-slate-100">
              <Linha label="ID do usuário" value={usuario.id} mono />
              <Linha label="Código de indicação" value={usuario.ref_code || "—"} mono />
              <Linha icon={<Clock3 size={16} />} label="Cadastrado em" value={formatarDataHora(usuario.created_at)} />
              <Linha icon={<RefreshCw size={16} />} label="Última atualização" value={formatarDataHora(usuario.updated_at)} />
            </dl>
          </Painel>
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ bloqueado }: { bloqueado: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${bloqueado ? "bg-red-50 text-red-600 ring-red-100" : "bg-emerald-50 text-emerald-700 ring-emerald-100"}`}>
      {bloqueado ? <Lock size={12} /> : <CheckCircle2 size={12} />}
      {bloqueado ? "Bloqueado" : "Ativo"}
    </span>
  );
}

function Avatar({ nome, foto }: { nome: string; foto: string }) {
  const iniciais = nome.split(" ").filter(Boolean).slice(0, 2).map((item) => item[0]).join("").toUpperCase();

  if (foto) {
    return (
      <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-md md:h-32 md:w-32">
        <img src={foto} alt={nome} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 shadow-md md:h-32 md:w-32">
      <span className="text-3xl font-bold text-slate-400">{iniciais || <UserRound size={40} />}</span>
    </div>
  );
}

function Resumo({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">{icon}</div>
      <div className="min-w-0">
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="truncate text-sm font-semibold text-slate-900">{value}</dd>
      </div>
    </div>
  );
}

function Painel({ icon, titulo, descricao, children, className = "" }: { icon: ReactNode; titulo: string; descricao: string; children: ReactNode; className?: string }) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">{icon}</div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{titulo}</h3>
          <p className="text-xs text-slate-500">{descricao}</p>
        </div>
      </div>
      <div className="px-6">{children}</div>
    </section>
  );
}

function Linha({ icon, label, value, mono = false }: { icon?: ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className="flex items-center gap-2 text-sm text-slate-500">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </dt>
      <dd className={`break-words text-sm font-medium text-slate-900 sm:text-right ${mono ? "font-mono text-[13px]" : ""}`}>{value}</dd>
    </div>
  );
}
