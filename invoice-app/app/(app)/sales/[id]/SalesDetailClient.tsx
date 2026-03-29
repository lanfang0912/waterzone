'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Badge, Card, Input, Select, Textarea, PageHeader, Divider } from '@/components/ui'
import { toast } from '@/components/ui'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { SalesInvoice, AccountantComment } from '@/types'

interface Props {
  invoice: SalesInvoice
  comments: (AccountantComment & { author?: { name: string } })[]
  userRole: string
  companyId: string
  userId: string
}

export default function SalesDetailClient({ invoice: inv, comments, userRole, companyId, userId }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [commentStatus, setCommentStatus] = useState<'info' | 'pending_doc' | 'pending_confirm'>('info')

  const [form, setForm] = useState({
    customer_name: inv.customer_name ?? '',
    customer_tax_id: inv.customer_tax_id ?? '',
    total_amount: String(inv.total_amount),
    tax_amount: String(inv.tax_amount),
    untaxed_amount: String(inv.untaxed_amount),
    invoice_status: inv.invoice_status,
    payment_status: inv.payment_status,
    paid_at: inv.paid_at ?? '',
    remark: inv.remark ?? '',
  })
  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('sales_invoices').update({
      customer_name: form.customer_name || null,
      customer_tax_id: form.customer_tax_id || null,
      total_amount: parseFloat(form.total_amount),
      tax_amount: parseFloat(form.tax_amount) || 0,
      untaxed_amount: parseFloat(form.untaxed_amount) || 0,
      invoice_status: form.invoice_status,
      payment_status: form.payment_status,
      paid_at: form.paid_at || null,
      remark: form.remark || null,
    }).eq('id', inv.id)
    setSaving(false)
    if (error) { toast('儲存失敗', 'error'); return }
    toast('已更新', 'success')
    setEditing(false)
    router.refresh()
  }

  async function handleMarkPaid() {
    const supabase = createClient()
    const today = new Date().toISOString().slice(0, 10)
    await supabase.from('sales_invoices').update({ payment_status: 'paid', paid_at: today }).eq('id', inv.id)
    toast('已標記為已收款', 'success')
    router.refresh()
  }

  async function handleAddComment() {
    if (!newComment.trim()) return
    const supabase = createClient()
    await supabase.from('accountant_comments').insert({
      company_id: companyId, target_type: 'sales_invoice', target_id: inv.id,
      comment: newComment.trim(), status: commentStatus, created_by: userId,
    })
    setNewComment('')
    toast('已新增註記', 'success')
    router.refresh()
  }

  const isAdmin = userRole === 'admin'

  return (
    <div>
      <PageHeader
        title="銷項詳情"
        back={() => router.back()}
        right={isAdmin && !editing && (
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>編輯</Button>
        )}
      />

      <div className="px-4 py-4 space-y-4">
        {/* Status badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant={inv.invoice_status === 'void' ? 'voided' : inv.invoice_status === 'allowance' ? 'reviewing' : 'confirmed'}>
            {inv.invoice_status === 'void' ? '已作廢' : inv.invoice_status === 'allowance' ? '折讓' : '已開立'}
          </Badge>
          <Badge variant={inv.payment_status === 'paid' ? 'paid' : 'unpaid'}>
            {inv.payment_status === 'paid' ? '已收款' : inv.payment_status === 'partial' ? '部分收款' : '未收款'}
          </Badge>
        </div>

        {editing ? (
          <Card>
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-xl p-3 mb-2">
                <p className="text-xs text-slate-500">發票號碼</p>
                <p className="font-mono font-semibold text-slate-800">{inv.invoice_no}</p>
              </div>
              <Input label="客戶名稱" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} />
              <Input label="客戶統編" value={form.customer_tax_id} onChange={e => set('customer_tax_id', e.target.value)} maxLength={8} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="未稅金額" type="number" value={form.untaxed_amount} onChange={e => set('untaxed_amount', e.target.value)} />
                <Input label="稅額" type="number" value={form.tax_amount} onChange={e => set('tax_amount', e.target.value)} />
              </div>
              <Input label="含稅總金額" type="number" value={form.total_amount} onChange={e => set('total_amount', e.target.value)} />
              <Select label="發票狀態" value={form.invoice_status} onChange={e => set('invoice_status', e.target.value)}
                options={[{ value: 'issued', label: '已開立' }, { value: 'void', label: '作廢' }, { value: 'allowance', label: '折讓' }]} />
              <Select label="收款狀態" value={form.payment_status} onChange={e => set('payment_status', e.target.value)}
                options={[{ value: 'unpaid', label: '未收款' }, { value: 'paid', label: '已收款' }, { value: 'partial', label: '部分收款' }]} />
              {form.payment_status !== 'unpaid' && (
                <Input label="收款日期" type="date" value={form.paid_at} onChange={e => set('paid_at', e.target.value)} />
              )}
              <Textarea label="備註" value={form.remark} onChange={e => set('remark', e.target.value)} rows={2} />
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSave} loading={saving}>儲存</Button>
                <Button variant="secondary" onClick={() => setEditing(false)}>取消</Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <p className="font-mono text-sm text-slate-400 mb-1">{inv.invoice_no}</p>
            <h2 className="text-lg font-bold text-slate-900 mb-3">{inv.customer_name ?? '無買方資訊'}</h2>
            <Divider className="mb-3" />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoItem label="發票日期" value={formatDate(inv.invoice_date)} />
              <InfoItem label="客戶統編" value={inv.customer_tax_id} />
              <InfoItem label="含稅金額" value={formatCurrency(inv.total_amount)} highlight />
              <InfoItem label="稅額" value={formatCurrency(inv.tax_amount)} />
              <InfoItem label="未稅金額" value={formatCurrency(inv.untaxed_amount)} />
              {inv.paid_at && <InfoItem label="收款日期" value={formatDate(inv.paid_at)} />}
            </div>
            {inv.remark && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-1">備註</p>
                <p className="text-sm text-slate-700">{inv.remark}</p>
              </div>
            )}
            {isAdmin && inv.payment_status === 'unpaid' && inv.invoice_status === 'issued' && (
              <Button className="w-full mt-4" variant="secondary" onClick={handleMarkPaid}>
                標記為已收款
              </Button>
            )}
          </Card>
        )}

        {/* Comments */}
        <Card>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">會計師註記</p>
          {comments.map(c => (
            <div key={c.id} className={cn('p-3 rounded-xl mb-3 text-sm', commentBg(c.status))}>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-slate-700">{c.author?.name ?? '會計師'}</span>
                <span className="text-xs text-slate-400">{formatDate(c.created_at)}</span>
              </div>
              <p className="text-slate-700">{c.comment}</p>
            </div>
          ))}
          <div className="space-y-2">
            <Select value={commentStatus} onChange={e => setCommentStatus(e.target.value as typeof commentStatus)}
              options={[{ value: 'info', label: '一般註記' }, { value: 'pending_doc', label: '⚠ 待補件' }, { value: 'pending_confirm', label: '❓ 待確認' }]} />
            <Textarea value={newComment} onChange={e => setNewComment(e.target.value)} rows={2} placeholder="寫下你的註記…" />
            <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>新增註記</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

function InfoItem({ label, value, highlight }: { label: string; value?: string | null; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={cn('font-medium', highlight ? 'text-slate-900 text-base' : 'text-slate-700')}>{value ?? '-'}</p>
    </div>
  )
}
function commentBg(s: string) {
  if (s === 'pending_doc') return 'bg-amber-50'
  if (s === 'pending_confirm') return 'bg-violet-50'
  return 'bg-slate-50'
}
