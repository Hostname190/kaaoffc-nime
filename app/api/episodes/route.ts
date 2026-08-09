import { NextRequest, NextResponse } from "next/server";
import { getEpisodes } from "@/lib/webtoons-api";
import { getMangaDexEpisodes } from "@/lib/mangadex-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const source = searchParams.get("source") || "webtoons";
  
  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });
  
  try {
    if (source === "mangadex" || url.startsWith("mangadex:")) {
      const id = url.replace("mangadex:", "");
      const data = await getMangaDexEpisodes(id, page);
      return NextResponse.json(data);
    } else {
      const data = await getEpisodes(url, page);
      return NextResponse.json(data);
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch episodes" }, { status: 500 });
  }
}
