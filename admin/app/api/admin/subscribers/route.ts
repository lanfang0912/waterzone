import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getSubscribers, createSubscriber } from "@/lib/db/subscribers";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page   = Number(searchParams.get("page") ?? 1);
  const limit  = Number(searchParams.get("limit") ?? 50);
  const search = searchParams.get("search") ?? undefined;
  const slug   = searchParams.get("slug") ?? undefined;
  const tag    = searchParams.get("tag") ?? undefined;
  const emailSentParam = searchParams.get("email_sent");
  const email_sent = emailSentParam === null ? undefined : emailSentParam === "true";

  try {
    const result = await getSubscribers({ page, limit, search, landing_page_slug: slug, tag, email_sent });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, email, phone, line_id, landing_page_slug } = body;
    if (!name || !email) {
      return NextResponse.json({ success: false, error: "name 和 email 為必填" }, { status: 400 });
    }
    const subscriber = await createSubscriber({
      name,
      email,
      phone: phone || null,
      line_id: line_id || null,
      landing_page_id: null,
      landing_page_slug: landing_page_slug || null,
      source: "admin",
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      tag: null,
      note: null,
    });
    return NextResponse.json({ success: true, data: subscriber });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
