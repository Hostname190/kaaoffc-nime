// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";

/**
 * Video Source Extractor API
 * Extracts actual video source URLs from streaming iframe pages
 * that block embedding via CSP (Content-Security-Policy).
 * 
 * Usage: GET /api/anime/extract?url=https://desustream.me/...
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const iframeUrl = searchParams.get("url");

  if (!iframeUrl) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  try {
    // Fetch the iframe page content server-side (bypassing CSP since CSP is browser-only)
    const response = await fetch(iframeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
        'Referer': 'https://otakudesu.blog/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch iframe: ${response.status}` }, { status: response.status });
    }

    const html = await response.text();

    // Strategy 1: Look for direct video source URLs (.mp4, .m3u8)
    const videoPatterns = [
      /(?:src|file|source|url)\s*[:=]\s*['"](https?:\/\/[^'"]+\.(?:mp4|m3u8|webm)[^'"]*)['"]/gi,
      /sources\s*:\s*\[\s*\{\s*(?:file|src)\s*:\s*['"](https?:\/\/[^'"]+)['"]/gi,
      /player\.src\s*\(\s*\{\s*(?:src|file)\s*:\s*['"](https?:\/\/[^'"]+)['"]/gi,
      /video\.src\s*=\s*['"](https?:\/\/[^'"]+)['"]/gi,
      /data-src\s*=\s*['"](https?:\/\/[^'"]+\.(?:mp4|m3u8|webm)[^'"]*)['"]/gi,
      /atob\(['"]([\w+/=]+)['"]\)/gi, // base64 encoded URLs
    ];

    const sources: string[] = [];

    for (const pattern of videoPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        let url = match[1];
        
        // Try to decode base64 if it looks like one
        if (/^[A-Za-z0-9+/=]+$/.test(url) && url.length > 20) {
          try {
            const decoded = Buffer.from(url, 'base64').toString('utf-8');
            if (decoded.startsWith('http')) {
              url = decoded;
            }
          } catch {}
        }
        
        if (url.startsWith('http') && !sources.includes(url)) {
          sources.push(url);
        }
      }
    }

    // Strategy 2: Look for embedded iframe within the page (nested iframes)
    const nestedIframeMatch = html.match(/iframe[^>]+src\s*=\s*['"](https?:\/\/[^'"]+)['"]/i);
    let nestedSources: string[] = [];
    
    if (nestedIframeMatch && nestedIframeMatch[1]) {
      try {
        const nestedRes = await fetch(nestedIframeMatch[1], {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': iframeUrl,
          },
        });
        if (nestedRes.ok) {
          const nestedHtml = await nestedRes.text();
          for (const pattern of videoPatterns) {
            let match;
            while ((match = pattern.exec(nestedHtml)) !== null) {
              let url = match[1];
              if (/^[A-Za-z0-9+/=]+$/.test(url) && url.length > 20) {
                try {
                  const decoded = Buffer.from(url, 'base64').toString('utf-8');
                  if (decoded.startsWith('http')) url = decoded;
                } catch {}
              }
              if (url.startsWith('http') && !nestedSources.includes(url)) {
                nestedSources.push(url);
              }
            }
          }
        }
      } catch {}
    }

    const allSources = [...sources, ...nestedSources];

    if (allSources.length > 0) {
      return NextResponse.json({
        success: true,
        sources: allSources,
        type: allSources[0].includes('.m3u8') ? 'hls' : 'mp4',
        extracted_from: iframeUrl,
      });
    }

    // Strategy 3: If no direct sources found, return the iframe URL
    // so the frontend can try an alternative approach
    return NextResponse.json({
      success: false,
      fallback_iframe: iframeUrl,
      message: "Could not extract direct video source. Use proxy iframe instead.",
      html_snippet: html.substring(0, 2000), // Send first 2000 chars for debugging
    });

  } catch (error: any) {
    console.error("Video extraction error:", error);
    return NextResponse.json({ 
      error: "Failed to extract video source", 
      details: error.message 
    }, { status: 500 });
  }
}
