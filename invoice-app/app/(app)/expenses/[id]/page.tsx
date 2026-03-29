import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ExpenseDetailClient from './ExpenseDetailClient'

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('company_id, role').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/')

  const { id } = await params

  const { data: expense } = await supabase
    .from('expenses')
    .select('*, items:expense_items(*), document:documents(*)')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (!expense) notFound()

  const { data: comments } = await supabase
    .from('accountant_comments')
    .select('*, author:users(name)')
    .eq('target_type', 'expense')
    .eq('target_id', id)
    .order('created_at', { ascending: false })

  const { data: categories } = await supabase
    .from('expense_categories')
    .select('code, label')
    .eq('company_id', profile.company_id)
    .order('sort_order')

  return (
    <ExpenseDetailClient
      expense={expense}
      comments={comments ?? []}
      categories={categories ?? []}
      userRole={profile.role}
      companyId={profile.company_id}
      userId={user.id}
    />
  )
}
