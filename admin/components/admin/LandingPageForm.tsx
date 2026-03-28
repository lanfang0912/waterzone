"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LandingPage, PageTheme } from "@/types";
import { THEMES } from "@/lib/themes";

type Tab = "basic" | "content" | "cta" | "email" | "seo";

const TABS: { key: Tab; label: string }[] = [
  { key: "basic",   label: "基本" },
  { key: "content", label: "內容" },
  { key: "cta",     label: "CTA" },
  { key: "email",   label: "Email" },
  { key: "seo",     label: "SEO" },
];

type FormData = Omit<LandingPage, "id" | "created_at" | "updated_at" | "body_json">;

function emptyForm(): FormData {
  return {
    name: "",
    slug: "",
    page_type: "hosted",
    external_url: null,
    migration_status: "hosted",
    status: "draft",
    theme: "rose",
    btn: null,
    cta: null,
    keyword: null,
    keyword_reply: null,
    email_subject: null,
    email_body: null,
    confirm_btn: null,
    faq_1_q: null, faq_1_a: null,
    faq_2_q: null, faq_2_a: null,
    faq_3_q: null, faq_3_a: null,
    consult_1: null,
    consult_2: null,
    consult_3: null,
    hero_title: null,
    hero_subtitle: null,
    seo_title: null,
    seo_description: null,
  };
}

export function LandingPageForm({ page }: { page?: LandingPage }) {
  const router = useRouter();
  const isEdit = !!page;

  const [tab, setTab] = useState<Tab>("basic");
  const [form, setForm] = useState<FormData>(() => {
    if (!page) return emptyForm();
    const { id: _id, created_at: _c, updated_at: _u, body_json: _b, ...rest } = page;
    return rest;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function set(field: keyof FormData, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value || null }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const url = isEdit
        ? `/api/admin/landing-pages/${page!.id}`
        : "/api/admin/landing-pages";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!json.success) throw new Error(json.error);

      if (!isEdit) {
        router.push(`/admin/landing-pages/${json.data.id}/edit`);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Tab 導覽 */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 基本 ── */}
      {tab === "basic" && (
        <Section>
          <Field label="頁面名稱" required>
            <Input value={form.name} onChange={(v) => set("name", v)} required />
          </Field>
          <Field label="Slug（網址）" required hint="只能英文小寫、數字、dash">
            <Input
              value={form.slug}
              onChange={(v) => set("slug", v.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              required
              placeholder="my-page"
            />
          </Field>
          <Field label="頁面類型">
            <Select
              value={form.page_type}
              onChange={(v) => set("page_type", v)}
              options={[
                { value: "hosted", label: "Hosted（新系統）" },
                { value: "external", label: "External（舊 GitHub）" },
              ]}
            />
          </Field>
          {form.page_type === "external" && (
            <Field label="外部 URL">
              <Input
                value={form.external_url ?? ""}
                onChange={(v) => set("external_url", v)}
                placeholder="https://quiz.urland.com.tw/..."
              />
            </Field>
          )}
          <Field label="遷移狀態">
            <Select
              value={form.migration_status}
              onChange={(v) => set("migration_status", v)}
              options={[
                { value: "legacy",     label: "Legacy（舊頁）" },
                { value: "transition", label: "Transition（接 API）" },
                { value: "hosted",     label: "Hosted（已搬遷）" },
                { value: "archived",   label: "Archived（停用）" },
              ]}
            />
          </Field>
          <Field label="發佈狀態">
            <Select
              value={form.status}
              onChange={(v) => set("status", v)}
              options={[
                { value: "draft",     label: "草稿" },
                { value: "published", label: "已發佈" },
              ]}
            />
          </Field>
          <Field label="頁面主題">
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(THEMES) as [PageTheme, typeof THEMES[PageTheme]][]).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set("theme", key)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all"
                  style={{
                    borderColor: form.theme === key ? t.swatch : "#e5e7eb",
                    background: form.theme === key ? `${t.swatch}15` : "white",
                    fontWeight: form.theme === key ? 600 : 400,
                  }}
                >
                  <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: t.swatch }} />
                  {t.label}
                </button>
              ))}
            </div>
          </Field>
        </Section>
      )}

      {/* ── 內容 ── */}
      {tab === "content" && (
        <Section>
          <Field label="Hero 標題">
            <Input value={form.hero_title ?? ""} onChange={(v) => set("hero_title", v)} />
          </Field>
          <Field label="Hero 副標題">
            <Input value={form.hero_subtitle ?? ""} onChange={(v) => set("hero_subtitle", v)} />
          </Field>
          <div className="border-t border-gray-100 pt-4 mt-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">FAQ</p>
            {([1, 2, 3] as const).map((n) => (
              <div key={n} className="mb-4">
                <Field label={`FAQ ${n} 問題`}>
                  <Input
                    value={(form[`faq_${n}_q`] as string) ?? ""}
                    onChange={(v) => set(`faq_${n}_q`, v)}
                  />
                </Field>
                <Field label={`FAQ ${n} 回答`}>
                  <Textarea
                    value={(form[`faq_${n}_a`] as string) ?? ""}
                    onChange={(v) => set(`faq_${n}_a`, v)}
                  />
                </Field>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-4 mt-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Consult Scripts</p>
            {([1, 2, 3] as const).map((n) => (
              <Field key={n} label={`腳本 ${n}`}>
                <Textarea
                  value={(form[`consult_${n}`] as string) ?? ""}
                  onChange={(v) => set(`consult_${n}`, v)}
                />
              </Field>
            ))}
          </div>
        </Section>
      )}

      {/* ── CTA ── */}
      {tab === "cta" && (
        <Section>
          <Field label="按鈕文字 (btn)">
            <Input value={form.btn ?? ""} onChange={(v) => set("btn", v)} placeholder="立即報名" />
          </Field>
          <Field label="CTA 文案">
            <Textarea value={form.cta ?? ""} onChange={(v) => set("cta", v)} />
          </Field>
          <Field label="關鍵字 (keyword)" hint="用於 LINE 觸發">
            <Input value={form.keyword ?? ""} onChange={(v) => set("keyword", v)} />
          </Field>
          <Field label="關鍵字回覆 (keyword_reply)">
            <Textarea value={form.keyword_reply ?? ""} onChange={(v) => set("keyword_reply", v)} />
          </Field>
        </Section>
      )}

      {/* ── Email ── */}
      {tab === "email" && (
        <Section>
          <Field label="Email 主旨">
            <Input value={form.email_subject ?? ""} onChange={(v) => set("email_subject", v)} />
          </Field>
          <Field label="Email 內文" hint="支援純文字或 HTML">
            <Textarea
              value={form.email_body ?? ""}
              onChange={(v) => set("email_body", v)}
              rows={10}
            />
          </Field>
          <Field label="確認按鈕文字 (confirm_btn)">
            <Input value={form.confirm_btn ?? ""} onChange={(v) => set("confirm_btn", v)} placeholder="確認訂閱" />
          </Field>
        </Section>
      )}

      {/* ── SEO ── */}
      {tab === "seo" && (
        <Section>
          <Field label="SEO 標題" hint="建議 60 字以內">
            <Input value={form.seo_title ?? ""} onChange={(v) => set("seo_title", v)} />
          </Field>
          <Field label="SEO 描述" hint="建議 160 字以內">
            <Textarea value={form.seo_description ?? ""} onChange={(v) => set("seo_description", v)} rows={3} />
          </Field>
        </Section>
      )}

      {/* 底部操作列 */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/admin/landing-pages")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 返回列表
        </button>
        <div className="flex items-center gap-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-green-600">已儲存</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                       text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {saving ? "儲存中..." : isEdit ? "儲存變更" : "建立頁面"}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── 小元件 ─────────────────────────────────────────────────

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {hint && <span className="text-gray-400 font-normal ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  required,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

function Textarea({
  value,
  onChange,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
