import { NextResponse } from "next/server";
import { fetchRentData } from "@/lib/cso-api";

// Mark route as dynamic so Vercel does not pre-render an ISR fallback.
// The 24-hour cache is handled at the fetch level inside fetchRentData().
export const dynamic = "force-dynamic";

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
