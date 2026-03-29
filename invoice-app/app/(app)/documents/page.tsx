import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DocumentsClient from './DocumentsClient'

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/')

  const params = await searchParams
  const statusFilter = params.status ?? 'all'

  let query = supabase
    .from('documents')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('uploaded_at', { ascending: false })
    .limit(50)

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: documents } = await query

  // Count by status
  const { data: counts } = await supabase
    .from('documents')
    .select('status')
    .eq('company_id', profile.company_id)

  const statusCounts = (counts ?? []).reduce((acc: Record<string, number>, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <DocumentsClient
      documents={documents ?? []}
      statusCounts={statusCounts}
      currentStatus={statusFilter}
      userRole={profile.role}
      companyId={profile.company_id}
    />
  )
}
