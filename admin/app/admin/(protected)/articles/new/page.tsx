import { ArticleForm } from "@/components/admin/ArticleForm";

export const metadata = { title: "新增文章 | 悠藍電子報管理系統" };

export default function NewArticlePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">新增文章</h1>
      <ArticleForm />
    </div>
  );
}
