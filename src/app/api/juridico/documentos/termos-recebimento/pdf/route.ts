import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { error: "Rota de PDF não configurada." },
    { status: 501 }
  );
}
