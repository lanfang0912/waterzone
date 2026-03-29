import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { supabaseAdmin } from "@/lib/db/client";
import { resendEmail } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const { subject, body, landing_page_slug } = await req.json();
    if (!subject || !body) return NextResponse.json({ success: false, error: "subject 和 body 為必填" }, { status: 400 });

    // 取出符合條件的訂閱者
    let query = supabaseAdmin.from("subscribers").select("id, name, email");
    if (landing_page_slug) query = query.eq("landing_page_slug", landing_page_slug);
    const { data: subscribers, error } = await query;
    if (error) throw new Error(error.message);
    if (!subscribers?.length) return NextResponse.json({ success: true, sent: 0, failed: 0 });

    let sent = 0;
    let failed = 0;

    for (const sub of subscribers) {
      const interpolate = (str: string) =>
        str.replace(/\{name\}/g, sub.name).replace(/\{email\}/g, sub.email);
      try {
        await resendEmail({ to: sub.email, name: sub.name, subject: interpolate(subject), body: interpolate(body) });
        sent++;
      } catch {
        failed++;
      }
    }

    return NextResponse.json({ success: true, sent, failed, total: subscribers.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
