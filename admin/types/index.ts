// ─── Landing Page ─────────────────────────────────────────────
export type PageType = "hosted" | "external";
export type MigrationStatus = "legacy" | "transition" | "hosted" | "archived";
export type PageStatus = "draft" | "published";

export interface LandingPage {
  id: string;
  name: string;
  slug: string;

  page_type: PageType;
  external_url: string | null;
  migration_status: MigrationStatus;
  status: PageStatus;

  btn: string | null;
  cta: string | null;
  keyword: string | null;
  keyword_reply: string | null;

  email_subject: string | null;
  email_body: string | null;
  confirm_btn: string | null;

  faq_1_q: string | null;
  faq_1_a: string | null;
  faq_2_q: string | null;
  faq_2_a: string | null;
  faq_3_q: string | null;
  faq_3_a: string | null;

  consult_1: string | null;
  consult_2: string | null;
  consult_3: string | null;

  hero_title: string | null;
  hero_subtitle: string | null;
  seo_title: string | null;
  seo_description: string | null;

  body_json: Record<string, unknown> | null;

  created_at: string;
  updated_at: string;
}

// ─── Subscriber ───────────────────────────────────────────────
export interface Subscriber {
  id: string;
  landing_page_id: string | null;
  landing_page_slug: string | null;

  name: string;
  email: string;
  phone: string | null;
  line_id: string | null;

  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;

  tag: string | null;
  note: string | null;

  email_sent: boolean;
  email_sent_at: string | null;

  notion_synced: boolean;

  created_at: string;
}

// ─── Email Log ────────────────────────────────────────────────
export type EmailLogStatus = "sent" | "failed" | "pending";

export interface EmailLog {
  id: string;
  subscriber_id: string;
  landing_page_id: string | null;

  resend_email_id: string | null;
  subject: string | null;
  status: EmailLogStatus;
  error_message: string | null;

  sent_at: string;
}

// ─── API ──────────────────────────────────────────────────────
export interface SubscribeRequest {
  slug: string;
  name: string;
  email: string;
  phone?: string;
  line_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
