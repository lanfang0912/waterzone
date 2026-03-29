import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ImportClient from './ImportClient'

export default async function ImportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('company_id, role').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/')

  if (profile.role !== 'admin') redirect('/')

  // Fetch existing duplicate keys for dedup check
  const { data: existingHeaders } = await supabase
    .from('raw_invoice_headers')
    .select('duplicate_key')
    .eq('company_id', profile.company_id)
    .not('duplicate_key', 'is', null)

  const existingKeys = new Set((existingHeaders ?? []).map(h => h.duplicate_key as string))

  return (
    <ImportClient
      companyId={profile.company_id}
      userId={user.id}
      existingDuplicateKeys={Array.from(existingKeys)}
    />
  )
}
