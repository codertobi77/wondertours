import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const VALID_TAGS = [
  "circuits",
  "circuits-detail",
  "blog",
  "blog-detail",
  "categories",
  "destinations",
  "testimonials",
  "settings",
  "services",
] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { tag, secret } = body as { tag?: string; secret?: string };

    const expectedSecret = process.env.REVALIDATE_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    if (!tag || !VALID_TAGS.includes(tag as (typeof VALID_TAGS)[number])) {
      return NextResponse.json(
        { message: `Invalid tag. Valid tags: ${VALID_TAGS.join(", ")}` },
        { status: 400 }
      );
    }

    revalidateTag(tag, "max");

    return NextResponse.json({ revalidated: true, tag, timestamp: Date.now() });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}