'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, PageHeader, Badge } from '@/components/ui'
import { toast } from '@/components/ui'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import {
  parseFile, autoDetectMapping, mapMFileRows, mapMRowToDbPayload,
  M_FILE_FIELDS, D_FILE_FIELDS,
} from '@/lib/parsers/invoice-parser'
import type { ImportPreviewRow, ColumnMapping, ImportResult } from '@/types'

type Step = 'upload' | 'mapping' | 'preview' | 'result'
type FileType = 'M' | 'D' | 'both'

interface Props {
  companyId: string
  userId: string
  existingDuplicateKeys: string[]
}

export default function ImportClient({ companyId, userId, existingDuplicateKeys }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [fileType, setFileType] = useState<FileType>('M')
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const dupeSet = new Set(existingDuplicateKeys)
  const fields = fileType === 'D' ? D_FILE_FIELDS : M_FILE_FIELDS

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)

    try {
      const { headers: h, rows } = await parseFile(file)
      setHeaders(h)
      setRawRows(rows)
      const detected = autoDetectMapping(h, fields)
      setMapping(detected)
      setStep('mapping')
    } catch (err) {
      toast(String(err), 'error')
    }
  }

  function handlePreview() {
    if (fileType === 'D') {
      toast('D 檔預覽：明細將與 M 檔主檔關聯', 'info')
      setStep('preview')
      return
    }
    const rows = mapMFileRows(rawRows, mapping, dupeSet)
    setPreviewRows(rows)
    setStep('preview')
  }

  async function handleImport() {
    setImporting(true)
    const supabase = createClient()

    // Create batch record
    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .insert({
        company_id: companyId,
        source_type: fileType === 'D' ? 'D_file' : 'M_file',
        file_name: fileName,
        imported_by: userId,
        total_rows: rawRows.length,
        status: 'processing',
      })
      .select()
      .single()

    if (batchError || !batch) {
      toast('匯入失敗：無法建立批次', 'error')
      setImporting(false)
      return
    }

    if (fileType === 'M') {
      const okRows    = previewRows.filter(r => r.status === 'ok')
      const skipRows  = previewRows.filter(r => r.status !== 'ok')

      // Insert ok rows in chunks
      const payloads = okRows.map(r => mapMRowToDbPayload(r.rawData, mapping, companyId, batch.id))
      let successCount = 0

      for (let i = 0; i < payloads.length; i += 50) {
        const chunk = payloads.slice(i, i + 50)
        const { error } = await supabase.from('raw_invoice_headers').insert(chunk)
        if (!error) successCount += chunk.length
      }

      // Mark duplicates in DB
      const dupPayloads = previewRows
        .filter(r => r.status === 'duplicate')
        .map(r => ({ ...mapMRowToDbPayload(r.rawData, mapping, companyId, batch.id), import_status: 'duplicate' }))
      if (dupPayloads.length > 0) {
        for (let i = 0; i < dupPayloads.length; i += 50) {
          await supabase.from('raw_invoice_headers').insert(dupPayloads.slice(i, i + 50))
        }
      }

      await supabase.from('import_batches').update({
        status: 'completed',
        success_rows: successCount,
        error_rows: previewRows.filter(r => r.status === 'error').length,
        duplicate_rows: previewRows.filter(r => r.status === 'duplicate').length,
      }).eq('id', batch.id)

      setResult({
        total: rawRows.length,
        success: successCount,
        errors: previewRows.filter(r => r.status === 'error').length,
        duplicates: previewRows.filter(r => r.status === 'duplicate').length,
        errorRows: previewRows.filter(r => r.status === 'error'),
        duplicateRows: previewRows.filter(r => r.status === 'duplicate'),
      })
    } else {
      // D file - insert as raw items linked to existing headers
      let successCount = 0
      for (let i = 0; i < rawRows.length; i += 50) {
        const chunk = rawRows.slice(i, i + 50).map(row => {
          const get = (k: string) => (mapping[k] ? (row[mapping[k]] ?? '').trim() : '')
          return {
            invoice_no: get('invoice_no'),
            invoice_date: get('invoice_date') || null,
            seq_no: parseInt(get('seq_no')) || null,
            item_name: get('item_name') || null,
            qty: parseFloat(get('qty')) || null,
            unit: get('unit') || null,
            unit_price: parseFloat(get('unit_price')) || null,
            amount: parseFloat(get('amount').replace(/,/g, '')) || null,
            item_remark: get('item_remark') || null,
            related_no: get('related_no') || null,
            raw_payload: row,
          }
        })
        const { error } = await supabase.from('raw_invoice_items').insert(chunk)
        if (!error) successCount += chunk.length
      }

      await supabase.from('import_batches').update({
        status: 'completed',
        success_rows: successCount,
      }).eq('id', batch.id)

      setResult({ total: rawRows.length, success: successCount, errors: 0, duplicates: 0, errorRows: [], duplicateRows: [] })
    }

    setImporting(false)
    setStep('result')
  }

  function reset() {
    setStep('upload')
    setFileName('')
    setHeaders([])
    setRawRows([])
    setMapping({})
    setPreviewRows([])
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      <PageHeader title="匯入發票資料" back={() => router.back()} />

      {/* Step indicator */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          {(['upload','mapping','preview','result'] as Step[]).map((s, i) => {
            const labels = { upload: '上傳', mapping: '對應', preview: '預覽', result: '結果' }
            const isActive = step === s
            const isDone = ['upload','mapping','preview','result'].indexOf(step) > i
            return (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className={cn('flex-1 h-px w-6', isDone ? 'bg-blue-400' : 'bg-slate-200')} />}
                <div className={cn('flex items-center gap-1.5 text-xs font-medium',
                  isActive ? 'text-blue-600' : isDone ? 'text-emerald-600' : 'text-slate-400')}>
                  <div className={cn('h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                    isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400')}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  {labels[s]}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Step 1: Upload */}
        {step === 'upload' && (
          <>
            <Card>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">選擇檔案類型</p>
              <div className="flex gap-2">
                {(['M','D','both'] as FileType[]).map(t => (
                  <button key={t} onClick={() => setFileType(t)}
                    className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors',
                      fileType === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200')}>
                    {t === 'both' ? 'M + D' : `${t} 檔`}
                  </button>
                ))}
              </div>
              <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1">
                <p>• <strong>M 檔</strong>：發票主檔（表頭資訊）</p>
                <p>• <strong>D 檔</strong>：發票明細（品項清單）</p>
                <p>• <strong>M + D</strong>：同時匯入主檔與明細</p>
              </div>
            </Card>

            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center gap-3 active:bg-slate-50"
            >
              <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                <svg className="h-7 w-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-700">點此選擇 CSV 或 Excel</p>
                <p className="text-xs text-slate-400 mt-1">支援 .csv / .xlsx / .xls</p>
              </div>
            </button>

            <Card className="bg-amber-50 border border-amber-100">
              <p className="text-xs font-semibold text-amber-700 mb-2">怎麼下載財政部資料？</p>
              <ol className="text-xs text-amber-700 space-y-1 list-decimal pl-4">
                <li>登入財政部電子發票整合服務平台</li>
                <li>進入「進項資料查詢」或「銷項資料查詢」</li>
                <li>選擇期間後點選「下載 CSV」</li>
                <li>將下載的 M 檔或 D 檔上傳到此處</li>
              </ol>
            </Card>
          </>
        )}

        {/* Step 2: Column mapping */}
        {step === 'mapping' && (
          <>
            <Card>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">欄位對應</p>
              <p className="text-xs text-slate-400 mb-4">系統已嘗試自動比對，請確認並調整</p>
              <div className="space-y-3">
                {fields.filter(f => f.required || mapping[f.key]).map(field => (
                  <div key={field.key} className="flex items-center gap-3">
                    <div className="w-28 shrink-0">
                      <p className="text-xs font-medium text-slate-700">{field.label}</p>
                      {field.required && <p className="text-[10px] text-red-400">必填</p>}
                    </div>
                    <select
                      value={mapping[field.key] ?? ''}
                      onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value }))}
                      className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="">（未對應）</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </Card>

            {/* Show all fields toggle */}
            <Card className="bg-slate-50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">其餘欄位（選填）</p>
              <div className="space-y-3">
                {fields.filter(f => !f.required && !mapping[f.key]).map(field => (
                  <div key={field.key} className="flex items-center gap-3">
                    <div className="w-28 shrink-0">
                      <p className="text-xs text-slate-500">{field.label}</p>
                    </div>
                    <select
                      value={mapping[field.key] ?? ''}
                      onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value }))}
                      className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="">（未對應）</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </Card>

            <p className="text-xs text-slate-400 text-center">共 {rawRows.length} 筆資料</p>
            <Button className="w-full" size="lg" onClick={handlePreview}>下一步：預覽資料</Button>
          </>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <>
            {fileType !== 'D' && (
              <>
                <div className="flex gap-2">
                  {[
                    { label: '全部', count: previewRows.length, color: 'slate' },
                    { label: '可匯入', count: previewRows.filter(r => r.status === 'ok').length, color: 'emerald' },
                    { label: '疑似重複', count: previewRows.filter(r => r.status === 'duplicate').length, color: 'amber' },
                    { label: '錯誤', count: previewRows.filter(r => r.status === 'error').length, color: 'red' },
                  ].map(s => (
                    <div key={s.label} className={cn('flex-1 text-center p-2 rounded-xl',
                      s.color === 'emerald' ? 'bg-emerald-50' :
                      s.color === 'amber'   ? 'bg-amber-50' :
                      s.color === 'red'     ? 'bg-red-50' : 'bg-slate-100')}>
                      <p className={cn('text-lg font-bold',
                        s.color === 'emerald' ? 'text-emerald-700' :
                        s.color === 'amber'   ? 'text-amber-700' :
                        s.color === 'red'     ? 'text-red-700' : 'text-slate-700')}>{s.count}</p>
                      <p className="text-xs text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {previewRows.map(row => (
                    <Card key={row.rowIndex} padding="sm" className={cn(
                      'border',
                      row.status === 'ok'        ? 'border-slate-100' :
                      row.status === 'duplicate' ? 'border-amber-200 bg-amber-50' :
                      'border-red-200 bg-red-50'
                    )}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{row.sellerName || '未知廠商'}</p>
                          <p className="text-xs font-mono text-slate-400">{row.invoiceNo}</p>
                          <p className="text-xs text-slate-400">{formatDate(row.invoiceDate)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">{formatCurrency(row.totalAmount)}</p>
                          <Badge variant={row.status === 'ok' ? 'confirmed' : row.status === 'duplicate' ? 'duplicate' : 'error'}>
                            {row.status === 'ok' ? '可匯入' : row.status === 'duplicate' ? '疑似重複' : '錯誤'}
                          </Badge>
                        </div>
                      </div>
                      {row.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">{row.errorMessage}</p>
                      )}
                    </Card>
                  ))}
                </div>
              </>
            )}

            {fileType === 'D' && (
              <Card>
                <p className="text-sm text-slate-600">共 {rawRows.length} 筆明細資料將被匯入</p>
              </Card>
            )}

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setStep('mapping')}>返回</Button>
              <Button className="flex-1" onClick={handleImport} loading={importing}>
                確認匯入 {fileType !== 'D' ? `(${previewRows.filter(r => r.status === 'ok').length} 筆)` : `(${rawRows.length} 筆)`}
              </Button>
            </div>
          </>
        )}

        {/* Step 4: Result */}
        {step === 'result' && result && (
          <>
            <Card className="text-center py-6">
              <div className={cn('h-16 w-16 rounded-full mx-auto flex items-center justify-center mb-4',
                result.errors === 0 ? 'bg-emerald-100' : 'bg-amber-100')}>
                <svg className={cn('h-8 w-8', result.errors === 0 ? 'text-emerald-600' : 'text-amber-600')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={result.errors === 0 ? 'M5 13l4 4L19 7' : 'M12 9v2m0 4h.01'} />
                </svg>
              </div>
              <p className="text-lg font-bold text-slate-900">匯入完成</p>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-emerald-50 rounded-xl p-3">
                  <p className="text-xl font-bold text-emerald-700">{result.success}</p>
                  <p className="text-xs text-emerald-600">成功</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-xl font-bold text-amber-700">{result.duplicates}</p>
                  <p className="text-xs text-amber-600">重複</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-xl font-bold text-red-700">{result.errors}</p>
                  <p className="text-xs text-red-600">錯誤</p>
                </div>
              </div>
            </Card>

            {result.errorRows.length > 0 && (
              <Card>
                <p className="text-xs font-semibold text-red-500 mb-3">錯誤列</p>
                <div className="space-y-2">
                  {result.errorRows.map(r => (
                    <div key={r.rowIndex} className="text-xs text-slate-600">
                      <span className="font-mono">第 {r.rowIndex} 列</span>：{r.errorMessage}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={reset}>再次匯入</Button>
              <Button className="flex-1" onClick={() => router.push('/documents?status=pending')}>
                前往待整理
              </Button>
            </div>
          </>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
