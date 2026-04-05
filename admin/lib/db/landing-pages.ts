import { supabaseAdmin } from "./client";
import type { LandingPage } from "@/types";

export async function getPublishedLandingPages(): Promise<LandingPage[]> {
  const { data, error } = await supabaseAdmin
    .from("landing_pages")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLandingPages(): Promise<LandingPage[]> {
  const { data, error } = await supabaseAdmin
    .from("landing_pages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLandingPageById(id: string): Promise<LandingPage | null> {
  const { data, error } = await supabaseAdmin
    .from("landing_pages")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getLandingPageBySlug(slug: string): Promise<LandingPage | null> {
  const { data, error } = await supabaseAdmin
    .from("landing_pages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data;
}

export async function createLandingPage(
  payload: Omit<LandingPage, "id" | "created_at" | "updated_at">
): Promise<LandingPage> {
  const { data, error } = await supabaseAdmin
    .from("landing_pages")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateLandingPage(
  id: string,
  payload: Partial<Omit<LandingPage, "id" | "created_at" | "updated_at">>
): Promise<LandingPage> {
  const { data, error } = await supabaseAdmin
    .from("landing_pages")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteLandingPage(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("landing_pages")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function duplicateLandingPage(id: string): Promise<LandingPage> {
  const original = await getLandingPageById(id);
  if (!original) throw new Error("Landing page not found");

  const { id: _id, created_at: _c, updated_at: _u, ...rest } = original;

  const newSlug = `${rest.slug}-copy-${Date.now().toString(36)}`;

  return createLandingPage({
    ...rest,
    name: `${rest.name}（複製）`,
    slug: newSlug,
    status: "draft",
  });
}
