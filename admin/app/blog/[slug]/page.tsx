import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getArticleBySlug } from "@/lib/db/articles";
import { getLandingPageBySlug } from "@/lib/db/landing-pages";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.seo_title ?? article.title,
    description: article.seo_description ?? article.excerpt ?? undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article || article.status !== "published") notFound();

  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const isBlogSubdomain = host.startsWith("blog.");
  const backHref = isBlogSubdomain ? "/" : "/blog";

  const landingPage = article.landing_page_slug
    ? await getLandingPageBySlug(article.landing_page_slug)
    : null;

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Back */}
        <Link href={backHref} className="text-sm text-stone-400 hover:text-stone-600 mb-8 inline-block">
          ← 所有文章
        </Link>

        {/* Article */}
        <article>
          {article.cover_image && (
            <img
              src={article.cover_image}
              alt={article.title}
              className="w-full rounded-2xl mb-6 object-contain bg-stone-50"
            />
          )}
          <h1 className="text-2xl font-bold text-stone-900 leading-snug mb-4">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="text-stone-500 text-base leading-relaxed mb-8 border-l-2 border-stone-200 pl-4">
              {article.excerpt}
            </p>
          )}
          <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed whitespace-pre-wrap">
            {article.content}
          </div>
        </article>

        {/* Summary Image */}
        {article.summary_image && (
          <div className="mt-8">
            <img
              src={article.summary_image}
              alt="全文摘要"
              className="w-full object-contain bg-stone-50 rounded-2xl"
            />
          </div>
        )}

        {/* CTA */}
        {landingPage && (
          <div className="mt-12 bg-white border border-stone-100 rounded-2xl px-6 py-6 text-center">
            <p className="text-stone-600 text-sm mb-4">
              {landingPage.cta ?? "想要更多這樣的內容？"}
            </p>
            <Link
              href={`/${landingPage.slug}`}
              className="inline-block bg-stone-800 hover:bg-stone-900 text-white
                         text-sm font-medium px-6 py-3 rounded-xl transition-colors"
            >
              {landingPage.btn ?? "免費領取"}
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-stone-100 text-center">
          <p className="text-sm text-stone-400">Erica Hsu 許藍方｜希塔療癒導師・關係靈氣療癒師</p>
          <Link href="/gifts" className="text-sm text-stone-500 hover:text-stone-700 mt-2 inline-block">
            查看所有免費資源 →
          </Link>
        </div>
      </div>
    </main>
  );
}
