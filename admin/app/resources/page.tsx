import Link from "next/link";
import { getPublishedLandingPages } from "@/lib/db/landing-pages";

export const metadata = {
  title: "免費資源 | 悠藍",
  description: "收藏你需要的紫微斗數學習資源，每一份都是我整理給你的禮物。",
};

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const pages = await getPublishedLandingPages();

  const hosted = pages.filter((p) => p.page_type === "hosted" || p.page_type === "quiz");

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl font-bold text-stone-800 mb-3">免費資源</h1>
          <p className="text-stone-500 text-base leading-relaxed">
            這裡收錄了我整理的紫微斗數學習資源。<br />
            找到你需要的，填上 email，我直接寄給你。
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        {hosted.length === 0 ? (
          <p className="text-center text-stone-400 py-20">資源整理中，請稍後回來。</p>
        ) : (
          <div className="grid gap-4">
            {hosted.map((page) => (
              <Link
                key={page.id}
                href={`/${page.slug}`}
                className="group block bg-white rounded-2xl border border-stone-100 px-6 py-5
                           hover:border-stone-300 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-stone-800 group-hover:text-stone-900 mb-1 leading-snug">
                      {page.hero_title || page.name}
                    </h2>
                    {(page.hero_subtitle || page.seo_description) && (
                      <p className="text-sm text-stone-500 leading-relaxed line-clamp-2">
                        {page.hero_subtitle || page.seo_description}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 mt-0.5 text-sm font-medium text-stone-400
                                   group-hover:text-stone-700 transition-colors">
                    索取 →
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
