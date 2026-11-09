import type { ReactNode } from "react";

import type { Prioridade, Status } from "./protocolos";

export const STATUS_LABEL: Record<Status, string> = {
  aberto: "Aberto",
  andamento: "Em andamento",
  aguardando: "Aguardando resposta",
  encerrado: "Encerrado",
};

export const STATUS_STYLE: Record<Status, string> = {
  aberto: "bg-emerald-50 text-emerald-700",
  andamento: "bg-yellow-50 text-yellow-700",
  aguardando: "bg-sky-50 text-sky-700",
  encerrado: "bg-red-50 text-red-700",
};

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const PRIORIDADE_STYLE: Record<Prioridade, string> = {
  baixa: "bg-slate-100 text-slate-600",
  media: "bg-amber-50 text-amber-700",
  alta: "bg-red-50 text-red-700",
};

export function normalizarTexto(valor: string | null | undefined): string {
  return (valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function normalizarStatus(valor: string | null | undefined): Status | string {
  const status = normalizarTexto(valor);

  if (["aberto", "abertos"].includes(status)) {
    return "aberto";
  }

  if (["andamento", "em andamento"].includes(status)) {
    return "andamento";
  }

  if (
    [
      "aguardando",
      "aguardando resposta",
      "aguardando resposta do usuario",
      "aguardando resposta do passageiro",
      "aguardando resposta do motorista",
      "aguardando retorno",
    ].includes(status)
  ) {
    return "aguardando";
  }

  if (
    [
      "encerrado",
      "encerrados",
      "encerrada",
      "encerradas",
      "finalizado",
      "finalizados",
      "finalizada",
      "finalizadas",
      "fechado",
      "fechados",
      "fechada",
      "fechadas",
    ].includes(status)
  ) {
    return "encerrado";
  }

  return status;
}

export function obterStatusValido(
  valor: string | null | undefined
): Status | null {
  const status = normalizarStatus(valor);

  if (
    status === "aberto" ||
    status === "andamento" ||
    status === "aguardando" ||
    status === "encerrado"
  ) {
    return status;
  }

  return null;
}

export function normalizarPrioridade(
  valor: string | null | undefined
): Prioridade | null {
  const prioridade = normalizarTexto(valor);

  if (prioridade === "baixa") return "baixa";
  if (prioridade === "media") return "media";
  if (prioridade === "alta") return "alta";

  return null;
}

export function textoSeguro(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  return String(valor);
}

/* Lê a mensagem de erro devolvida pela API (se houver) */
export async function lerErroDaApi(
  res: Response,
  padrao: string
): Promise<string> {
  try {
    const corpo = (await res.json()) as {
      error?: string;
      erro?: string;
      message?: string;
      mensagem?: string;
    };

    return (
      corpo?.error ??
      corpo?.erro ??
      corpo?.message ??
      corpo?.mensagem ??
      `${padrao} (erro ${res.status})`
    );
  } catch {
    return `${padrao} (erro ${res.status})`;
  }
}

/* Etiqueta base */
function Etiqueta({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-1 text-[11px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ valor }: { valor: string | null | undefined }) {
  const statusNormalizado = obterStatusValido(valor);

  return (
    <Etiqueta
      className={
        statusNormalizado
          ? STATUS_STYLE[statusNormalizado]
          : "bg-slate-100 text-slate-600"
      }
    >
      {statusNormalizado
        ? STATUS_LABEL[statusNormalizado]
        : valor || "Não informado"}
    </Etiqueta>
  );
}

export function PrioridadeBadge({
  valor,
}: {
  valor: string | null | undefined;
}) {
  const prioridadeNormalizada = normalizarPrioridade(valor);

  return (
    <Etiqueta
      className={
        prioridadeNormalizada
          ? PRIORIDADE_STYLE[prioridadeNormalizada]
          : "bg-slate-100 text-slate-600"
      }
    >
      {prioridadeNormalizada
        ? PRIORIDADE_LABEL[prioridadeNormalizada]
        : valor || "Não informada"}
    </Etiqueta>
  );
}