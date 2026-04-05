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
          <p className="text-sm text-stone-400 mb-2">Erica Hsu 許藍方｜希塔療癒導師・關係靈氣療癒師</p>
          <h1 className="text-3xl font-bold text-stone-800 mb-3">免費資源</h1>
          <p className="text-stone-500 text-base leading-relaxed">
            這裡收錄了我整理的學習資源。<br />
            找到你需要的，填上 email，我直接寄給你。
          </p>
        </div>
      </div>

      {/* LINE */}
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-0">
        <div className="flex gap-3">
          <a
            href="https://lihi.cc/PgPto"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 flex-1 bg-[#06C755] hover:bg-[#05b34c]
                       text-white text-sm font-medium px-4 py-3 rounded-2xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.02 2 11c0 3.09 1.61 5.82 4.07 7.55L5 21l3.23-1.62C9.35 19.77 10.65 20 12 20c5.52 0 10-4.02 10-9S17.52 2 12 2z"/>
            </svg>
            加入 LINE 社群「大女主的逆襲人生」
          </a>
          <a
            href="https://www.facebook.com/share/18ktRDtxsZ/?mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166fe5]
                       text-white text-sm font-medium px-4 py-3 rounded-2xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            粉專
          </a>
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
