import { EmailLogsTable } from "@/components/admin/EmailLogsTable";

export const metadata = { title: "Email Logs | Urland Admin" };

export default function EmailLogsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Email Logs</h1>
      <EmailLogsTable />
    </div>
  );
}
