import { NextRequest, NextResponse } from "next/server";
import { getDonghuaAzList } from "@/lib/donghua-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const letter = searchParams.get("letter") || "A";
  const page = searchParams.get("page") || "1";

  try {
    const data = await getDonghuaAzList(letter, page);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch az list" }, { status: 500 });
  }
}
