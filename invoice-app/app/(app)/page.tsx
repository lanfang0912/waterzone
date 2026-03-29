import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HomeClient from './HomeClient'
import { getMonthRange, getCurrentYearMonth } from '@/lib/utils'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user profile + company
  const { data: profile } = await supabase
    .from('users')
    .select('*, companies(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <p className="text-slate-500">尚未設定公司資料</p>
      </div>
    )
  }

  const { year, month } = getCurrentYearMonth()
  const { start, end } = getMonthRange(year, month)
  const cid = profile.company_id

  // Fetch stats in parallel
  const [docsRes, expenseRes, salesRes, commentRes, recentDocsRes] = await Promise.all([
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', cid)
      .eq('status', 'pending'),
    supabase
      .from('expenses')
      .select('total_amount, tax_amount, deductible_status')
      .eq('company_id', cid)
      .eq('status', 'confirmed')
      .gte('expense_date', start)
      .lte('expense_date', end),
    supabase
      .from('sales_invoices')
      .select('total_amount')
      .eq('company_id', cid)
      .eq('invoice_status', 'issued')
      .gte('invoice_date', start)
      .lte('invoice_date', end),
    supabase
      .from('accountant_comments')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', cid)
      .in('status', ['pending_doc', 'pending_confirm']),
    supabase
      .from('documents')
      .select('id, source_type, file_url, thumbnail_url, vendor_name, invoice_no, invoice_date, amount, status, uploaded_at')
      .eq('company_id', cid)
      .order('uploaded_at', { ascending: false })
      .limit(5),
  ])

  const expenses = expenseRes.data ?? []
  const monthlyExpenseTotal = expenses.reduce((s, e) => s + (e.total_amount || 0), 0)
  const monthlyTaxDeductible = expenses
    .filter(e => e.deductible_status === 'claimable')
    .reduce((s, e) => s + (e.tax_amount || 0), 0)
  const monthlySalesTotal = (salesRes.data ?? []).reduce((s, i) => s + (i.total_amount || 0), 0)

  const stats = {
    pendingDocuments: docsRes.count ?? 0,
    monthlyExpenseTotal,
    monthlyTaxDeductible,
    monthlySalesTotal,
    pendingAccountantItems: commentRes.count ?? 0,
  }

  return (
    <HomeClient
      stats={stats}
      recentDocuments={recentDocsRes.data ?? []}
      userName={profile.name}
      companyName={(profile as { companies?: { company_name?: string } }).companies?.company_name ?? ''}
      yearMonth={{ year, month }}
    />
  )
}
