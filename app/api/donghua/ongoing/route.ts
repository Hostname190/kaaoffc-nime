import { NextRequest, NextResponse } from "next/server";
import { getDonghuaOngoing } from "@/lib/donghua-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || "1";

  try {
    const data = await getDonghuaOngoing(page);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch ongoing donghua" }, { status: 500 });
  }
}
