import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = {
  title: "登入 | Urland Admin",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Urland Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Landing Page 後台管理</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
