import { NextRequest } from "next/server";
import { GET as listarSessoes } from "../route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return listarSessoes(request);
}
