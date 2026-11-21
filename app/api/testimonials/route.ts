import { NextRequest, NextResponse } from "next/server";

function apiBase(): string | null {
  const url = process.env.APP_URL;
  if (url !== undefined) {
    return url.trim() === "" ? null : url.trim().replace(/\/+$/, "");
  }
  return null;
}

export async function POST(request: NextRequest) {
  const base = apiBase();
  if (base === null) {
    return NextResponse.json(
      { message: "API not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(`${base}/api/testimonials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Failed to submit testimonial" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}