import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import SalesDetailClient from './SalesDetailClient'

export default async function SalesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('company_id, role').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/')

  const { id } = await params

  const { data: invoice } = await supabase
    .from('sales_invoices')
    .select('*')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (!invoice) notFound()

  const { data: comments } = await supabase
    .from('accountant_comments')
    .select('*, author:users(name)')
    .eq('target_type', 'sales_invoice')
    .eq('target_id', id)
    .order('created_at', { ascending: false })

  return (
    <SalesDetailClient
      invoice={invoice}
      comments={comments ?? []}
      userRole={profile.role}
      companyId={profile.company_id}
      userId={user.id}
    />
  )
}
