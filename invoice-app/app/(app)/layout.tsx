import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TabBar from '@/components/layout/TabBar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50">
      <main className="flex-1 has-tab-bar">
        {children}
      </main>
      <TabBar />
    </div>
  )
}
