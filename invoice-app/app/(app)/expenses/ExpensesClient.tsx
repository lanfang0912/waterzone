'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, Badge, Button, PageHeader, EmptyState, Modal, Select, Input, Textarea } from '@/components/ui'
import { toast } from '@/components/ui'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Expense } from '@/types'
import { EXPENSE_CATEGORY_LABELS, DEDUCTIBLE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/types'

interface Props {
  expenses: Expense[]
  totalAmount: number
  totalTax: number
  categories: { code: string; label: string }[]
  selectedMonth: string
  userRole: string
  companyId: string
  userId: string
}

const DEDUCTIBLE_TABS = [
  { key: 'all',          label: '全部' },
  { key: 'claimable',    label: '可扣抵' },
  { key: 'review',       label: '待確認' },
  { key: 'non_claimable',label: '不可扣抵' },
]

export default function ExpensesClient({
  expenses, totalAmount, totalTax, categories, selectedMonth, userRole, companyId, userId,
}: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  // New expense form
  const [form, setForm] = useState({
    vendor_name: '', vendor_tax_id: '', invoice_no: '', expense_date: selectedMonth + '-01',
    total_amount: '', category: '', deductible_status: 'review', business_purpose: '',
    payment_method: 'cash', remark: '',
  })

  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.deductible_status === filter)

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })) }

  async function handleAdd() {
    if (!form.vendor_name || !form.total_amount || !form.expense_date) {
      toast('請填寫必要欄位', 'error'); return
    }
    setSaving(true)
    const supabase = createClient()
    const total = parseFloat(form.total_amount)
    const tax = Math.round(total / 1.05 * 0.05 * 100) / 100

    const { error } = await supabase.from('expenses').insert({
      company_id: companyId,
      expense_date: form.expense_date,
      vendor_name: form.vendor_name,
      vendor_tax_id: form.vendor_tax_id || null,
      invoice_no: form.invoice_no || null,
      untaxed_amount: Math.round((total - tax) * 100) / 100,
      tax_amount: tax,
      total_amount: total,
      category: form.category || 'other_pending',
      deductible_status: form.deductible_status,
      business_purpose: form.business_purpose || null,
      payment_method: form.payment_method,
      status: 'confirmed',
      created_by: userId,
    })

    setSaving(false)
    if (error) { toast('新增失敗', 'error'); return }
    toast('已新增支出', 'success')
    setShowAdd(false)
    router.refresh()
  }

  // Previous / next month navigation
  const [y, m] = selectedMonth.split('-').map(Number)
  function navMonth(delta: number) {
    const d = new Date(y, m - 1 + delta, 1)
    const nm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    router.push(`/expenses?month=${nm}`)
  }

  async function handleExport() {
    const rows = [
      ['日期', '廠商', '統編', '發票號碼', '未稅', '稅額', '含稅', '類別', '扣抵狀態', '付款方式', '用途'],
      ...expenses.map(e => [
        e.expense_date, e.vendor_name, e.vendor_tax_id ?? '', e.invoice_no ?? '',
        e.untaxed_amount, e.tax_amount, e.total_amount,
        EXPENSE_CATEGORY_LABELS[e.category as keyof typeof EXPENSE_CATEGORY_LABELS] ?? e.category ?? '',
        DEDUCTIBLE_STATUS_LABELS[e.deductible_status] ?? e.deductible_status,
        e.payment_method ?? '', e.business_purpose ?? '',
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = globalThis.document.createElement('a')
    a.href = url; a.download = `支出_${selectedMonth}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast('已匯出 CSV', 'success')
  }

  return (
    <div>
      <PageHeader
        title="支出 / 進項"
        right={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleExport}>匯出</Button>
            {userRole === 'admin' && (
              <Button size="sm" onClick={() => setShowAdd(true)}>新增</Button>
            )}
          </div>
        }
      />

      {/* Month selector */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navMonth(-1)} className="p-1 rounded-lg hover:bg-slate-100">
          <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="font-semibold text-slate-800">{y} 年 {m} 月</p>
        <button onClick={() => navMonth(1)} className="p-1 rounded-lg hover:bg-slate-100">
          <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Summary */}
      <div className="px-4 pt-3 pb-2 grid grid-cols-2 gap-3">
        <Card padding="sm" className="bg-blue-50 border border-blue-100">
          <p className="text-xs text-blue-600">支出合計</p>
          <p className="text-xl font-bold text-blue-800">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-blue-500">{expenses.length} 筆</p>
        </Card>
        <Card padding="sm" className="bg-emerald-50 border border-emerald-100">
          <p className="text-xs text-emerald-600">可扣抵稅額</p>
          <p className="text-xl font-bold text-emerald-800">{formatCurrency(totalTax)}</p>
          <p className="text-xs text-emerald-500">進項稅額</p>
        </Card>
      </div>

      {/* Deductible filter */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {DEDUCTIBLE_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors',
              filter === tab.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 pb-4 space-y-2">
        {filtered.length === 0 ? (
          <EmptyState
            title="本月尚無支出記錄"
            description="新增支出或從單據匣轉入"
            icon={<svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>}
          />
        ) : (
          filtered.map(exp => <ExpenseCard key={exp.id} expense={exp} />)
        )}
        <div className="h-4" />
      </div>

      {/* Add expense modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="新增支出">
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <Input label="廠商名稱 *" value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)} placeholder="廠商名稱" />
          <Input label="廠商統編" value={form.vendor_tax_id} onChange={e => set('vendor_tax_id', e.target.value)} placeholder="12345678" maxLength={8} />
          <Input label="發票號碼" value={form.invoice_no} onChange={e => set('invoice_no', e.target.value)} placeholder="AB12345678" />
          <Input label="日期 *" type="date" value={form.expense_date} onChange={e => set('expense_date', e.target.value)} />
          <Input label="含稅金額 *" type="number" value={form.total_amount} onChange={e => set('total_amount', e.target.value)} placeholder="0" />
          <Select
            label="類別"
            value={form.category}
            onChange={e => set('category', e.target.value)}
            options={categories.map(c => ({ value: c.code, label: c.label }))}
            placeholder="請選擇類別"
          />
          <Select
            label="扣抵狀態"
            value={form.deductible_status}
            onChange={e => set('deductible_status', e.target.value)}
            options={[
              { value: 'claimable',     label: DEDUCTIBLE_STATUS_LABELS.claimable },
              { value: 'review',        label: DEDUCTIBLE_STATUS_LABELS.review },
              { value: 'non_claimable', label: DEDUCTIBLE_STATUS_LABELS.non_claimable },
            ]}
          />
          <Select
            label="付款方式"
            value={form.payment_method}
            onChange={e => set('payment_method', e.target.value)}
            options={Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <Textarea label="用途說明" value={form.business_purpose} onChange={e => set('business_purpose', e.target.value)} rows={2} placeholder="例：購買辦公耗材" />
          <Button className="w-full" onClick={handleAdd} loading={saving}>儲存</Button>
        </div>
      </Modal>
    </div>
  )
}

function ExpenseCard({ expense: e }: { expense: Expense }) {
  return (
    <Link href={`/expenses/${e.id}`}>
      <Card padding="sm" className="active:bg-slate-50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 truncate">{e.vendor_name}</p>
            {e.invoice_no && (
              <p className="text-xs text-slate-400 font-mono">{e.invoice_no}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold text-slate-900">{formatCurrency(e.total_amount)}</p>
            <p className="text-xs text-slate-400">稅 {formatCurrency(e.tax_amount)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-400">{formatDate(e.expense_date)}</p>
            {e.category && (
              <span className="text-xs text-slate-400">
                {EXPENSE_CATEGORY_LABELS[e.category as keyof typeof EXPENSE_CATEGORY_LABELS] ?? e.category}
              </span>
            )}
          </div>
          <Badge variant={e.deductible_status as 'claimable'}>
            {DEDUCTIBLE_STATUS_LABELS[e.deductible_status] ?? e.deductible_status}
          </Badge>
        </div>
      </Card>
    </Link>
  )
}
