// Sem imports de servidor: pode ser usado em Client Components.
export type PaymentStatus =
  | "pending"
  | "paid"
  | "refund_requested"
  | "refunded"
  | "refund_denied";

export type Payment = {
  id: string;
  rideId: string;
  passenger: string;
  method: "pix" | "credit_card" | "debit_card";
  amount: number;
  status: PaymentStatus;
  refundAmount: number; // valor do último reembolso (0 se não houver)
  createdAt: string; // ISO
};

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  refund_requested: "Reembolso solicitado",
  refunded: "Reembolsado",
  refund_denied: "Reembolso negado",
};

export const METHOD_LABEL: Record<Payment["method"], string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
};

export const REFUND_REASONS = [
  "Corrida cancelada",
  "Cobrança em duplicidade",
  "Valor cobrado incorreto",
  "Serviço não prestado",
  "Outro",
] as const;
