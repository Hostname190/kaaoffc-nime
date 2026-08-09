import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  
  if (!url || url === 'undefined' || url === 'null') {
    return NextResponse.redirect('https://placehold.co/200x300/151728/6b7280.png?text=Not+Found');
  }
  
  try {
    // otakudesu blocks server-side fetch.
    if (url.includes('otakudesu')) {
      return NextResponse.redirect(url);
    }

    // Tentukan referer berdasarkan domain gambar agar tidak kena blokir (403 Forbidden)
    let referer = 'https://www.webtoons.com/';
    if (url.includes('komiku.org') || url.includes('komiku.id')) {
      referer = 'https://komiku.org/';
    } else if (url.includes('sankavollerei')) {
      referer = 'https://www.sankavollerei.com/';
    } else if (url.includes('anichin')) {
      referer = 'https://anichin.vip/';
    } else if (url.includes('sakuranovel.id')) {
      referer = 'https://sakuranovel.id/';
    }

    const response = await fetch(url, {
      headers: {
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
      }
    });

    if (!response.ok) {
      console.warn(`Failed to proxy image: ${response.status} for ${url}`);
      return NextResponse.redirect('https://placehold.co/200x300/151728/6b7280.png?text=Not+Found');
    }

    const arrayBuffer = await response.arrayBuffer();
    const headers = new Headers();
    const contentType = response.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }
    headers.set('Cache-Control', 'public, max-age=31536000');

    return new NextResponse(arrayBuffer, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.redirect('https://placehold.co/200x300/151728/6b7280.png?text=Not+Found');
  }
}
