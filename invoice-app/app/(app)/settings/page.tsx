import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*, companies(*)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: accountants } = await supabase
    .from('users')
    .select('id, name, email, role, created_at')
    .eq('company_id', profile.company_id ?? '')
    .eq('role', 'accountant')

  const { data: categories } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('company_id', profile.company_id ?? '')
    .order('sort_order')

  return (
    <SettingsClient
      profile={profile}
      company={(profile as { companies?: Record<string, unknown> }).companies as Record<string, string> | null}
      accountants={accountants ?? []}
      categories={categories ?? []}
    />
  )
}
