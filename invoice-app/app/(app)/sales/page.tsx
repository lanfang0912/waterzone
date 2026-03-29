import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SalesClient from './SalesClient'
import { getMonthRange, getCurrentYearMonth } from '@/lib/utils'

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('company_id, role').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/')

  const params = await searchParams
  const { year, month } = getCurrentYearMonth()
  const selectedMonth = params.month ?? `${year}-${String(month).padStart(2, '0')}`
  const [y, m] = selectedMonth.split('-').map(Number)
  const { start, end } = getMonthRange(y, m)

  const { data: invoices } = await supabase
    .from('sales_invoices')
    .select('*')
    .eq('company_id', profile.company_id)
    .gte('invoice_date', start)
    .lte('invoice_date', end)
    .order('invoice_date', { ascending: false })

  const all = invoices ?? []
  const totalSales  = all.reduce((s, i) => s + (i.total_amount ?? 0), 0)
  const totalTax    = all.reduce((s, i) => s + (i.tax_amount ?? 0), 0)
  const unpaidCount = all.filter(i => i.payment_status === 'unpaid').length

  return (
    <SalesClient
      invoices={all}
      totalSales={totalSales}
      totalTax={totalTax}
      unpaidCount={unpaidCount}
      selectedMonth={selectedMonth}
      userRole={profile.role}
      companyId={profile.company_id}
      userId={user.id}
    />
  )
}
