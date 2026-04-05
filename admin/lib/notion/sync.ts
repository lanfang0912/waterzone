import { Client } from "@notionhq/client";
import { markNotionSynced } from "@/lib/db/subscribers";
import type { Subscriber, LandingPage } from "@/types";

let _notion: Client | null = null;

function getNotion(): Client {
  if (!_notion) {
    const key = process.env.NOTION_API_KEY;
    if (!key) throw new Error("Missing NOTION_API_KEY");
    _notion = new Client({ auth: key });
  }
  return _notion;
}

// subscriber → Notion DB
export async function syncSubscriberToNotion(
  subscriber: Subscriber,
  page: LandingPage
): Promise<void> {
  const dbId = process.env.NOTION_SUBSCRIBERS_DB_ID;
  if (!dbId) return; // Notion 未設定，跳過

  const notion = getNotion();

  await notion.pages.create({
    parent: { database_id: dbId },
    properties: {
      Name: {
        title: [{ text: { content: subscriber.name } }],
      },
      Email: {
        email: subscriber.email,
      },
      "Landing Page": {
        rich_text: [{ text: { content: page.name } }],
      },
      Slug: {
        rich_text: [{ text: { content: subscriber.landing_page_slug ?? "" } }],
      },
      Phone: {
        phone_number: subscriber.phone ?? null,
      },
      "Created At": {
        date: { start: subscriber.created_at },
      },
    },
  });

  await markNotionSynced(subscriber.id);
}

function rt(val: string | null | undefined) {
  return val ? [{ text: { content: val.slice(0, 2000) } }] : [];
}

// landing page（完整版）→ Notion DB
export async function syncLandingPageToNotion(page: LandingPage): Promise<void> {
  const dbId = process.env.NOTION_LANDING_PAGES_DB_ID;
  if (!dbId) return;

  const notion = getNotion();

  await notion.pages.create({
    parent: { database_id: dbId },
    properties: {
      Name:              { title: [{ text: { content: page.name } }] },
      Slug:              { rich_text: rt(page.slug) },
      Status:            { select: { name: page.status } },
      Theme:             { select: { name: page.theme } },
      "Hero Title":      { rich_text: rt(page.hero_title) },
      "Hero Subtitle":   { rich_text: rt(page.hero_subtitle) },
      CTA:               { rich_text: rt(page.cta) },
      Button:            { rich_text: rt(page.btn) },
      Keyword:           { rich_text: rt(page.keyword) },
      "Keyword Reply":   { rich_text: rt(page.keyword_reply) },
      "Email Subject":   { rich_text: rt(page.email_subject) },
      "Email Body":      { rich_text: rt(page.email_body) },
      "Confirm Button":  { rich_text: rt(page.confirm_btn) },
      "FAQ 1 Q":         { rich_text: rt(page.faq_1_q) },
      "FAQ 1 A":         { rich_text: rt(page.faq_1_a) },
      "FAQ 2 Q":         { rich_text: rt(page.faq_2_q) },
      "FAQ 2 A":         { rich_text: rt(page.faq_2_a) },
      "FAQ 3 Q":         { rich_text: rt(page.faq_3_q) },
      "FAQ 3 A":         { rich_text: rt(page.faq_3_a) },
      "SEO Title":       { rich_text: rt(page.seo_title) },
      "SEO Description": { rich_text: rt(page.seo_description) },
      Synced:            { checkbox: false },
    },
  });
}

// Notion DB → Supabase（匯入未同步的草稿）
export async function importLandingPagesFromNotion(): Promise<LandingPage[]> {
  const dbId = process.env.NOTION_LANDING_PAGES_DB_ID;
  if (!dbId) throw new Error("Missing NOTION_LANDING_PAGES_DB_ID");

  const notion = getNotion();
  const res = await notion.databases.query({
    database_id: dbId,
    filter: { property: "Synced", checkbox: { equals: false } },
  });

  type NotionProp = {
    rich_text?: Array<{ plain_text: string }>;
    title?: Array<{ plain_text: string }>;
    select?: { name: string };
    checkbox?: boolean;
  };

  function getText(props: Record<string, NotionProp>, key: string): string | null {
    const prop = props[key];
    if (!prop) return null;
    const arr = prop.rich_text ?? prop.title ?? [];
    return arr.map((t) => t.plain_text).join("") || null;
  }

  function getSelect(props: Record<string, NotionProp>, key: string): string | null {
    return props[key]?.select?.name ?? null;
  }

  const { supabaseAdmin } = await import("@/lib/db/client");
  const { createArticle } = await import("@/lib/db/articles");
  const imported: LandingPage[] = [];

  for (const notionPage of res.results) {
    const p = (notionPage as { properties: Record<string, NotionProp> }).properties;

    const payload: Omit<LandingPage, "id" | "created_at" | "updated_at"> = {
      name:             getText(p, "Name") ?? "未命名",
      slug:             getText(p, "Slug") ?? `draft-${Date.now()}`,
      page_type:        "hosted",
      external_url:     null,
      migration_status: "hosted",
      status:           (getSelect(p, "Status") as LandingPage["status"]) ?? "draft",
      theme:            (getSelect(p, "Theme") as LandingPage["theme"]) ?? "rose",
      author_tag:       "許藍方・希塔療癒導師・關係靈氣療癒師",
      hero_title:       getText(p, "Hero Title"),
      hero_subtitle:    getText(p, "Hero Subtitle"),
      cta:              getText(p, "CTA"),
      btn:              getText(p, "Button"),
      keyword:          getText(p, "Keyword"),
      keyword_reply:    getText(p, "Keyword Reply"),
      email_subject:    getText(p, "Email Subject"),
      email_body:       getText(p, "Email Body"),
      confirm_btn:      getText(p, "Confirm Button"),
      faq_1_q:          getText(p, "FAQ 1 Q"),
      faq_1_a:          getText(p, "FAQ 1 A"),
      faq_2_q:          getText(p, "FAQ 2 Q"),
      faq_2_a:          getText(p, "FAQ 2 A"),
      faq_3_q:          getText(p, "FAQ 3 Q"),
      faq_3_a:          getText(p, "FAQ 3 A"),
      consult_1:        null,
      consult_2:        null,
      consult_3:        null,
      seo_title:        getText(p, "SEO Title"),
      seo_description:  getText(p, "SEO Description"),
      body_json:        null,
    };

    const { data, error } = await supabaseAdmin
      .from("landing_pages")
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // 同時建立對應的部落格草稿
    const slug = payload.slug;
    const existing = await supabaseAdmin
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!existing.data) {
      await createArticle({
        title:             payload.hero_title ?? payload.name,
        slug,
        excerpt:           payload.hero_subtitle,
        content:           payload.email_body,
        status:            "draft",
        landing_page_slug: slug,
        seo_title:         payload.seo_title,
        seo_description:   payload.seo_description,
        cover_image:       null,
        summary_image:     null,
        published_at:      null,
      });
    }

    await notion.pages.update({
      page_id: notionPage.id,
      properties: { Synced: { checkbox: true } },
    });

    imported.push(data);
  }

  return imported;
}
