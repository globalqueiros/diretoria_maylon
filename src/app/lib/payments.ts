import type { Payment } from "./payment-types";

export class RefundError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "RefundError";
    this.status = status;
  }
}

export async function listPayments(): Promise<Payment[]> {
  return [];
}

export async function requestRefund(
  ..._args: [
    string,
    {
      type: "total" | "partial";
      amount?: number;
      reason: string;
      notes?: string;
    },
  ]
): Promise<{ success: boolean }> {
  void _args;

  throw new RefundError(
    "O fluxo de reembolso ainda não está configurado neste ambiente.",
    501
  );
}
