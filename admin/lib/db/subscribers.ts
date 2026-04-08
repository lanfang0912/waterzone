import { supabaseAdmin } from "./client";
import type { Subscriber } from "@/types";

export interface SubscriberFilters {
  landing_page_id?: string;
  landing_page_slug?: string;
  email_sent?: boolean;
  tag?: string;
  search?: string; // name or email
  page?: number;
  limit?: number;
}

export async function getSubscribers(filters: SubscriberFilters = {}): Promise<{
  data: Subscriber[];
  count: number;
}> {
  const { page = 1, limit = 50, search, ...rest } = filters;

  let query = supabaseAdmin
    .from("subscribers")
    .select("*", { count: "exact" });

  if (rest.landing_page_id) query = query.eq("landing_page_id", rest.landing_page_id);
  if (rest.landing_page_slug) query = query.eq("landing_page_slug", rest.landing_page_slug);
  if (rest.email_sent !== undefined) query = query.eq("email_sent", rest.email_sent);
  if (rest.tag) query = query.eq("tag", rest.tag);
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const from = (page - 1) * limit;
  query = query.order("created_at", { ascending: false }).range(from, from + limit - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return { data: data ?? [], count: count ?? 0 };
}

export async function getSubscriberById(id: string): Promise<Subscriber | null> {
  const { data, error } = await supabaseAdmin
    .from("subscribers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createSubscriber(
  payload: Omit<Subscriber, "id" | "created_at" | "email_sent" | "email_sent_at" | "notion_synced">
): Promise<Subscriber> {
  const { data, error } = await supabaseAdmin
    .from("subscribers")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateSubscriber(
  id: string,
  payload: Partial<Subscriber>
): Promise<Subscriber> {
  const { data, error } = await supabaseAdmin
    .from("subscribers")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function markEmailSent(id: string, emailSentAt: Date): Promise<void> {
  const { error } = await supabaseAdmin
    .from("subscribers")
    .update({ email_sent: true, email_sent_at: emailSentAt.toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteSubscriber(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("subscribers")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function getSubscriberCount(landing_page_slug: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("subscribers")
    .select("*", { count: "exact", head: true })
    .eq("landing_page_slug", landing_page_slug);

  if (error) return 0;
  return count ?? 0;
}

export async function markNotionSynced(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("subscribers")
    .update({ notion_synced: true })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
