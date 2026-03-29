"use client";

import { useState, useCallback } from "react";
import type { EmailLog, EmailLogStatus } from "@/types";

const STATUS_LABEL: Record<EmailLogStatus, string> = {
  sent:    "成功",
  failed:  "失敗",
  pending: "等待中",
};
const STATUS_COLOR: Record<EmailLogStatus, string> = {
  sent:    "bg-green-100 text-green-700",
  failed:  "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
};

export function EmailLogsTable() {
  const [rows, setRows]       = useState<EmailLog[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [filterStatus, setFilterStatus] = useState<EmailLogStatus | "">("");
  const [expandedError, setExpandedError] = useState<string | null>(null);

  const LIMIT = 50;

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (filterStatus) params.set("status", filterStatus);

    const res  = await fetch(`/api/admin/email-logs?${params}`);
    const json = await res.json();
    setRows(json.data ?? []);
    setTotal(json.count ?? 0);
    setPage(p);
    setFetched(true);
    setLoading(false);
  }, [filterStatus]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      {/* 篩選列 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as EmailLogStatus | "")}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">所有狀態</option>
          <option value="sent">成功</option>
          <option value="failed">失敗</option>
          <option value="pending">等待中</option>
        </select>
        <button
          onClick={() => fetchData(1)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          查詢
        </button>
        {fetched && (
          <span className="text-sm text-gray-500 self-center">共 {total} 筆</span>
        )}
      </div>

      {/* ── 桌面表格 ── */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-gray-600 font-medium">狀態</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">主旨</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Resend ID</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">錯誤訊息</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">時間</th>
            </tr>
          </thead>
          <tbody>
            {!fetched && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">按「查詢」載入資料</td></tr>}
            {fetched && loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">載入中...</td></tr>}
            {fetched && !loading && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">沒有紀錄</td></tr>}
            {!loading && rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLOR[row.status]}`}>{STATUS_LABEL[row.status]}</span>
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{row.subject ?? "—"}</td>
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                  {row.resend_email_id ? row.resend_email_id.slice(0, 16) + "..." : "—"}
                </td>
                <td className="px-4 py-3 max-w-xs">
                  {row.error_message ? (
                    <div>
                      <button onClick={() => setExpandedError(expandedError === row.id ? null : row.id)} className="text-xs text-red-600 hover:underline">
                        {expandedError === row.id ? "收起" : "查看錯誤"}
                      </button>
                      {expandedError === row.id && (
                        <pre className="mt-1 text-xs text-red-700 bg-red-50 rounded p-2 whitespace-pre-wrap break-all">{row.error_message}</pre>
                      )}
                    </div>
                  ) : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(row.sent_at).toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 手機卡片 ── */}
      <div className="md:hidden space-y-3">
        {!fetched && <div className="bg-white rounded-xl border border-gray-200 px-4 py-10 text-center text-gray-400 text-sm">按「查詢」載入資料</div>}
        {fetched && loading && <div className="bg-white rounded-xl border border-gray-200 px-4 py-10 text-center text-gray-400 text-sm">載入中...</div>}
        {fetched && !loading && rows.length === 0 && <div className="bg-white rounded-xl border border-gray-200 px-4 py-10 text-center text-gray-400 text-sm">沒有紀錄</div>}
        {!loading && rows.map((row) => (
          <div key={row.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLOR[row.status]}`}>{STATUS_LABEL[row.status]}</span>
              <span className="text-xs text-gray-400">
                {new Date(row.sent_at).toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="text-sm text-gray-700">{row.subject ?? "—"}</div>
            {row.resend_email_id && (
              <div className="text-xs text-gray-400 font-mono">{row.resend_email_id.slice(0, 20)}...</div>
            )}
            {row.error_message && (
              <div>
                <button onClick={() => setExpandedError(expandedError === row.id ? null : row.id)} className="text-xs text-red-600 hover:underline">
                  {expandedError === row.id ? "收起錯誤" : "查看錯誤"}
                </button>
                {expandedError === row.id && (
                  <pre className="mt-1 text-xs text-red-700 bg-red-50 rounded p-2 whitespace-pre-wrap break-all">{row.error_message}</pre>
                )}
              </div>
            )}
          </div>
        ))}
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
