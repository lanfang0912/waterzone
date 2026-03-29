import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ScanClient from './ScanClient'

export default async function ScanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('company_id, role').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/')

  const { data: categories } = await supabase
    .from('expense_categories')
    .select('code, label')
    .eq('company_id', profile.company_id)
    .order('sort_order')

  return (
    <ScanClient
      companyId={profile.company_id}
      userId={user.id}
      categories={categories ?? []}
    />
  )
}
