import { NextRequest, NextResponse } from "next/server";
import { getDonghuaByGenre } from "@/lib/donghua-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const page = searchParams.get("page") || "1";

  if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

  try {
    const data = await getDonghuaByGenre(slug, page);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch genre details" }, { status: 500 });
  }
}
