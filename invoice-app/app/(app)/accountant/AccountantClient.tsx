'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, Badge, Button, PageHeader } from '@/components/ui'
import { toast } from '@/components/ui'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { Expense, SalesInvoice, AccountantComment } from '@/types'
import { EXPENSE_CATEGORY_LABELS, DEDUCTIBLE_STATUS_LABELS } from '@/types'

type Tab = 'expenses' | 'sales' | 'missing' | 'comments'

interface Props {
  expenses: Expense[]
  salesInvoices: SalesInvoice[]
  comments: (AccountantComment & { author?: { name: string } })[]
  missingDocExpenses: { id: string; vendor_name: string; expense_date: string; total_amount: number }[]
  selectedMonth: string
  userRole: string
  userName: string
  companyId: string
  userId: string
}

export default function AccountantClient({
  expenses, salesInvoices, comments, missingDocExpenses,
  selectedMonth, userRole, userName, companyId, userId,
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('expenses')

  const [y, m] = selectedMonth.split('-').map(Number)
  function navMonth(d: number) {
    const dt = new Date(y, m - 1 + d, 1)
    router.push(`/accountant?month=${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`)
  }

  const pendingReview = expenses.filter(e => e.deductible_status === 'review')
  const pendingComments = comments.filter(c => ['pending_doc', 'pending_confirm'].includes(c.status))

  function handleExportExpenses() {
    const rows = [
      ['日期', '廠商', '統編', '發票號碼', '含稅', '稅額', '類別', '扣抵狀態', '用途'],
      ...expenses.map(e => [
        e.expense_date, e.vendor_name, e.vendor_tax_id ?? '', e.invoice_no ?? '',
        e.total_amount, e.tax_amount,
        EXPENSE_CATEGORY_LABELS[e.category as keyof typeof EXPENSE_CATEGORY_LABELS] ?? '',
        DEDUCTIBLE_STATUS_LABELS[e.deductible_status],
        e.business_purpose ?? '',
      ]),
    ]
    exportCSV(rows, `進項_${selectedMonth}.csv`)
  }

  function handleExportSales() {
    const rows = [
      ['發票號碼', '日期', '客戶', '統編', '含稅', '稅額', '發票狀態', '收款狀態'],
      ...salesInvoices.map(i => [
        i.invoice_no, i.invoice_date, i.customer_name ?? '', i.customer_tax_id ?? '',
        i.total_amount, i.tax_amount,
        { issued: '已開立', void: '作廢', allowance: '折讓' }[i.invoice_status],
        { unpaid: '未收款', paid: '已收款', partial: '部分收款' }[i.payment_status],
      ]),
    ]
    exportCSV(rows, `銷項_${selectedMonth}.csv`)
  }

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'expenses', label: '進項清單', count: expenses.length },
    { key: 'sales',    label: '銷項清單', count: salesInvoices.length },
    { key: 'missing',  label: '缺附件',   count: missingDocExpenses.length },
    { key: 'comments', label: '待確認',   count: pendingComments.length },
  ]

  return (
    <div>
      <PageHeader
        title="會計師協作"
        subtitle={`${y}/${String(m).padStart(2,'0')}`}
        right={
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" onClick={handleExportExpenses}>匯出進項</Button>
            <Button size="sm" variant="secondary" onClick={handleExportSales}>匯出銷項</Button>
          </div>
        }
      />

      {/* Month nav */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navMonth(-1)} className="p-1 rounded-lg hover:bg-slate-100">
          <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <p className="font-semibold text-slate-800">{y} 年 {m} 月</p>
        <button onClick={() => navMonth(1)} className="p-1 rounded-lg hover:bg-slate-100">
          <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Summary cards */}
      <div className="px-4 pt-3 pb-2 grid grid-cols-2 gap-2">
        <Card padding="sm" className="bg-blue-50 border border-blue-100">
          <p className="text-xs text-blue-600">進項合計</p>
          <p className="text-lg font-bold text-blue-800">{formatCurrency(expenses.reduce((s, e) => s + e.total_amount, 0))}</p>
          <p className="text-xs text-blue-500">{expenses.length} 筆</p>
        </Card>
        <Card padding="sm" className="bg-amber-50 border border-amber-100">
          <p className="text-xs text-amber-600">銷項合計</p>
          <p className="text-lg font-bold text-amber-800">{formatCurrency(salesInvoices.reduce((s, i) => s + i.total_amount, 0))}</p>
          <p className="text-xs text-amber-500">{salesInvoices.length} 筆</p>
        </Card>
        <Card padding="sm" className={cn('border', pendingReview.length > 0 ? 'bg-violet-50 border-violet-100' : 'border-slate-100')}>
          <p className={cn('text-xs', pendingReview.length > 0 ? 'text-violet-600' : 'text-slate-500')}>待確認扣抵</p>
          <p className={cn('text-lg font-bold', pendingReview.length > 0 ? 'text-violet-800' : 'text-slate-500')}>{pendingReview.length} 筆</p>
        </Card>
        <Card padding="sm" className={cn('border', missingDocExpenses.length > 0 ? 'bg-red-50 border-red-100' : 'border-slate-100')}>
          <p className={cn('text-xs', missingDocExpenses.length > 0 ? 'text-red-600' : 'text-slate-500')}>缺附件</p>
          <p className={cn('text-lg font-bold', missingDocExpenses.length > 0 ? 'text-red-800' : 'text-slate-500')}>{missingDocExpenses.length} 筆</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors',
              tab === t.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500')}>
            {t.label}
            {(t.count ?? 0) > 0 && (
              <span className={cn('text-[10px] px-1.5 rounded-full', tab === t.key ? 'bg-blue-500' : 'bg-slate-200')}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4 pb-4 space-y-2">
        {tab === 'expenses' && (
          expenses.length === 0
            ? <EmptyMsg text="本月無進項記錄" />
            : expenses.map(e => (
                <Link key={e.id} href={`/expenses/${e.id}`}>
                  <Card padding="sm" className="active:bg-slate-50">
                    <div className="flex justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{e.vendor_name}</p>
                        <p className="text-xs text-slate-400">{formatDate(e.expense_date)} · {e.invoice_no ?? '無發票號碼'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">{formatCurrency(e.total_amount)}</p>
                        <Badge variant={e.deductible_status as 'claimable'} className="mt-0.5">
                          {DEDUCTIBLE_STATUS_LABELS[e.deductible_status]}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
        )}

        {tab === 'sales' && (
          salesInvoices.length === 0
            ? <EmptyMsg text="本月無銷項記錄" />
            : salesInvoices.map(i => (
                <Link key={i.id} href={`/sales/${i.id}`}>
                  <Card padding="sm" className="active:bg-slate-50">
                    <div className="flex justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{i.customer_name ?? '無買方'}</p>
                        <p className="text-xs font-mono text-slate-400">{i.invoice_no}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">{formatCurrency(i.total_amount)}</p>
                        <Badge variant={i.payment_status === 'paid' ? 'paid' : 'unpaid'} className="mt-0.5">
                          {i.payment_status === 'paid' ? '已收款' : '未收款'}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
        )}

        {tab === 'missing' && (
          missingDocExpenses.length === 0
            ? <EmptyMsg text="所有支出都已有附件" />
            : missingDocExpenses.map(e => (
                <Link key={e.id} href={`/expenses/${e.id}`}>
                  <Card padding="sm" className="active:bg-slate-50 border border-red-100">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm text-slate-900">{e.vendor_name}</p>
                        <p className="text-xs text-slate-400">{formatDate(e.expense_date)}</p>
                      </div>
                      <p className="font-semibold text-sm text-slate-900">{formatCurrency(e.total_amount)}</p>
                    </div>
                  </Card>
                </Link>
              ))
        )}

        {tab === 'comments' && (
          comments.length === 0
            ? <EmptyMsg text="目前沒有待確認項目" />
            : comments.map(c => (
                <Card key={c.id} padding="sm" className={cn(commentBg(c.status))}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{c.author?.name ?? '會計師'}</span>
                    <span className="text-xs text-slate-400">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-700">{c.comment}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={c.status === 'pending_doc' ? 'warning' : c.status === 'pending_confirm' ? 'reviewing' : 'info'}>
                      {c.status === 'pending_doc' ? '待補件' : c.status === 'pending_confirm' ? '待確認' : '一般'}
                    </Badge>
                    <Link href={`/${c.target_type === 'expense' ? 'expenses' : 'sales'}/${c.target_id}`}
                      className="text-xs text-blue-600">查看單筆 →</Link>
                  </div>
                </Card>
              ))
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}

function EmptyMsg({ text }: { text: string }) {
  return <p className="text-center text-slate-400 py-10 text-sm">{text}</p>
}

function commentBg(s: string) {
  if (s === 'pending_doc') return 'bg-amber-50 border border-amber-100'
  if (s === 'pending_confirm') return 'bg-violet-50 border border-violet-100'
  return 'bg-white border border-slate-100'
}

function exportCSV(rows: (string | number)[][], filename: string) {
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = globalThis.document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
  toast('已匯出', 'success')
}
