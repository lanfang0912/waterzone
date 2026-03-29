"use client";

import { useState } from "react";

type SlugOption = { value: string; label: string };
type Result = { sent: number; failed: number; total: number };

export function BroadcastForm({ slugOptions }: { slugOptions: SlugOption[] }) {
  const [slug, setSlug]       = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody]       = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState<Result | null>(null);
  const [error, setError]     = useState("");
  const [confirmed, setConfirmed] = useState(false);

  async function handleSend() {
    if (!confirmed) { setConfirmed(true); return; }
    setSending(true); setError(""); setResult(null); setConfirmed(false);
    try {
      const res  = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, landing_page_slug: slug || undefined }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "發送失敗");
    } finally {
      setSending(false);
    }
  }

  const audienceLabel = slug
    ? slugOptions.find((o) => o.value === slug)?.label ?? slug
    : "所有訂閱者";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* 受眾 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">受眾設定</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">發送對象</label>
          <select value={slug} onChange={(e) => { setSlug(e.target.value); setConfirmed(false); }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">所有訂閱者</option>
            {slugOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* 內容 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Email 內容</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">主旨</label>
          <input value={subject} onChange={(e) => { setSubject(e.target.value); setConfirmed(false); }}
            placeholder="Email 主旨"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            內文
            <span className="text-gray-400 font-normal ml-1">（可用 {"{name}"} 插入姓名）</span>
          </label>
          <textarea value={body} onChange={(e) => { setBody(e.target.value); setConfirmed(false); }}
            rows={12} placeholder={"嗨 {name}，\n\n..."}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
        </div>
      </div>

      {/* 發送 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {result ? (
          <div className="text-center space-y-2">
            <div className="text-3xl">✅</div>
            <p className="font-semibold text-gray-800">發送完成</p>
            <p className="text-sm text-gray-500">
              成功 <span className="text-green-600 font-semibold">{result.sent}</span> 封／
              失敗 <span className="text-red-500 font-semibold">{result.failed}</span> 封／
              共 {result.total} 位訂閱者
            </p>
            <button onClick={() => { setResult(null); setSubject(""); setBody(""); }}
              className="mt-4 text-sm text-blue-600 hover:underline">再寄一封</button>
          </div>
        ) : (
          <div className="space-y-3">
            {confirmed && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                確定要發送給「<strong>{audienceLabel}</strong>」的所有訂閱者嗎？此動作無法撤回。
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={handleSend}
              disabled={sending || !subject || !body}
              className={`w-full py-3 rounded-lg font-medium text-sm transition-colors disabled:opacity-40
                ${confirmed
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"}`}
            >
              {sending ? "發送中..." : confirmed ? `確認發送給「${audienceLabel}」` : "發送 Email"}
            </button>
            {confirmed && (
              <button onClick={() => setConfirmed(false)} className="w-full text-sm text-gray-500 hover:text-gray-700">取消</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
