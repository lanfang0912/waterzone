import Link from "next/link";
import { getLandingPages } from "@/lib/db/landing-pages";
import { LandingPageTable } from "@/components/admin/LandingPageTable";

export const metadata = { title: "Landing Pages | Urland Admin" };
export const dynamic = "force-dynamic";

export default async function LandingPagesPage() {
  const pages = await getLandingPages();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Landing Pages</h1>
          <p className="text-sm text-gray-500 mt-0.5">共 {pages.length} 個頁面</p>
        </div>
        <Link
          href="/admin/landing-pages/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                     px-4 py-2 rounded-lg transition-colors"
        >
          + 新增頁面
        </Link>
      </div>

      <LandingPageTable initialPages={pages} />
    </div>
  );
}
