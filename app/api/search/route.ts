import { NextRequest, NextResponse } from "next/server";
import { searchWebtoons } from "@/lib/webtoons-api";
import { searchMangaDex } from "@/lib/mangadex-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const source = searchParams.get("source") || "webtoons";
  
  if (!q) return NextResponse.json({ error: "Query is required" }, { status: 400 });
  
  try {
    if (source === "mangadex") {
      const data = await searchMangaDex(q);
      return NextResponse.json(data);
    } else if (source === "novels") {
      const { supabase } = await import("@/lib/supabase");
      const { data, error } = await supabase
        .from("novels")
        .select("*, chapters(id)")
        .or(`title.ilike.%${q}%,author.ilike.%${q}%`);
      if (error) throw error;
      return NextResponse.json({ items: data || [] });
    } else {
      const data = await searchWebtoons(q);
      return NextResponse.json(data);
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch search results" }, { status: 500 });
  }
}
