export type ArticleStatus = "draft" | "published";

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  status: ArticleStatus;
  landing_page_slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  cover_image: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
