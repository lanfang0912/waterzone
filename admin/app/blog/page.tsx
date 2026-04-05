import Link from "next/link";
import { getPublishedArticles } from "@/lib/db/articles";

export const metadata = {
  title: "文章 | Erica Hsu 許藍方",
  description: "關係、療癒、自我成長。Erica 整理的文章，陪你慢慢看懂自己。",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const articles = await getPublishedArticles();

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-6 py-12 text-center">
          <p className="text-sm text-stone-400 mb-2">Erica Hsu 許藍方｜希塔療癒導師・關係靈氣療癒師</p>
          <h1 className="text-3xl font-bold text-stone-800 mb-3">文章</h1>
          <p className="text-stone-500 text-base">關係・療癒・自我成長</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {articles.length === 0 ? (
          <p className="text-center text-stone-400 py-20">文章整理中，請稍後回來。</p>
        ) : (
          <div className="grid gap-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="group block bg-white rounded-2xl border border-stone-100 px-6 py-5
                           hover:border-stone-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-stone-800 group-hover:text-stone-900 mb-1 leading-snug">
                      {article.title}
                    </h2>
                    {article.excerpt && (
                      <p className="text-sm text-stone-500 leading-relaxed line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 mt-0.5 text-sm font-medium text-stone-400
                                   group-hover:text-stone-700 transition-colors">
                    閱讀 →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
