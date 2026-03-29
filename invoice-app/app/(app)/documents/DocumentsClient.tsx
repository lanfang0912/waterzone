'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Badge, Button, PageHeader, EmptyState, Modal } from '@/components/ui'
import { toast } from '@/components/ui'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { Document, DocumentStatus } from '@/types'
import { DOCUMENT_STATUS_LABELS } from '@/types'

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'all',      label: '全部' },
  { key: 'pending',  label: '待整理' },
  { key: 'reviewing',label: '待確認' },
  { key: 'confirmed',label: '已完成' },
  { key: 'duplicate',label: '疑似重複' },
]

interface Props {
  documents: Document[]
  statusCounts: Record<string, number>
  currentStatus: string
  userRole: string
  companyId: string
}

export default function DocumentsClient({ documents, statusCounts, currentStatus, userRole, companyId }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const total = Object.values(statusCounts).reduce((s, v) => s + v, 0)

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    const supabase = createClient()

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `${companyId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

      const { data: storageData, error: storageError } = await supabase.storage
        .from('documents')
        .upload(path, file, { contentType: file.type })

      if (storageError) {
        toast(`上傳失敗：${file.name}`, 'error')
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(storageData.path)

      await supabase.from('documents').insert({
        company_id: companyId,
        source_type: 'upload',
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending',
      })
    }

    setUploading(false)
    setShowUploadModal(false)
    toast('上傳成功', 'success')
    router.refresh()
  }

  return (
    <div>
      <PageHeader
        title="單據匣"
        subtitle={`共 ${total} 筆`}
        right={
          userRole === 'admin' && (
            <Button size="sm" onClick={() => setShowUploadModal(true)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              新增
            </Button>
          )
        }
      />

      {/* Status filter tabs */}
      <div className="bg-white border-b border-slate-100 px-4 sticky top-[57px] z-20">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
          {STATUS_TABS.map((tab) => {
            const count = tab.key === 'all' ? total : (statusCounts[tab.key] ?? 0)
            const isActive = currentStatus === tab.key
            return (
              <Link
                key={tab.key}
                href={`/documents?status=${tab.key}`}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', isActive ? 'bg-blue-500' : 'bg-slate-200')}>
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-3 space-y-2">
        {documents.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="這裡還沒有單據"
            description="拍照收單或上傳檔案來新增"
            action={
              <Button onClick={() => setShowUploadModal(true)}>
                上傳單據
              </Button>
            }
          />
        ) : (
          documents.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
        )}
        <div className="h-4" />
      </div>

      {/* Upload modal */}
      <Modal open={showUploadModal} onClose={() => setShowUploadModal(false)} title="新增單據">
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />

          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.capture = 'environment'
                fileInputRef.current.accept = 'image/*'
                fileInputRef.current.click()
              }
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 active:bg-slate-50"
          >
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">拍照收單</p>
              <p className="text-sm text-slate-400">直接用相機拍攝單據</p>
            </div>
          </button>

          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute('capture')
                fileInputRef.current.accept = 'image/*,.pdf'
                fileInputRef.current.click()
              }
            }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 active:bg-slate-50"
          >
            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">從相簿上傳</p>
              <p className="text-sm text-slate-400">支援圖片和 PDF</p>
            </div>
          </button>

          <Link href="/scan">
            <button className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 active:bg-slate-50">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8H3m2 4H3m18-4h-2M5 20H3m2-4H3" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">掃描 QR / 條碼</p>
                <p className="text-sm text-slate-400">掃描電子發票 QR Code</p>
              </div>
            </button>
          </Link>

          <Link href="/import">
            <button className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 active:bg-slate-50">
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900">匯入 M / D 檔</p>
                <p className="text-sm text-slate-400">財政部電子發票平台下載</p>
              </div>
            </button>
          </Link>

          {uploading && (
            <p className="text-center text-sm text-slate-400 py-2">上傳中…</p>
          )}
        </div>
      </Modal>
    </div>
  )
}

// ─── DocumentCard ───────────────────────────────────────────
function DocumentCard({ doc }: { doc: Document }) {
  const statusVariant = doc.status as 'pending'
  return (
    <Link href={`/documents/${doc.id}`}>
      <Card padding="sm" className="flex items-center gap-3 active:bg-slate-50">
        <div className="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
          {doc.thumbnail_url || (doc.file_url && doc.mime_type?.startsWith('image/')) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.thumbnail_url ?? doc.file_url!}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : doc.mime_type === 'application/pdf' ? (
            <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-slate-900 truncate">
              {doc.vendor_name ?? doc.invoice_no ?? '未命名單據'}
            </p>
            <Badge variant={statusVariant} className="shrink-0">
              {DOCUMENT_STATUS_LABELS[doc.status] ?? doc.status}
            </Badge>
          </div>
          {doc.invoice_no && (
            <p className="text-xs text-slate-400 font-mono mt-0.5">{doc.invoice_no}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-slate-400">{formatDate(doc.invoice_date ?? doc.uploaded_at)}</p>
            {doc.amount != null && (
              <>
                <span className="text-slate-200">·</span>
                <p className="text-xs font-medium text-slate-600">{formatCurrency(doc.amount)}</p>
              </>
            )}
            <span className="text-slate-200">·</span>
            <p className="text-xs text-slate-400">{sourceLabel(doc.source_type)}</p>
          </div>
        </div>
        <svg className="h-4 w-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Card>
    </Link>
  )
}

function sourceLabel(s: string) {
  const map: Record<string, string> = {
    camera: '拍照', upload: '上傳', qr: '掃碼', email: 'Email', import: '匯入',
  }
  return map[s] ?? s
}
