import { NextResponse } from "next/server";
import { importLandingPagesFromNotion } from "@/lib/notion/sync";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const pages = await importLandingPagesFromNotion();
    return NextResponse.json({ imported: pages.length, pages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
