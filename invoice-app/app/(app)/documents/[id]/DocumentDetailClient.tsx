'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Badge, Card, Input, Select, Textarea, PageHeader, Modal } from '@/components/ui'
import { toast } from '@/components/ui'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { Document, AccountantComment } from '@/types'
import { DOCUMENT_STATUS_LABELS, EXPENSE_CATEGORY_LABELS, DEDUCTIBLE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/types'

interface Props {
  document: Document
  categories: { code: string; label: string }[]
  comments: (AccountantComment & { author?: { name: string } })[]
  userRole: string
  companyId: string
  userId: string
}

export default function DocumentDetailClient({ document: doc, categories, comments, userRole, companyId, userId }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [commentStatus, setCommentStatus] = useState<'info' | 'pending_doc' | 'pending_confirm'>('info')

  // Editable fields (admin only)
  const [vendorName, setVendorName] = useState(doc.vendor_name ?? '')
  const [vendorTaxId, setVendorTaxId] = useState(doc.vendor_tax_id ?? '')
  const [invoiceNo, setInvoiceNo] = useState(doc.invoice_no ?? '')
  const [invoiceDate, setInvoiceDate] = useState(doc.invoice_date ?? '')
  const [amount, setAmount] = useState(doc.amount?.toString() ?? '')
  const [remark, setRemark] = useState(doc.remark ?? '')

  // For "convert to expense"
  const [expCategory, setExpCategory] = useState('')
  const [deductible, setDeductible] = useState('review')
  const [purpose, setPurpose] = useState('')
  const [payMethod, setPayMethod] = useState('cash')

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('documents')
      .update({
        vendor_name: vendorName || null,
        vendor_tax_id: vendorTaxId || null,
        invoice_no: invoiceNo || null,
        invoice_date: invoiceDate || null,
        amount: amount ? parseFloat(amount) : null,
        remark: remark || null,
      })
      .eq('id', doc.id)

    setSaving(false)
    if (error) { toast('儲存失敗', 'error'); return }
    toast('已儲存', 'success')
    router.refresh()
  }

  async function handleConvert() {
    setConverting(true)
    const supabase = createClient()

    const taxAmount = parseFloat(amount) / 1.05 * 0.05
    const untaxed = parseFloat(amount) / 1.05

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        company_id: companyId,
        document_id: doc.id,
        invoice_no: invoiceNo || null,
        expense_date: invoiceDate || new Date().toISOString().slice(0, 10),
        vendor_name: vendorName || '未知廠商',
        vendor_tax_id: vendorTaxId || null,
        untaxed_amount: Math.round(untaxed * 100) / 100,
        tax_amount: Math.round(taxAmount * 100) / 100,
        total_amount: parseFloat(amount) || 0,
        category: expCategory || 'other_pending',
        deductible_status: deductible,
        business_purpose: purpose || null,
        payment_method: payMethod,
        status: 'confirmed',
        created_by: userId,
      })
      .select()
      .single()

    if (error || !expense) {
      toast('轉換失敗', 'error')
      setConverting(false)
      return
    }

    // Update document status
    await supabase
      .from('documents')
      .update({ status: 'confirmed', expense_id: expense.id })
      .eq('id', doc.id)

    toast('已轉為正式支出', 'success')
    setConverting(false)
    setShowConvertModal(false)
    router.push(`/expenses/${expense.id}`)
  }

  async function handleStatusChange(newStatus: string) {
    const supabase = createClient()
    await supabase.from('documents').update({ status: newStatus }).eq('id', doc.id)
    toast('狀態已更新', 'success')
    router.refresh()
  }

  async function handleAddComment() {
    if (!newComment.trim()) return
    const supabase = createClient()
    await supabase.from('accountant_comments').insert({
      company_id: companyId,
      target_type: 'document',
      target_id: doc.id,
      comment: newComment.trim(),
      status: commentStatus,
      created_by: userId,
    })
    setNewComment('')
    toast('已新增註記', 'success')
    router.refresh()
  }

  const isAdmin = userRole === 'admin'
  const canConvert = isAdmin && doc.status !== 'confirmed' && doc.status !== 'voided'

  return (
    <div>
      <PageHeader
        title="單據詳情"
        back={() => router.back()}
        right={
          canConvert && (
            <Button size="sm" onClick={() => setShowConvertModal(true)}>
              轉為支出
            </Button>
          )
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* Image preview */}
        {doc.file_url && (
          <Card padding="none" className="overflow-hidden">
            {doc.mime_type?.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={doc.file_url} alt="單據" className="w-full max-h-64 object-contain bg-slate-50" />
            ) : (
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-4">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-slate-800">{doc.file_name ?? 'PDF 檔案'}</p>
                  <p className="text-xs text-blue-500">點此開啟 →</p>
                </div>
              </a>
            )}
          </Card>
        )}

        {/* Status + source */}
        <Card padding="sm" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={doc.status as 'pending'}>{DOCUMENT_STATUS_LABELS[doc.status]}</Badge>
            <span className="text-xs text-slate-400">{sourceLabel(doc.source_type)}</span>
          </div>
          <p className="text-xs text-slate-400">{formatDate(doc.uploaded_at)}</p>
        </Card>

        {/* Editable info */}
        {isAdmin ? (
          <Card>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">單據資訊</p>
            <div className="space-y-3">
              <Input label="賣方名稱" value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="廠商名稱" />
              <Input label="賣方統編" value={vendorTaxId} onChange={(e) => setVendorTaxId(e.target.value)} placeholder="12345678" maxLength={8} />
              <Input label="發票號碼" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="AB12345678" />
              <Input label="發票日期" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              <Input label="金額（含稅）" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
              <Textarea label="備註" value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} placeholder="用途說明…" />
            </div>
            <div className="flex gap-2 mt-4">
              <Button className="flex-1" onClick={handleSave} loading={saving}>儲存</Button>
              {doc.status === 'pending' && (
                <Button variant="secondary" onClick={() => handleStatusChange('ignored')}>忽略</Button>
              )}
              {doc.status === 'pending' && (
                <Button variant="secondary" onClick={() => handleStatusChange('voided')}>作廢</Button>
              )}
            </div>
          </Card>
        ) : (
          <Card>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">單據資訊</p>
            <div className="space-y-2 text-sm">
              <InfoRow label="賣方" value={doc.vendor_name} />
              <InfoRow label="統編" value={doc.vendor_tax_id} />
              <InfoRow label="發票號碼" value={doc.invoice_no} />
              <InfoRow label="日期" value={formatDate(doc.invoice_date)} />
              <InfoRow label="金額" value={doc.amount != null ? formatCurrency(doc.amount) : null} />
              <InfoRow label="備註" value={doc.remark} />
            </div>
          </Card>
        )}

        {/* Comments */}
        <Card>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            會計師註記 {comments.length > 0 && `(${comments.length})`}
          </p>
          {comments.length > 0 && (
            <div className="space-y-3 mb-4">
              {comments.map((c) => (
                <div key={c.id} className={cn('p-3 rounded-xl text-sm', commentBg(c.status))}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-700">{c.author?.name ?? '會計師'}</span>
                    <span className="text-xs text-slate-400">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-slate-700">{c.comment}</p>
                  {c.status !== 'info' && (
                    <span className={cn('inline-block text-xs mt-1 font-medium', commentTextColor(c.status))}>
                      {c.status === 'pending_doc' ? '⚠ 待補件' : '❓ 待確認'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Select
              label="標記類型"
              value={commentStatus}
              onChange={(e) => setCommentStatus(e.target.value as typeof commentStatus)}
              options={[
                { value: 'info',            label: '一般註記' },
                { value: 'pending_doc',     label: '⚠ 待補件' },
                { value: 'pending_confirm', label: '❓ 待確認' },
              ]}
            />
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="寫下你的註記…"
              rows={2}
            />
            <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
              新增註記
            </Button>
          </div>
        </Card>
      </div>

      {/* Convert to expense modal */}
      <Modal open={showConvertModal} onClose={() => setShowConvertModal(false)} title="轉為正式支出">
        <div className="space-y-3">
          <p className="text-sm text-slate-500">確認以下資訊後，將此單據轉為正式支出記錄。</p>
          <div className="bg-slate-50 rounded-xl p-3 space-y-1">
            <p className="text-sm"><span className="text-slate-500">廠商：</span>{vendorName || '-'}</p>
            <p className="text-sm"><span className="text-slate-500">金額：</span>{amount ? formatCurrency(parseFloat(amount)) : '-'}</p>
            <p className="text-sm"><span className="text-slate-500">日期：</span>{formatDate(invoiceDate)}</p>
          </div>
          <Select
            label="支出類別"
            value={expCategory}
            onChange={(e) => setExpCategory(e.target.value)}
            options={categories.map(c => ({ value: c.code, label: c.label }))}
            placeholder="請選擇類別"
          />
          <Select
            label="扣抵狀態"
            value={deductible}
            onChange={(e) => setDeductible(e.target.value)}
            options={[
              { value: 'claimable',     label: DEDUCTIBLE_STATUS_LABELS.claimable },
              { value: 'review',        label: DEDUCTIBLE_STATUS_LABELS.review },
              { value: 'non_claimable', label: DEDUCTIBLE_STATUS_LABELS.non_claimable },
            ]}
          />
          <Select
            label="付款方式"
            value={payMethod}
            onChange={(e) => setPayMethod(e.target.value)}
            options={Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <Textarea
            label="用途說明"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={2}
            placeholder="例：購買辦公耗材"
          />
          <Button className="w-full" onClick={handleConvert} loading={converting}>
            確認轉換
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="text-slate-800 text-right truncate">{value ?? '-'}</span>
    </div>
  )
}

function sourceLabel(s: string) {
  const map: Record<string, string> = { camera: '拍照', upload: '上傳', qr: '掃碼', email: 'Email', import: '匯入' }
  return map[s] ?? s
}

function commentBg(status: string) {
  if (status === 'pending_doc')     return 'bg-amber-50'
  if (status === 'pending_confirm') return 'bg-violet-50'
  return 'bg-slate-50'
}
function commentTextColor(status: string) {
  if (status === 'pending_doc')     return 'text-amber-600'
  if (status === 'pending_confirm') return 'text-violet-600'
  return ''
}
