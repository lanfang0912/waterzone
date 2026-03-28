import { getDashboardStats } from "@/lib/db/email-logs";
import { getLandingPages } from "@/lib/db/landing-pages";

export const metadata = { title: "Dashboard | Urland Admin" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, pages] = await Promise.all([
    getDashboardStats(),
    getLandingPages(),
  ]);

  const migrationCounts = {
    legacy:     pages.filter((p) => p.migration_status === "legacy").length,
    transition: pages.filter((p) => p.migration_status === "transition").length,
    hosted:     pages.filter((p) => p.migration_status === "hosted").length,
    archived:   pages.filter((p) => p.migration_status === "archived").length,
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* 主要數字 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Landing Pages" value={stats.totalPages} sub={`Hosted ${stats.hostedPages} / External ${stats.externalPages}`} color="blue" />
        <StatCard label="總名單數" value={stats.totalSubscribers} color="indigo" />
        <StatCard label="今日新增" value={stats.todaySubscribers} color="green" />
        <StatCard label="Email 寄出" value={stats.emailSentCount} sub={`失敗 ${stats.emailFailedCount}`} color="purple" />
      </div>

      {/* 遷移進度 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">遷移進度</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MigrationBadge label="Legacy" count={migrationCounts.legacy} color="text-orange-600 bg-orange-50" />
          <MigrationBadge label="Transition" count={migrationCounts.transition} color="text-yellow-700 bg-yellow-50" />
          <MigrationBadge label="Hosted" count={migrationCounts.hosted} color="text-green-700 bg-green-50" />
          <MigrationBadge label="Archived" count={migrationCounts.archived} color="text-gray-500 bg-gray-100" />
        </div>
        <MigrationBar counts={migrationCounts} total={stats.totalPages} />
      </div>

      {/* 最近頁面 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">最近建立的頁面</h2>
        <div className="space-y-2">
          {pages.slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
              <div>
                <span className="font-medium text-gray-900">{p.name}</span>
                <span className="text-gray-400 ml-2 text-xs">{p.slug}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${p.page_type === "hosted" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                  {p.page_type}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${p.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {p.status === "published" ? "已發佈" : "草稿"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 小元件 ─────────────────────────────────────────────────

const COLOR_MAP = {
  blue:   "bg-blue-50 text-blue-700 border-blue-100",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
  green:  "bg-green-50 text-green-700 border-green-100",
  purple: "bg-purple-50 text-purple-700 border-purple-100",
} as const;

function StatCard({
  label, value, sub, color,
}: {
  label: string; value: number; sub?: string; color: keyof typeof COLOR_MAP;
}) {
  return (
    <div className={`rounded-xl border p-5 ${COLOR_MAP[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  );
}

function MigrationBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`rounded-lg px-4 py-3 text-center ${color}`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs mt-0.5 font-medium">{label}</p>
    </div>
  );
}

function MigrationBar({ counts, total }: { counts: Record<string, number>; total: number }) {
  if (total === 0) return null;
  const segments = [
    { key: "legacy",     color: "bg-orange-400" },
    { key: "transition", color: "bg-yellow-400" },
    { key: "hosted",     color: "bg-green-500" },
    { key: "archived",   color: "bg-gray-300" },
  ];
  return (
    <div className="flex rounded-full overflow-hidden h-2 mt-4 gap-0.5">
      {segments.map(({ key, color }) => {
        const pct = (counts[key] / total) * 100;
        if (pct === 0) return null;
        return <div key={key} className={`${color} h-2`} style={{ width: `${pct}%` }} />;
      })}
    </div>
  );
}
