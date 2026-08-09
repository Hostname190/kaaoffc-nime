// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";

/**
 * Iframe Proxy API
 * Proxies an iframe page and strips CSP headers so it can be embedded.
 * 
 * Usage: GET /api/anime/iframe-proxy?url=https://desustream.me/...
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("URL parameter is required", { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
        'Referer': 'https://otakudesu.blog/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return new NextResponse(`Failed to proxy: ${response.status}`, { status: response.status });
    }

    let html = await response.text();

    // Inject base tag so relative resources resolve correctly
    const baseUrl = new URL(targetUrl);
    const baseTag = `<base href="${baseUrl.origin}/">`;
    html = html.replace(/<head>/i, `<head>${baseTag}`);

    // Return HTML without CSP headers
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        // Intentionally NOT setting X-Frame-Options or CSP headers
      },
    });
  } catch (error: any) {
    console.error("Iframe proxy error:", error);
    return new NextResponse("Failed to proxy iframe", { status: 500 });
  }
}
