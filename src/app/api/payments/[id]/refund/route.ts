import { NextResponse } from "next/server";
import { RefundError, requestRefund } from "@/lib/payments";
import { REFUND_REASONS } from "@/lib/payment-types";

// Next.js 16: params é uma Promise
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);

  if (!body || (body.type !== "total" && body.type !== "partial"))
    return NextResponse.json({ error: "Tipo de reembolso inválido." }, { status: 400 });
  if (!REFUND_REASONS.includes(body.reason))
    return NextResponse.json({ error: "Motivo inválido." }, { status: 400 });
  if (body.type === "partial" && !(Number(body.amount) > 0))
    return NextResponse.json({ error: "Informe o valor do reembolso." }, { status: 400 });

  try {
    const result = await requestRefund(id, {
      type: body.type,
      amount: body.type === "partial" ? Number(body.amount) : undefined,
      reason: body.reason,
      notes: typeof body.notes === "string" ? body.notes.slice(0, 300) : undefined,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof RefundError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
