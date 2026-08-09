import { NextResponse } from 'next/server';
import axios from 'axios';

const BASE_URL = 'https://www.sankavollerei.com';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const urlPath = resolvedParams.path.join('/');
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const fullUrl = `${BASE_URL}/novel/${urlPath}${queryString ? `?${queryString}` : ''}`;
    
    console.log(`[Novel Proxy] Fetching: ${fullUrl}`);
    
    const response = await axios.get(fullUrl, {
      timeout: 15000,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`[Novel Proxy Error]`, error.message);
    return NextResponse.json(
      { error: 'Failed to fetch from external novel API' },
      { status: error.response?.status || 500 }
    );
  }
}
