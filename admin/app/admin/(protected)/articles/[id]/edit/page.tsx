import { notFound } from "next/navigation";
import { getArticleById } from "@/lib/db/articles";
import { ArticleForm } from "@/components/admin/ArticleForm";

export const metadata = { title: "編輯文章 | 悠藍電子報管理系統" };

type Props = { params: Promise<{ id: string }> };

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">編輯文章</h1>
      <ArticleForm initial={article} />
    </div>
  );
}
