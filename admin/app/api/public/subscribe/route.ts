import { NextRequest, NextResponse } from "next/server";
import { getLandingPageBySlug } from "@/lib/db/landing-pages";
import { createSubscriber } from "@/lib/db/subscribers";
import { createEmailLog } from "@/lib/db/email-logs";
import { sendSubscribeEmail } from "@/lib/resend/sendEmail";
import { syncSubscriberToNotion } from "@/lib/notion/sync";
import { markEmailSent } from "@/lib/db/subscribers";
import type { SubscribeRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: SubscribeRequest = await req.json();
    const { slug, name, email, phone, line_id, utm_source, utm_medium, utm_campaign } = body;

    // ── 1. 基本驗證 ───────────────────────────────────────────
    if (!slug || !name || !email) {
      return NextResponse.json(
        { success: false, error: "slug, name, email 為必填" },
        { status: 400 }
      );
    }

    // ── 2. 查 landing page ────────────────────────────────────
    const page = await getLandingPageBySlug(slug);
    if (!page || page.status !== "published") {
      return NextResponse.json(
        { success: false, error: "找不到對應的頁面" },
        { status: 404 }
      );
    }

    // ── 3. 寫入 subscriber ────────────────────────────────────
    const subscriber = await createSubscriber({
      landing_page_id: page.id,
      landing_page_slug: slug,
      name,
      email,
      phone: phone ?? null,
      line_id: line_id ?? null,
      source: "web",
      utm_source: utm_source ?? null,
      utm_medium: utm_medium ?? null,
      utm_campaign: utm_campaign ?? null,
      tag: null,
      note: null,
    });

    // ── 4. 發信 + 寫 email_log ────────────────────────────────
    try {
      const result = await sendSubscribeEmail({
        to: email,
        name,
        subject: page.email_subject ?? `感謝你的訂閱`,
        body: page.email_body ?? `Hi ${name}，感謝你！`,
      });

      await createEmailLog({
        subscriber_id: subscriber.id,
        landing_page_id: page.id,
        resend_email_id: result.id ?? null,
        subject: page.email_subject,
        status: "sent",
      });

      await markEmailSent(subscriber.id, new Date());
    } catch (emailErr) {
      // 發信失敗不中斷主流程，記錄錯誤即可
      const errMsg = emailErr instanceof Error ? emailErr.message : "Unknown email error";
      await createEmailLog({
        subscriber_id: subscriber.id,
        landing_page_id: page.id,
        resend_email_id: null,
        subject: page.email_subject,
        status: "failed",
        error_message: errMsg,
      });
    }

    // ── 5. 非同步 Notion sync（不等待）────────────────────────
    syncSubscriberToNotion(subscriber, page).catch(() => {
      // Notion 失敗不影響主流程，silent fail
    });

    // ── 6. 回傳成功 ───────────────────────────────────────────
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
