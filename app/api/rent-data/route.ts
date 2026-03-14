import { NextResponse } from "next/server";
import { fetchRentData } from "@/lib/cso-api";

export const revalidate = 86400; // 24h ISR

export async function GET() {
  try {
    const data = await fetchRentData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to fetch CSO rent data:", err);
    return NextResponse.json(
      { error: "Failed to fetch rent data" },
      { status: 500 }
    );
  }
}
