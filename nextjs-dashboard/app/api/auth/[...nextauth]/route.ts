import { auth } from "@/auth";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return auth(request);
}

export async function POST(request: NextRequest) {
  return auth(request);
}
