'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Badge, Card, Input, Select, Textarea, PageHeader, Divider } from '@/components/ui'
import { toast } from '@/components/ui'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { Expense, AccountantComment } from '@/types'
import { EXPENSE_CATEGORY_LABELS, DEDUCTIBLE_STATUS_LABELS, PAYMENT_METHOD_LABELS, COMMENT_STATUS_LABELS } from '@/types'

interface Props {
  expense: Expense & { items?: { id: string; item_name: string; qty: number; unit_price: number | null; amount: number }[]; document?: { file_url?: string; thumbnail_url?: string } | null }
  comments: (AccountantComment & { author?: { name: string } })[]
  categories: { code: string; label: string }[]
  userRole: string
  companyId: string
  userId: string
}

export default function ExpenseDetailClient({ expense: exp, comments, categories, userRole, companyId, userId }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [commentStatus, setCommentStatus] = useState<'info' | 'pending_doc' | 'pending_confirm'>('info')

  const [form, setForm] = useState({
    vendor_name: exp.vendor_name,
    vendor_tax_id: exp.vendor_tax_id ?? '',
    invoice_no: exp.invoice_no ?? '',
    expense_date: exp.expense_date,
    total_amount: String(exp.total_amount),
    category: exp.category ?? '',
    deductible_status: exp.deductible_status,
    business_purpose: exp.business_purpose ?? '',
    payment_method: exp.payment_method ?? 'cash',
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const total = parseFloat(form.total_amount)
    const tax = Math.round(total / 1.05 * 0.05 * 100) / 100

    const { error } = await supabase.from('expenses').update({
      vendor_name: form.vendor_name,
      vendor_tax_id: form.vendor_tax_id || null,
      invoice_no: form.invoice_no || null,
      expense_date: form.expense_date,
      total_amount: total,
      tax_amount: tax,
      untaxed_amount: Math.round((total - tax) * 100) / 100,
      category: form.category || 'other_pending',
      deductible_status: form.deductible_status,
      business_purpose: form.business_purpose || null,
      payment_method: form.payment_method,
    }).eq('id', exp.id)

    setSaving(false)
    if (error) { toast('儲存失敗', 'error'); return }
    toast('已更新', 'success')
    setEditing(false)
    router.refresh()
  }

  async function handleVoid() {
    if (!confirm('確定要作廢這筆支出？')) return
    const supabase = createClient()
    await supabase.from('expenses').update({ status: 'voided' }).eq('id', exp.id)
    toast('已作廢', 'success')
    router.back()
  }

  async function handleAddComment() {
    if (!newComment.trim()) return
    const supabase = createClient()
    await supabase.from('accountant_comments').insert({
      company_id: companyId,
      target_type: 'expense',
      target_id: exp.id,
      comment: newComment.trim(),
      status: commentStatus,
      created_by: userId,
    })
    setNewComment('')
    toast('已新增註記', 'success')
    router.refresh()
  }

  const isAdmin = userRole === 'admin'

  return (
    <div>
      <PageHeader
        title="支出詳情"
        back={() => router.back()}
        right={
          isAdmin && !editing && exp.status !== 'voided' && (
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>編輯</Button>
          )
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <Badge variant={exp.deductible_status as 'claimable'}>
            {DEDUCTIBLE_STATUS_LABELS[exp.deductible_status]}
          </Badge>
          {exp.status === 'voided' && <Badge variant="voided">已作廢</Badge>}
          {exp.category && (
            <span className="text-xs text-slate-400">
              {EXPENSE_CATEGORY_LABELS[exp.category as keyof typeof EXPENSE_CATEGORY_LABELS] ?? exp.category}
            </span>
          )}
        </div>

        {/* Main info */}
        {editing ? (
          <Card>
            <div className="space-y-3">
              <Input label="廠商名稱" value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)} />
              <Input label="廠商統編" value={form.vendor_tax_id} onChange={e => set('vendor_tax_id', e.target.value)} maxLength={8} />
              <Input label="發票號碼" value={form.invoice_no} onChange={e => set('invoice_no', e.target.value)} />
              <Input label="日期" type="date" value={form.expense_date} onChange={e => set('expense_date', e.target.value)} />
              <Input label="含稅金額" type="number" value={form.total_amount} onChange={e => set('total_amount', e.target.value)} />
              <Select label="類別" value={form.category} onChange={e => set('category', e.target.value)}
                options={categories.map(c => ({ value: c.code, label: c.label }))} placeholder="請選擇類別" />
              <Select label="扣抵狀態" value={form.deductible_status} onChange={e => set('deductible_status', e.target.value)}
                options={[
                  { value: 'claimable',     label: DEDUCTIBLE_STATUS_LABELS.claimable },
                  { value: 'review',        label: DEDUCTIBLE_STATUS_LABELS.review },
                  { value: 'non_claimable', label: DEDUCTIBLE_STATUS_LABELS.non_claimable },
                ]} />
              <Select label="付款方式" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}
                options={Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
              <Textarea label="用途說明" value={form.business_purpose} onChange={e => set('business_purpose', e.target.value)} rows={2} />
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSave} loading={saving}>儲存</Button>
                <Button variant="secondary" onClick={() => setEditing(false)}>取消</Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <h2 className="text-lg font-bold text-slate-900 mb-1">{exp.vendor_name}</h2>
            {exp.invoice_no && <p className="text-sm font-mono text-slate-400 mb-3">{exp.invoice_no}</p>}
            <Divider className="mb-3" />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoItem label="日期" value={formatDate(exp.expense_date)} />
              <InfoItem label="廠商統編" value={exp.vendor_tax_id} />
              <InfoItem label="含稅金額" value={formatCurrency(exp.total_amount)} highlight />
              <InfoItem label="稅額" value={formatCurrency(exp.tax_amount)} />
              <InfoItem label="未稅金額" value={formatCurrency(exp.untaxed_amount)} />
              <InfoItem label="付款方式" value={PAYMENT_METHOD_LABELS[exp.payment_method as keyof typeof PAYMENT_METHOD_LABELS]} />
            </div>
            {exp.business_purpose && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-1">用途說明</p>
                <p className="text-sm text-slate-700">{exp.business_purpose}</p>
              </div>
            )}
          </Card>
        )}

        {/* Items */}
        {exp.items && exp.items.length > 0 && (
          <Card>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">明細</p>
            <div className="space-y-2">
              {exp.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-700 flex-1 truncate">{item.item_name}</span>
                  <span className="text-slate-500 ml-2">x{item.qty}</span>
                  <span className="text-slate-800 font-medium ml-3">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Attachment */}
        {exp.document?.file_url && (
          <Card padding="none" className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide p-4 pb-2">附件</p>
            {exp.document.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={exp.document.thumbnail_url} alt="" className="w-full max-h-40 object-contain bg-slate-50" />
            ) : (
              <a href={exp.document.file_url} target="_blank" rel="noopener noreferrer" className="block px-4 pb-4 text-sm text-blue-600">查看附件 →</a>
            )}
          </Card>
        )}

        {/* Admin actions */}
        {isAdmin && exp.status !== 'voided' && !editing && (
          <Button variant="danger" className="w-full" onClick={handleVoid}>作廢此筆支出</Button>
        )}

        {/* Comments */}
        <Card>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            會計師註記 {comments.length > 0 && `(${comments.length})`}
          </p>
          {comments.map((c) => (
            <div key={c.id} className={cn('p-3 rounded-xl mb-3 text-sm', commentBg(c.status))}>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-slate-700">{c.author?.name ?? '會計師'}</span>
                <span className="text-xs text-slate-400">{formatDate(c.created_at)}</span>
              </div>
              <p className="text-slate-700">{c.comment}</p>
            </div>
          ))}
          <div className="space-y-2">
            <Select
              value={commentStatus}
              onChange={e => setCommentStatus(e.target.value as typeof commentStatus)}
              options={[
                { value: 'info', label: '一般註記' },
                { value: 'pending_doc', label: '⚠ 待補件' },
                { value: 'pending_confirm', label: '❓ 待確認' },
              ]}
            />
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

function commentBg(status: string) {
  if (status === 'pending_doc') return 'bg-amber-50'
  if (status === 'pending_confirm') return 'bg-violet-50'
  return 'bg-slate-50'
}
