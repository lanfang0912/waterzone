import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountantClient from './AccountantClient'
import { getMonthRange, getCurrentYearMonth } from '@/lib/utils'

export default async function AccountantPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('company_id, role, name').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/')

  const params = await searchParams
  const { year, month } = getCurrentYearMonth()
  const selectedMonth = params.month ?? `${year}-${String(month).padStart(2, '0')}`
  const [y, m] = selectedMonth.split('-').map(Number)
  const { start, end } = getMonthRange(y, m)
  const cid = profile.company_id

  const [expensesRes, salesRes, commentsRes, missingDocsRes] = await Promise.all([
    supabase.from('expenses').select('*').eq('company_id', cid)
      .gte('expense_date', start).lte('expense_date', end).order('expense_date', { ascending: false }),
    supabase.from('sales_invoices').select('*').eq('company_id', cid)
      .gte('invoice_date', start).lte('invoice_date', end).order('invoice_date', { ascending: false }),
    supabase.from('accountant_comments').select('*, author:users(name)').eq('company_id', cid)
      .order('created_at', { ascending: false }).limit(30),
    supabase.from('expenses').select('id, vendor_name, expense_date, total_amount')
      .eq('company_id', cid).is('document_id', null).eq('status', 'confirmed')
      .gte('expense_date', start).lte('expense_date', end),
  ])

  return (
    <AccountantClient
      expenses={expensesRes.data ?? []}
      salesInvoices={salesRes.data ?? []}
      comments={commentsRes.data ?? []}
      missingDocExpenses={missingDocsRes.data ?? []}
      selectedMonth={selectedMonth}
      userRole={profile.role}
      userName={profile.name}
      companyId={cid}
      userId={user.id}
    />
  )
}
