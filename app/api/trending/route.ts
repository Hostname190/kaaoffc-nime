import { NextRequest, NextResponse } from "next/server";
import { getTrending } from "@/lib/webtoons-api";
import { getTrendingMangaDex } from "@/lib/mangadex-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const day = searchParams.get("day") || "trending";
  const source = searchParams.get("source") || "webtoons";
  
  try {
    if (source === "mangadex") {
      const data = await getTrendingMangaDex();
      return NextResponse.json(data);
    } else {
      const data = await getTrending(day);
      return NextResponse.json(data);
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch trending" }, { status: 500 });
  }
}
