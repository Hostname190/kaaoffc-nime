// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(
  request: NextRequest,
  { params }: any
) {
  try {
    const resolvedParams = await params;
    const apiPath = resolvedParams.path.join("/");
    const { search } = new URL(request.url);
    const fullPath = `/comic/${apiPath}${search}`;
    
    const BASE_URL = "https://www.sankavollerei.com";
    
    const res = await axios.get(`${BASE_URL}${fullPath}`, {
      timeout: 15000,
    });

    return NextResponse.json(res.data);
  } catch (error: any) {
    console.error("Comic API Proxy Error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch from Comic API" },
      { status: error.response?.status || 500 }
    );
  }
}
