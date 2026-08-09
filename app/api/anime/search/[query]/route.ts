import { NextRequest, NextResponse } from "next/server";

// Custom search route to bypass sankavollerei's broken search limit
export async function GET(req: NextRequest, { params }: { params: Promise<{ query: string }> }) {
  try {
    const query = (await params).query;
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const targetUrl = `https://otakudesu.blog/?s=${query}&post_type=anime`;
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
      }
    });

    if (!response.ok) {
      throw new Error(`Otakudesu search failed: ${response.status}`);
    }

    const html = await response.text();
    const animeList: any[] = [];

    // Simple Regex extraction to avoid Cheerio/Undici Next.js build issues
    const listMatch = html.match(/<ul class="chivsrc">([\s\S]*?)<\/ul>/);
    if (listMatch && listMatch[1]) {
      const itemsHtml = listMatch[1];
      const itemRegex = /<li>([\s\S]*?)<\/li>/g;
      let match;

      while ((match = itemRegex.exec(itemsHtml)) !== null) {
        const itemHtml = match[1];
        
        const titleMatch = itemHtml.match(/<h2><a href="([^"]+)">([^<]+)<\/a><\/h2>/);
        const imgMatch = itemHtml.match(/<img[^>]+src="([^"]+)"/);
        const statusMatch = itemHtml.match(/Status :([^<]+)/);
        const ratingMatch = itemHtml.match(/Rating :([^<]+)/);

        if (titleMatch) {
          const href = titleMatch[1];
          const title = titleMatch[2].trim();
          const poster = imgMatch ? imgMatch[1] : '';
          const status = statusMatch ? statusMatch[1].trim() : 'Unknown';
          const score = ratingMatch ? ratingMatch[1].trim() : 'N/A';

          let animeId = '';
          const idMatch = href.match(/\/anime\/([^/]+)/);
          if (idMatch) {
            animeId = idMatch[1];
          }

          if (animeId) {
            animeList.push({
              title,
              poster,
              status,
              score,
              animeId,
              href: `/anime/anime/${animeId}`,
              otakudesuUrl: href
            });
          }
        }
      }
    }

    return NextResponse.json({
      status: "success",
      creator: "Kaaoffc Custom Search",
      data: {
        animeList
      }
    });

  } catch (error: any) {
    console.error("Custom search error:", error);
    // Fallback to sankavollerei if it fails
    return NextResponse.json({ error: "Failed to scrape search" }, { status: 500 });
  }
}
