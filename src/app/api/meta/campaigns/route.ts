import { NextResponse } from "next/server";

export async function GET() {
  try {
    const accountId = process.env.META_AD_ACCOUNT_ID;
    const token = process.env.META_ACCESS_TOKEN;

    const url = `https://graph.facebook.com/v23.0/${accountId}/campaigns?fields=id,name,status,objective,daily_budget`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar campanhas" },
      { status: 500 }
    );
  }
}