import { NextRequest, NextResponse } from "next/server";
import { getDetail } from "@/lib/webtoons-api";
import { getMangaDexDetail } from "@/lib/mangadex-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const source = searchParams.get("source") || "webtoons";
  
  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });
  
  try {
    if (source === "mangadex") {
      // url param will be like "mangadex:123" or just "123"
      const id = url.replace("mangadex:", "");
      const data = await getMangaDexDetail(id);
      return NextResponse.json(data);
    } else {
      const data = await getDetail(url);
      return NextResponse.json(data);
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch detail" }, { status: 500 });
  }
}
