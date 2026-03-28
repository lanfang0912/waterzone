import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getSubscriberById, markEmailSent } from "@/lib/db/subscribers";
import { getLandingPageById } from "@/lib/db/landing-pages";
import { resendEmail } from "@/lib/resend";
import { createEmailLog } from "@/lib/db/email-logs";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const subscriber = await getSubscriberById(id);
    if (!subscriber) {
      return NextResponse.json({ success: false, error: "Subscriber not found" }, { status: 404 });
    }

    const page = subscriber.landing_page_id
      ? await getLandingPageById(subscriber.landing_page_id)
      : null;

    const subject = page?.email_subject ?? "感謝你的訂閱";
    const body = page?.email_body ?? `Hi ${subscriber.name}，感謝你！`;

    const result = await resendEmail({
      to: subscriber.email,
      name: subscriber.name,
      subject,
      body,
    });

    await createEmailLog({
      subscriber_id: subscriber.id,
      landing_page_id: page?.id ?? null,
      resend_email_id: result.id ?? null,
      subject,
      status: "sent",
    });

    await markEmailSent(subscriber.id, new Date());

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to resend";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
