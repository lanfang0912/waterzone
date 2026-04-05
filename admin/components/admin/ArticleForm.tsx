"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  initial?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string | null;
    status: string;
    landing_page_slug: string | null;
    cover_image: string | null;
    seo_title: string | null;
    seo_description: string | null;
  };
}

export function ArticleForm({ initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [landingPageSlug, setLandingPageSlug] = useState(initial?.landing_page_slug ?? "");
  const [coverImage, setCoverImage] = useState(initial?.cover_image ?? "");
  const [uploading, setUploading] = useState(false);
  const [seoTitle, setSeoTitle] = useState(initial?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seo_description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoverImage(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  }

  function toSlug(text: string) {
    return text
      .toLowerCase()
      .replace(/[\s\u4e00-\u9fff]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!isEdit) setSlug(toSlug(val));
  }

  async function handleSave(publish: boolean) {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title,
        slug,
        excerpt: excerpt || null,
        content: content || null,
        status: publish ? "published" : "draft",
        cover_image: coverImage || null,
        landing_page_slug: landingPageSlug || null,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        published_at: publish ? new Date().toISOString() : null,
      };

      const url = isEdit
        ? `/api/admin/articles/${initial.id}`
        : "/api/admin/articles";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");
      router.push("/admin/articles");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="文章標題"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Slug（網址）</label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="article-slug"
        />
        <p className="text-xs text-gray-400 mt-1">admin.urland.com.tw/blog/{slug || "..."}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="一兩句話說明這篇文章的內容"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">封面圖片</label>
        <div className="space-y-2">
          {coverImage && (
            <img src={coverImage} alt="封面" className="w-full max-h-48 object-cover rounded-lg" />
          )}
          <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed
                            border-gray-200 rounded-lg px-4 py-4 cursor-pointer
                            hover:border-gray-400 transition-colors text-sm text-gray-500
                            ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            {uploading ? "上傳中…" : coverImage ? "換一張圖" : "上傳圖片"}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">文章內容</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
          placeholder="貼上你的 Facebook 文章內容..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          導到哪個 Landing Page？<span className="text-gray-400 font-normal">（slug，選填）</span>
        </label>
        <input
          value={landingPageSlug}
          onChange={(e) => setLandingPageSlug(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例如：express-needs"
        />
      </div>

      <div className="border-t border-gray-100 pt-5 space-y-4">
        <p className="text-sm font-medium text-gray-700">SEO（選填）</p>
        <div>
          <label className="block text-xs text-gray-500 mb-1">SEO 標題</label>
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">SEO 描述</label>
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "儲存中…" : "存為草稿"}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "儲存中…" : "發佈"}
        </button>
      </div>
    </div>
  );
}
