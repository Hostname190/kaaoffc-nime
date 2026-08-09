// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_ANIME_API_URL || "https://www.sankavollerei.com";

export async function GET(req: NextRequest, { params }: any) {
  try {
    const searchParams = req.nextUrl.searchParams.toString();
    const resolvedParams = await params;
    const joinedPath = resolvedParams.path ? resolvedParams.path.map(encodeURIComponent).join('/') : '';
    const query = searchParams ? `?${searchParams}` : '';
    
    // Some routes start with /anime in the target API, e.g. /anime/home
    // The incoming path from `/api/anime/...` will just be `home` if it's `app/api/anime/[...path]`
    // The user's routes are `GET /anime/home`, so the target API expects `/anime/...`
    const targetUrl = `${BASE_URL}/anime/${joinedPath}${query}`;
    
    const response = await fetch(targetUrl, {
      next: { revalidate: 600 }
    });

    if (!response.ok) {
      return NextResponse.json({ error: `API returned ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Anime proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch from anime API" }, { status: 500 });
  }
}
