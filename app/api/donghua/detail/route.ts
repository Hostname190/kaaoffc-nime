import { NextRequest, NextResponse } from "next/server";
import { getDonghuaDetail } from "@/lib/donghua-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  
  if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });

  try {
    const data = await getDonghuaDetail(slug);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch donghua detail" }, { status: 500 });
  }
}
