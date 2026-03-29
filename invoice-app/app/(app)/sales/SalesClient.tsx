'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Badge, Button, PageHeader, EmptyState, Modal, Input, Select, Textarea } from '@/components/ui'
import { toast } from '@/components/ui'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { SalesInvoice } from '@/types'

interface Props {
  invoices: SalesInvoice[]
  totalSales: number
  totalTax: number
  unpaidCount: number
  selectedMonth: string
  userRole: string
  companyId: string
  userId: string
}

export default function SalesClient({ invoices, totalSales, totalTax, unpaidCount, selectedMonth, userRole, companyId, userId }: Props) {
  const router = useRouter()
  const [payFilter, setPayFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    invoice_no: '', invoice_date: selectedMonth + '-01',
    customer_name: '', customer_tax_id: '',
    untaxed_amount: '', tax_amount: '', total_amount: '',
    invoice_status: 'issued', payment_status: 'unpaid',
    paid_at: '', remark: '',
  })

  const [y, m] = selectedMonth.split('-').map(Number)
  function navMonth(d: number) {
    const dt = new Date(y, m - 1 + d, 1)
    router.push(`/sales?month=${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`)
  }

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  // Auto-calc tax
  function handleTotalChange(v: string) {
    const total = parseFloat(v) || 0
    const tax = Math.round(total / 1.05 * 0.05 * 100) / 100
    const untaxed = Math.round((total - tax) * 100) / 100
    setForm(f => ({ ...f, total_amount: v, tax_amount: String(tax), untaxed_amount: String(untaxed) }))
  }

  const filtered = payFilter === 'all' ? invoices : invoices.filter(i => i.payment_status === payFilter)

  async function handleAdd() {
    if (!form.invoice_no || !form.total_amount) { toast('請填寫必要欄位', 'error'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('sales_invoices').insert({
      company_id: companyId,
      invoice_no: form.invoice_no,
      invoice_date: form.invoice_date,
      customer_name: form.customer_name || null,
      customer_tax_id: form.customer_tax_id || null,
      untaxed_amount: parseFloat(form.untaxed_amount) || 0,
      tax_amount: parseFloat(form.tax_amount) || 0,
      total_amount: parseFloat(form.total_amount),
      invoice_status: form.invoice_status,
      payment_status: form.payment_status,
      paid_at: form.paid_at || null,
      remark: form.remark || null,
      created_by: userId,
    })
    setSaving(false)
    if (error) { toast('新增失敗', 'error'); return }
    toast('已新增銷項發票', 'success')
    setShowAdd(false)
    router.refresh()
  }

  async function handleExport() {
    const rows = [
      ['發票號碼', '日期', '客戶', '統編', '未稅', '稅額', '含稅', '發票狀態', '收款狀態', '收款日期', '備註'],
      ...invoices.map(i => [
        i.invoice_no, i.invoice_date, i.customer_name ?? '', i.customer_tax_id ?? '',
        i.untaxed_amount, i.tax_amount, i.total_amount,
        { issued: '已開立', void: '作廢', allowance: '折讓' }[i.invoice_status] ?? i.invoice_status,
        { unpaid: '未收款', paid: '已收款', partial: '部分收款' }[i.payment_status] ?? i.payment_status,
        i.paid_at ?? '', i.remark ?? '',
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = globalThis.document.createElement('a')
    a.href = url; a.download = `銷項_${selectedMonth}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast('已匯出 CSV', 'success')
  }

  return (
    <div>
      <PageHeader
        title="銷項發票"
        right={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleExport}>匯出</Button>
            {userRole === 'admin' && (
              <Button size="sm" onClick={() => setShowAdd(true)}>新增</Button>
            )}
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

      {/* Summary */}
      <div className="px-4 pt-3 pb-2 grid grid-cols-3 gap-2">
        <Card padding="sm" className="bg-amber-50 border border-amber-100 text-center">
          <p className="text-xs text-amber-600">銷售額</p>
          <p className="text-base font-bold text-amber-800">{formatCurrency(totalSales - totalTax)}</p>
        </Card>
        <Card padding="sm" className="bg-blue-50 border border-blue-100 text-center">
          <p className="text-xs text-blue-600">銷項稅額</p>
          <p className="text-base font-bold text-blue-800">{formatCurrency(totalTax)}</p>
        </Card>
        <Card padding="sm" className={cn('border text-center', unpaidCount > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100')}>
          <p className={cn('text-xs', unpaidCount > 0 ? 'text-red-600' : 'text-slate-500')}>未收款</p>
          <p className={cn('text-base font-bold', unpaidCount > 0 ? 'text-red-700' : 'text-slate-500')}>{unpaidCount} 筆</p>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="px-4 pb-2 flex gap-2">
        {[['all','全部'],['unpaid','未收款'],['paid','已收款']].map(([k, l]) => (
          <button key={k} onClick={() => setPayFilter(k)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors',
              payFilter === k ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500')}>
            {l}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 pb-4 space-y-2">
        {filtered.length === 0 ? (
          <EmptyState
            title="本月尚無銷項記錄"
            description="新增銷項發票或匯入財政部資料"
            icon={<svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            action={userRole === 'admin' ? <Button onClick={() => setShowAdd(true)}>新增銷項</Button> : undefined}
          />
        ) : (
          filtered.map(inv => <SalesCard key={inv.id} invoice={inv} />)
        )}
        <div className="h-4" />
      </div>

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="新增銷項發票">
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <Input label="發票號碼 *" value={form.invoice_no} onChange={e => set('invoice_no', e.target.value)} placeholder="AB12345678" />
          <Input label="發票日期 *" type="date" value={form.invoice_date} onChange={e => set('invoice_date', e.target.value)} />
          <Input label="客戶名稱" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} placeholder="客戶公司名稱" />
          <Input label="客戶統編" value={form.customer_tax_id} onChange={e => set('customer_tax_id', e.target.value)} placeholder="12345678" maxLength={8} />
          <Input label="含稅總金額 *" type="number" value={form.total_amount} onChange={e => handleTotalChange(e.target.value)} placeholder="0" hint="稅額與未稅金額將自動計算（5% 稅率）" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="未稅金額" type="number" value={form.untaxed_amount} onChange={e => set('untaxed_amount', e.target.value)} />
            <Input label="稅額" type="number" value={form.tax_amount} onChange={e => set('tax_amount', e.target.value)} />
          </div>
          <Select label="發票狀態" value={form.invoice_status} onChange={e => set('invoice_status', e.target.value)}
            options={[{ value: 'issued', label: '已開立' }, { value: 'void', label: '作廢' }, { value: 'allowance', label: '折讓' }]} />
          <Select label="收款狀態" value={form.payment_status} onChange={e => set('payment_status', e.target.value)}
            options={[{ value: 'unpaid', label: '未收款' }, { value: 'paid', label: '已收款' }, { value: 'partial', label: '部分收款' }]} />
          {form.payment_status !== 'unpaid' && (
            <Input label="收款日期" type="date" value={form.paid_at} onChange={e => set('paid_at', e.target.value)} />
          )}
          <Textarea label="備註" value={form.remark} onChange={e => set('remark', e.target.value)} rows={2} />
          <Button className="w-full" onClick={handleAdd} loading={saving}>儲存</Button>
        </div>
      </Modal>
    </div>
  )
}

function SalesCard({ invoice: inv }: { invoice: SalesInvoice }) {
  return (
    <Link href={`/sales/${inv.id}`}>
      <Card padding="sm" className="active:bg-slate-50">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 truncate">{inv.customer_name ?? '無買方資訊'}</p>
            <p className="text-xs font-mono text-slate-400">{inv.invoice_no}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold text-slate-900">{formatCurrency(inv.total_amount)}</p>
            <p className="text-xs text-slate-400">稅 {formatCurrency(inv.tax_amount)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-slate-400">{formatDate(inv.invoice_date)}</p>
          <div className="flex gap-1">
            {inv.invoice_status !== 'issued' && (
              <Badge variant={inv.invoice_status === 'void' ? 'voided' : 'reviewing'}>
                {inv.invoice_status === 'void' ? '作廢' : '折讓'}
              </Badge>
            )}
            <Badge variant={inv.payment_status === 'paid' ? 'paid' : 'unpaid'}>
              {inv.payment_status === 'paid' ? '已收款' : inv.payment_status === 'partial' ? '部分收' : '未收款'}
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  )
}
