import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { createSubscriber } from "@/lib/db/subscribers";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const { rows, landing_page_slug } = await req.json();
    if (!Array.isArray(rows)) return NextResponse.json({ success: false, error: "rows 必須是陣列" }, { status: 400 });

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const name = String(row.name ?? "").trim();
      const email = String(row.email ?? "").trim();
      if (!name || !email) { skipped++; continue; }
      try {
        await createSubscriber({
          name, email,
          phone: row.phone ? String(row.phone).trim() : null,
          line_id: null,
          landing_page_id: null,
          landing_page_slug: landing_page_slug || null,
          source: "import",
          utm_source: null, utm_medium: null, utm_campaign: null,
          tag: null, note: null,
        });
        imported++;
      } catch (e) {
        errors.push(`${email}: ${e instanceof Error ? e.message : "失敗"}`);
        skipped++;
      }
    }

    return NextResponse.json({ success: true, imported, skipped, errors });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
