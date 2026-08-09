import { NextResponse } from "next/server";
import { getDonghuaHome } from "@/lib/donghua-api";

export async function GET() {
  try {
    const data = await getDonghuaHome();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch donghua home" }, { status: 500 });
  }
}
