"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LandingPage, PageType, MigrationStatus, PageStatus } from "@/types";

const STATUS_LABEL: Record<PageStatus, string> = {
  published: "已發佈",
  draft: "草稿",
};
const STATUS_COLOR: Record<PageStatus, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-600",
};
const TYPE_LABEL: Record<PageType, string> = {
  hosted: "普通",
  quiz: "測驗",
  external: "External",
};
const TYPE_COLOR: Record<PageType, string> = {
  hosted: "bg-blue-100 text-blue-700",
  quiz: "bg-purple-100 text-purple-700",
  external: "bg-orange-100 text-orange-700",
};
const MIGRATION_LABEL: Record<MigrationStatus, string> = {
  legacy: "Legacy",
  transition: "Transition",
  hosted: "Hosted",
  archived: "Archived",
};

export function LandingPageTable({ initialPages, subscriberCounts = {} }: { initialPages: LandingPage[]; subscriberCounts?: Record<string, number> }) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<PageType | "">("");
  const [filterStatus, setFilterStatus] = useState<PageStatus | "">("");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = pages.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || p.page_type === filterType;
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  async function handleAction(id: string, action: "duplicate" | "publish" | "unpublish" | "delete") {
    setLoading(id + action);
    try {
      if (action === "delete") {
        if (!confirm("確定要刪除這個頁面嗎？")) return;
        await fetch(`/api/admin/landing-pages/${id}`, { method: "DELETE" });
        setPages((prev) => prev.filter((p) => p.id !== id));
      } else {
        const res = await fetch(`/api/admin/landing-pages/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _action: action }),
        });
        const json = await res.json();
        if (action === "duplicate") {
          router.push(`/admin/landing-pages/${json.data.id}/edit`);
        } else {
          setPages((prev) => prev.map((p) => (p.id === id ? json.data : p)));
        }
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      {/* 搜尋 + 篩選 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="搜尋名稱 / slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as PageType | "")}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">所有類型</option>
          <option value="hosted">Hosted</option>
          <option value="external">External</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as PageStatus | "")}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">所有狀態</option>
          <option value="published">已發佈</option>
          <option value="draft">草稿</option>
        </select>
        <span className="text-sm text-gray-500 self-center">
          {filtered.length} 筆
        </span>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-gray-600 font-medium">名稱 / Slug</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">類型</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">遷移狀態</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">狀態</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">訂閱人數</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  沒有符合條件的頁面
                </td>
              </tr>
            )}
            {filtered.map((page) => {
              const busy = loading?.startsWith(page.id);
              return (
                <tr key={page.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{page.name}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{page.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLOR[page.page_type]}`}>
                      {TYPE_LABEL[page.page_type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">
                      {MIGRATION_LABEL[page.migration_status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[page.status]}`}>
                      {STATUS_LABEL[page.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium text-gray-700">
                      {(subscriberCounts[page.slug] ?? 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={
                          page.page_type === "external" && page.external_url
                            ? page.external_url
                            : `/${page.slug}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        預覽 ↗
                      </a>
                      <Link
                        href={`/admin/landing-pages/${page.id}/edit`}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        編輯
                      </Link>
                      <button
                        onClick={() => handleAction(page.id, "duplicate")}
                        disabled={!!busy}
                        className="text-gray-500 hover:text-gray-700 text-xs disabled:opacity-40"
                      >
                        複製
                      </button>
                      {page.status === "draft" ? (
                        <button
                          onClick={() => handleAction(page.id, "publish")}
                          disabled={!!busy}
                          className="text-green-600 hover:text-green-700 text-xs disabled:opacity-40"
                        >
                          發佈
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(page.id, "unpublish")}
                          disabled={!!busy}
                          className="text-yellow-600 hover:text-yellow-700 text-xs disabled:opacity-40"
                        >
                          下架
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(page.id, "delete")}
                        disabled={!!busy}
                        className="text-red-500 hover:text-red-600 text-xs disabled:opacity-40"
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
