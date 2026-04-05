import Link from "next/link";
import { getArticles } from "@/lib/db/articles";

export const metadata = { title: "部落格文章 | 悠藍電子報管理系統" };
export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">部落格文章</h1>
          <p className="text-sm text-gray-500 mt-0.5">共 {articles.length} 篇</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                     px-4 py-2 rounded-lg transition-colors"
        >
          + 新增文章
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-20 text-gray-400">還沒有文章，點右上角新增</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {articles.map((article) => (
            <div key={article.id} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    article.status === "published"
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {article.status === "published" ? "已發佈" : "草稿"}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                {article.excerpt && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{article.excerpt}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {article.status === "published" && (
                  <Link
                    href={`/blog/${article.slug}`}
                    target="_blank"
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    預覽
                  </Link>
                )}
                <Link
                  href={`/admin/articles/${article.id}/edit`}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700
                             px-3 py-1.5 rounded-lg transition-colors"
                >
                  編輯
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
