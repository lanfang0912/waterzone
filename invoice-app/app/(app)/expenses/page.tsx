import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ExpensesClient from './ExpensesClient'
import { getMonthRange, getCurrentYearMonth } from '@/lib/utils'

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; status?: string; deductible?: string }>
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
  const { year, month } = getCurrentYearMonth()
  const selectedMonth = params.month ?? `${year}-${String(month).padStart(2, '0')}`
  const [y, m] = selectedMonth.split('-').map(Number)
  const { start, end } = getMonthRange(y, m)

  let query = supabase
    .from('expenses')
    .select('*')
    .eq('company_id', profile.company_id)
    .gte('expense_date', start)
    .lte('expense_date', end)
    .order('expense_date', { ascending: false })

  if (params.status && params.status !== 'all') query = query.eq('status', params.status)
  if (params.deductible && params.deductible !== 'all') query = query.eq('deductible_status', params.deductible)

  const { data: expenses } = await query

  // Summary
  const allExpenses = expenses ?? []
  const totalAmount   = allExpenses.reduce((s, e) => s + (e.total_amount ?? 0), 0)
  const totalTax      = allExpenses.filter(e => e.deductible_status === 'claimable').reduce((s, e) => s + (e.tax_amount ?? 0), 0)

  const { data: categories } = await supabase
    .from('expense_categories')
    .select('code, label')
    .eq('company_id', profile.company_id)
    .order('sort_order')

  return (
    <ExpensesClient
      expenses={allExpenses}
      totalAmount={totalAmount}
      totalTax={totalTax}
      categories={categories ?? []}
      selectedMonth={selectedMonth}
      userRole={profile.role}
      companyId={profile.company_id}
      userId={user.id}
    />
  )
}
