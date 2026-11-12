import { NextResponse } from "next/server";
import { listPayments } from "../../lib/payments";

export async function GET() {
  try {
    return NextResponse.json(await listPayments());
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar pagamentos." },
      { status: 500 }
    );
  }
}
