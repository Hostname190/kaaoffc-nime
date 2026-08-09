import { NextRequest, NextResponse } from "next/server";
import { getEpisodeImages } from "@/lib/webtoons-api";
import { getMangaDexChapterImages } from "@/lib/mangadex-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const source = searchParams.get("source") || "webtoons";
  
  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });
  
  try {
    if (source === "mangadex" || url.startsWith("mangadex:")) {
      const id = url.replace("mangadex:", "");
      const data = await getMangaDexChapterImages(id);
      return NextResponse.json({ images: data });
    } else {
      const data = await getEpisodeImages(url);
      return NextResponse.json({ images: data });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch episode images" }, { status: 500 });
  }
}
