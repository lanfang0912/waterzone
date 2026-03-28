"use client";

import { useState, useCallback } from "react";
import type { Subscriber } from "@/types";

type SlugOption = { value: string; label: string };

export function SubscribersTable({ slugOptions }: { slugOptions: SlugOption[] }) {
  const [rows, setRows]       = useState<Subscriber[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  // 篩選
  const [search, setSearch]         = useState("");
  const [filterSlug, setFilterSlug] = useState("");
  const [filterSent, setFilterSent] = useState("");

  // 重寄狀態
  const [resending, setResending] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<Record<string, string>>({});

  // 刪除狀態
  const [deleting, setDeleting] = useState<string | null>(null);

  // 新增 modal
  const [showAdd, setShowAdd]   = useState(false);
  const [addForm, setAddForm]   = useState({ name: "", email: "", phone: "", landing_page_slug: "" });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError]   = useState("");

  const LIMIT = 50;

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (search)      params.set("search", search);
    if (filterSlug)  params.set("slug", filterSlug);
    if (filterSent)  params.set("email_sent", filterSent);

    const res  = await fetch(`/api/admin/subscribers?${params}`);
    const json = await res.json();
    setRows(json.data ?? []);
    setTotal(json.count ?? 0);
    setPage(p);
    setFetched(true);
    setLoading(false);
  }, [search, filterSlug, filterSent]);

  async function handleDelete(id: string) {
    if (!confirm("確定要刪除這筆訂閱者資料？")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/subscribers/${id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((r) => r.id !== id));
      setTotal((prev) => prev - 1);
    } finally {
      setDeleting(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddSaving(true);
    setAddError("");
    try {
      const res = await fetch("/api/admin/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setShowAdd(false);
      setAddForm({ name: "", email: "", phone: "", landing_page_slug: "" });
      fetchData(1);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "新增失敗");
    } finally {
      setAddSaving(false);
    }
  }

  async function handleResend(id: string) {
    setResending(id);
    try {
      const res = await fetch(`/api/admin/subscribers/${id}/resend-email`, { method: "POST" });
      const json = await res.json();
      setResendMsg((prev) => ({ ...prev, [id]: json.success ? "已重寄" : json.error ?? "失敗" }));
    } finally {
      setResending(null);
      setTimeout(() => setResendMsg((prev) => { const n = { ...prev }; delete n[id]; return n; }), 3000);
    }
  }

  function exportCsv() {
    const headers = ["姓名", "Email", "電話", "Landing Page", "來源", "Email已寄", "建立時間"];
    const lines = rows.map((r) =>
      [
        r.name,
        r.email,
        r.phone ?? "",
        r.landing_page_slug ?? "",
        r.utm_source ?? r.source ?? "",
        r.email_sent ? "是" : "否",
        new Date(r.created_at).toLocaleString("zh-TW"),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob(["\uFEFF" + [headers.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      {/* 新增 modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleAdd} className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">新增訂閱者</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名 <span className="text-red-500">*</span></label>
              <input required value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <input required type="email" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
              <input value={addForm.phone} onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Landing Page</label>
              <select value={addForm.landing_page_slug} onChange={(e) => setAddForm((p) => ({ ...p, landing_page_slug: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">不指定</option>
                {slugOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {addError && <p className="text-sm text-red-600">{addError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">取消</button>
              <button type="submit" disabled={addSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg">
                {addSaving ? "新增中..." : "新增"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 篩選列 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="搜尋姓名 / Email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-56
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterSlug}
          onChange={(e) => setFilterSlug(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">所有頁面</option>
          {slugOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filterSent}
          onChange={(e) => setFilterSent(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Email 狀態（全部）</option>
          <option value="true">已寄出</option>
          <option value="false">未寄出</option>
        </select>
        <button
          onClick={() => fetchData(1)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          查詢
        </button>
        {fetched && rows.length > 0 && (
          <button
            onClick={exportCsv}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-sm rounded-lg transition-colors"
          >
            匯出 CSV
          </button>
        )}
        {fetched && (
          <span className="text-sm text-gray-500 self-center">共 {total} 筆</span>
        )}
        <button
          onClick={() => setShowAdd(true)}
          className="ml-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
        >
          + 新增訂閱者
        </button>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-gray-600 font-medium">姓名 / Email</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">電話</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Landing Page</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">建立時間</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {!fetched && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                  按「查詢」載入資料
                </td>
              </tr>
            )}
            {fetched && loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                  載入中...
                </td>
              </tr>
            )}
            {fetched && !loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                  沒有符合的名單
                </td>
              </tr>
            )}
            {!loading && rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{row.name}</div>
                  <div className="text-gray-400 text-xs">{row.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{row.phone ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{row.landing_page_slug ?? "—"}</td>
                <td className="px-4 py-3">
                  {row.email_sent ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">已寄出</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">未寄出</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(row.created_at).toLocaleString("zh-TW", {
                    month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {resendMsg[row.id] ? (
                      <span className={`text-xs ${resendMsg[row.id] === "已重寄" ? "text-green-600" : "text-red-500"}`}>
                        {resendMsg[row.id]}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleResend(row.id)}
                        disabled={resending === row.id}
                        className="text-xs text-blue-600 hover:underline disabled:opacity-40"
                      >
                        {resending === row.id ? "寄送中..." : "重寄 Email"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(row.id)}
                      disabled={deleting === row.id}
                      className="text-xs text-red-500 hover:underline disabled:opacity-40"
                    >
                      {deleting === row.id ? "刪除中..." : "刪除"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => fetchData(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← 上一頁
          </button>
          <span className="text-sm text-gray-600">
            第 {page} / {totalPages} 頁
          </span>
          <button
            onClick={() => fetchData(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            下一頁 →
          </button>
        </div>
      )}
    </div>
  );
}
