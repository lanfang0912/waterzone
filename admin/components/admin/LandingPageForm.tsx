"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LandingPage, PageTheme } from "@/types";
import { THEMES } from "@/lib/themes";

type Tab = "basic" | "content" | "cta" | "email" | "seo" | "quiz";

type QuizSection = { title: string; itemsText: string };
type ScoreRange = { min: string; max: string; label: string; description: string };
type QuizFormData = {
  intro: string;
  sections: QuizSection[];
  scoring: ScoreRange[];
  practice: string;
  closing: string;
};

function defaultQuiz(): QuizFormData {
  return {
    intro: "在符合你的狀況前打勾，不用想太久，第一直覺最準。",
    sections: [
      { title: "第一部分", itemsText: "" },
      { title: "第二部分", itemsText: "" },
    ],
    scoring: [
      { min: "0", max: "8", label: "", description: "" },
      { min: "9", max: "18", label: "", description: "" },
      { min: "19", max: "30", label: "", description: "" },
    ],
    practice: "",
    closing: "",
  };
}

function quizToJson(q: QuizFormData): Record<string, unknown> {
  return {
    intro: q.intro,
    sections: q.sections.map((s) => ({
      title: s.title,
      items: s.itemsText.split("\n").map((l) => l.trim()).filter(Boolean),
    })),
    scoring: q.scoring.map((s) => ({
      min: Number(s.min), max: Number(s.max), label: s.label, description: s.description,
    })),
    practice: q.practice.split("\n").map((l) => l.trim()).filter(Boolean),
    closing: q.closing,
  };
}

function jsonToQuiz(json: Record<string, unknown>): QuizFormData {
  type RawSection = { title?: string; items?: string[] };
  type RawScore = { min?: number; max?: number; label?: string; description?: string };
  return {
    intro: (json.intro as string) ?? "",
    sections: ((json.sections as RawSection[]) ?? []).map((s) => ({
      title: s.title ?? "",
      itemsText: (s.items ?? []).join("\n"),
    })),
    scoring: ((json.scoring as RawScore[]) ?? []).map((s) => ({
      min: String(s.min ?? ""), max: String(s.max ?? ""), label: s.label ?? "", description: s.description ?? "",
    })),
    practice: ((json.practice as string[]) ?? []).join("\n"),
    closing: (json.closing as string) ?? "",
  };
}

const TABS: { key: Tab; label: string; quizOnly?: boolean; hiddenForQuiz?: boolean }[] = [
  { key: "basic",   label: "基本" },
  { key: "content", label: "內容", hiddenForQuiz: true },
  { key: "cta",     label: "CTA" },
  { key: "email",   label: "Email" },
  { key: "seo",     label: "SEO" },
  { key: "quiz",    label: "測驗內容", quizOnly: true },
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
    author_tag: "許藍方・希塔療癒導師・關係靈氣療癒師",
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
  const [quiz, setQuiz] = useState<QuizFormData>(() =>
    page?.body_json ? jsonToQuiz(page.body_json as Record<string, unknown>) : defaultQuiz()
  );
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

      const payload = form.page_type === "quiz"
        ? { ...form, body_json: quizToJson(quiz) }
        : form;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      <div className="flex gap-1 mb-6 border-b border-gray-200 flex-wrap">
        {TABS.filter((t) =>
          t.quizOnly ? form.page_type === "quiz" :
          t.hiddenForQuiz ? form.page_type !== "quiz" : true
        ).map((t) => (
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
                { value: "hosted",   label: "普通型（訂閱表單）" },
                { value: "quiz",     label: "測驗型（勾選 → 結果）" },
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
          <Field label="作者標語">
            <Input
              value={form.author_tag ?? ""}
              onChange={(v) => set("author_tag", v)}
              placeholder="許藍方・希塔療癒導師・關係靈氣療癒師"
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

      {/* ── 測驗內容 ── */}
      {tab === "quiz" && (
        <div className="space-y-6">
          <Section>
            <Field label="說明文字（頁面頂部）">
              <Textarea value={quiz.intro} onChange={(v) => setQuiz((q) => ({ ...q, intro: v }))} rows={2} />
            </Field>
          </Section>

          {/* 題目區塊 */}
          {quiz.sections.map((section, si) => (
            <Section key={si}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">區塊 {si + 1}</span>
                {quiz.sections.length > 1 && (
                  <button type="button" onClick={() => setQuiz((q) => ({ ...q, sections: q.sections.filter((_, i) => i !== si) }))}
                    className="text-xs text-red-500 hover:underline">刪除</button>
                )}
              </div>
              <Field label="區塊標題">
                <Input value={section.title} onChange={(v) => setQuiz((q) => ({ ...q, sections: q.sections.map((s, i) => i === si ? { ...s, title: v } : s) }))} />
              </Field>
              <Field label="題目（每行一題）">
                <Textarea rows={8} value={section.itemsText} onChange={(v) => setQuiz((q) => ({ ...q, sections: q.sections.map((s, i) => i === si ? { ...s, itemsText: v } : s) }))} />
              </Field>
            </Section>
          ))}
          <button type="button"
            onClick={() => setQuiz((q) => ({ ...q, sections: [...q.sections, { title: `第${q.sections.length + 1}部分`, itemsText: "" }] }))}
            className="text-sm text-blue-600 hover:underline">+ 新增區塊</button>

          {/* 計分標準 */}
          <Section>
            <div className="text-sm font-medium text-gray-700 mb-3">計分標準</div>
            {quiz.scoring.map((s, si) => (
              <div key={si} className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
                <Field label="最低分">
                  <input type="number" value={s.min} onChange={(e) => setQuiz((q) => ({ ...q, scoring: q.scoring.map((r, i) => i === si ? { ...r, min: e.target.value } : r) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>
                <Field label="最高分">
                  <input type="number" value={s.max} onChange={(e) => setQuiz((q) => ({ ...q, scoring: q.scoring.map((r, i) => i === si ? { ...r, max: e.target.value } : r) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>
                <div className="col-span-2">
                  <Field label="結果標題">
                    <Input value={s.label} onChange={(v) => setQuiz((q) => ({ ...q, scoring: q.scoring.map((r, i) => i === si ? { ...r, label: v } : r) }))} />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="結果描述">
                    <Textarea rows={2} value={s.description} onChange={(v) => setQuiz((q) => ({ ...q, scoring: q.scoring.map((r, i) => i === si ? { ...r, description: v } : r) }))} />
                  </Field>
                </div>
              </div>
            ))}
            <button type="button"
              onClick={() => setQuiz((q) => ({ ...q, scoring: [...q.scoring, { min: "", max: "", label: "", description: "" }] }))}
              className="text-sm text-blue-600 hover:underline">+ 新增計分範圍</button>
          </Section>

          {/* 小練習 + 結語 */}
          <Section>
            <Field label="今天的小練習（每行一項）">
              <Textarea value={quiz.practice} onChange={(v) => setQuiz((q) => ({ ...q, practice: v }))} rows={3} />
            </Field>
            <Field label="結語" hint="顯示在結果最下方">
              <Textarea value={quiz.closing} onChange={(v) => setQuiz((q) => ({ ...q, closing: v }))} rows={2} />
            </Field>
          </Section>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
            Email 內文可使用變數：<code className="font-mono">{"{name}"}</code>、<code className="font-mono">{"{score}"}</code>、<code className="font-mono">{"{result_label}"}</code>、<code className="font-mono">{"{result_description}"}</code>
          </div>
        </div>
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
