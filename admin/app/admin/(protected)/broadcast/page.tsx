import { getLandingPages } from "@/lib/db/landing-pages";
import { BroadcastForm } from "@/components/admin/BroadcastForm";

export const metadata = { title: "群發 Email | 悠藍電子報管理系統" };
export const dynamic = "force-dynamic";

export default async function BroadcastPage() {
  const pages = await getLandingPages();
  const slugOptions = pages.map((p) => ({ value: p.slug, label: `${p.name} (${p.slug})` }));
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">群發 Email</h1>
        <p className="text-sm text-gray-500 mt-1">選擇受眾、撰寫內容，發送給所有訂閱者</p>
      </div>
      <BroadcastForm slugOptions={slugOptions} />
    </div>
  );
}
