import { getLandingPages } from "@/lib/db/landing-pages";
import { SubscribersTable } from "@/components/admin/SubscribersTable";

export const metadata = { title: "Subscribers | Urland Admin" };
export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  const pages = await getLandingPages();
  const slugOptions = pages.map((p) => ({ value: p.slug, label: `${p.name} (${p.slug})` }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Subscribers</h1>
      </div>
      <SubscribersTable slugOptions={slugOptions} />
    </div>
  );
}
