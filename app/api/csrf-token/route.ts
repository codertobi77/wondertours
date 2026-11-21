import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf";

export async function GET() {
  const token = await generateCsrfToken();
  const response = NextResponse.json({ token });
  // Le cookie est déjà défini par generateCsrfToken via cookies()
  return response;
}