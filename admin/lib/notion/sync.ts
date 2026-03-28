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

// landing page（簡版）→ Notion DB
export async function syncLandingPageToNotion(page: LandingPage): Promise<void> {
  const dbId = process.env.NOTION_LANDING_PAGES_DB_ID;
  if (!dbId) return;

  const notion = getNotion();

  await notion.pages.create({
    parent: { database_id: dbId },
    properties: {
      Name: {
        title: [{ text: { content: page.name } }],
      },
      Slug: {
        rich_text: [{ text: { content: page.slug } }],
      },
      Status: {
        select: { name: page.status },
      },
      Type: {
        select: { name: page.page_type },
      },
    },
  });
}
