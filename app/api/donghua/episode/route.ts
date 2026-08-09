import { NextRequest, NextResponse } from "next/server";
import { getDonghuaEpisode } from "@/lib/donghua-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  
  if (!id) return NextResponse.json({ error: "Episode ID is required" }, { status: 400 });

  try {
    const data = await getDonghuaEpisode(id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch donghua episode" }, { status: 500 });
  }
}
