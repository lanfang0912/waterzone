'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Input, Select, PageHeader, Modal } from '@/components/ui'
import { toast } from '@/components/ui'
import { parseInvoiceQR } from '@/lib/parsers/invoice-parser'
import type { QRScanResult } from '@/types'
import { DEDUCTIBLE_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/types'

interface Props {
  companyId: string
  userId: string
  categories: { code: string; label: string }[]
}

type ScanMode = 'camera' | 'qr' | 'upload'

export default function ScanClient({ companyId, userId, categories }: Props) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [mode, setMode] = useState<ScanMode>('camera')
  const [scanning, setScanning] = useState(false)
  const [scannedResult, setScannedResult] = useState<QRScanResult | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)

  // Form state
  const [form, setForm] = useState({
    vendor_name: '',
    vendor_tax_id: '',
    invoice_no: '',
    invoice_date: '',
    amount: '',
    category: '',
    deductible: 'review',
    payment_method: 'cash',
    purpose: '',
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  // Prefill from QR scan result
  function prefillFromQR(qr: QRScanResult) {
    setForm(f => ({
      ...f,
      invoice_no: qr.invoiceNo ?? '',
      invoice_date: qr.invoiceDate ?? '',
      vendor_tax_id: qr.sellerTaxId ?? '',
      amount: qr.amount ? String(qr.amount) : '',
    }))
  }

  // Start camera
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setScanning(true)
    } catch {
      toast('無法開啟相機，請確認已授予相機權限', 'error')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setScanning(false)
  }

  // Capture photo
  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
      setCapturedFile(file)
      setCapturedImageUrl(canvas.toDataURL('image/jpeg'))
      stopCamera()
      setShowForm(true)
    }, 'image/jpeg', 0.85)
  }

  // QR scanning via BarcodeDetector or jsQR fallback
  async function startQRScan() {
    await startCamera()
    // Poll for QR every 500ms
    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current) { clearInterval(interval); return }
      const video = videoRef.current
      if (video.readyState < 2) return

      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0)

      try {
        // Try BarcodeDetector (Chrome/Android)
        if ('BarcodeDetector' in window) {
          // @ts-expect-error BarcodeDetector not in TS yet
          const detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] })
          const barcodes = await detector.detect(canvas)
          if (barcodes.length > 0) {
            clearInterval(interval)
            stopCamera()
            const raw = barcodes[0].rawValue as string
            const result = parseInvoiceQR(raw)
            setScannedResult(result)
            prefillFromQR(result)
            if (!result.invoiceNo) toast('QR Code 解析完成，請補充資訊', 'info')
            else toast(`已識別發票 ${result.invoiceNo}`, 'success')
            setShowForm(true)
          }
        }
      } catch {
        // BarcodeDetector failed, continue
      }
    }, 500)

    // Auto-stop after 30s
    setTimeout(() => { clearInterval(interval); if (scanning) stopCamera() }, 30000)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCapturedFile(file)
    const url = URL.createObjectURL(file)
    setCapturedImageUrl(url)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.vendor_name && !form.invoice_no) { toast('請至少填入廠商名稱或發票號碼', 'error'); return }
    setSaving(true)
    const supabase = createClient()

    let fileUrl: string | null = null
    let thumbnailUrl: string | null = null

    // Upload image if captured
    if (capturedFile) {
      const ext = capturedFile.name.split('.').pop()
      const path = `${companyId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { data: storageData } = await supabase.storage
        .from('documents')
        .upload(path, capturedFile, { contentType: capturedFile.type })
      if (storageData) {
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(storageData.path)
        fileUrl = publicUrl
        thumbnailUrl = publicUrl
      }
    }

    // Create document record
    const { data: doc, error: docError } = await supabase.from('documents').insert({
      company_id: companyId,
      source_type: mode === 'qr' ? 'qr' : 'camera',
      file_url: fileUrl,
      thumbnail_url: thumbnailUrl,
      invoice_no: form.invoice_no || null,
      invoice_date: form.invoice_date || null,
      vendor_name: form.vendor_name || null,
      vendor_tax_id: form.vendor_tax_id || null,
      amount: form.amount ? parseFloat(form.amount) : null,
      status: 'pending',
      uploaded_by: userId,
    }).select().single()

    if (docError) { toast('儲存失敗', 'error'); setSaving(false); return }

    // If all info is ready, optionally convert to expense immediately
    if (form.vendor_name && form.amount && form.invoice_date && form.category) {
      const total = parseFloat(form.amount)
      const tax = Math.round(total / 1.05 * 0.05 * 100) / 100
      await supabase.from('expenses').insert({
        company_id: companyId,
        document_id: doc.id,
        invoice_no: form.invoice_no || null,
        expense_date: form.invoice_date,
        vendor_name: form.vendor_name,
        vendor_tax_id: form.vendor_tax_id || null,
        untaxed_amount: Math.round((total - tax) * 100) / 100,
        tax_amount: tax,
        total_amount: total,
        category: form.category,
        deductible_status: form.deductible,
        business_purpose: form.purpose || null,
        payment_method: form.payment_method,
        status: 'confirmed',
        created_by: userId,
      })
      await supabase.from('documents').update({ status: 'confirmed' }).eq('id', doc.id)
      toast('已儲存並轉為正式支出', 'success')
    } else {
      toast('已新增至單據匣，記得補充資料', 'success')
    }

    setSaving(false)
    setShowForm(false)
    router.push('/documents')
  }

  useEffect(() => {
    return () => stopCamera()
  }, [])

  return (
    <div className="min-h-dvh bg-black flex flex-col">
      {!scanning && !showForm && (
        <>
          <PageHeader
            title="拍照收單"
            back={() => router.back()}
          />
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
            <div className="w-full max-w-sm space-y-3">
              <button
                onClick={() => { setMode('camera'); startCamera().then(() => setShowForm(false)) }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white active:bg-slate-50"
              >
                <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">拍照收單</p>
                  <p className="text-sm text-slate-400">拍攝發票或收據</p>
                </div>
              </button>

              <button
                onClick={() => { setMode('qr'); startQRScan() }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white active:bg-slate-50"
              >
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8H3m2 4H3m18-4h-2M5 20H3m2-4H3" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">掃描 QR / 條碼</p>
                  <p className="text-sm text-slate-400">自動帶入發票資訊</p>
                </div>
              </button>

              <button
                onClick={() => { setMode('upload'); fileInputRef.current?.click() }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white active:bg-slate-50"
              >
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">從相簿選取</p>
                  <p className="text-sm text-slate-400">圖片或 PDF</p>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </>
      )}

      {/* Camera viewfinder */}
      {scanning && (
        <div className="flex-1 relative">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />

          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 bg-black/30" />
            <div className="flex items-center">
              <div className="flex-1 bg-black/30" />
              <div className="w-64 h-64 border-2 border-white rounded-2xl" />
              <div className="flex-1 bg-black/30" />
            </div>
            <div className="flex-1 bg-black/30" />
          </div>

          {/* Controls */}
          <div className="absolute bottom-10 inset-x-0 flex items-center justify-center gap-6">
            <button onClick={stopCamera} className="h-12 w-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {mode === 'camera' && (
              <button onClick={capturePhoto}
                className="h-18 w-18 rounded-full border-4 border-white bg-white/20 backdrop-blur flex items-center justify-center"
                style={{ width: 72, height: 72 }}
              >
                <div className="h-14 w-14 rounded-full bg-white" />
              </button>
            )}
            {mode === 'qr' && (
              <p className="text-white text-sm font-medium">對準 QR Code 自動掃描</p>
            )}
          </div>
        </div>
      )}

      {/* Form modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="補充單據資訊">
        <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
          {capturedImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={capturedImageUrl} alt="" className="w-full max-h-32 object-contain bg-slate-50 rounded-xl" />
          )}
          {scannedResult?.raw && (
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-xs text-emerald-600 font-medium">已識別 QR Code</p>
              <p className="text-xs text-emerald-700 font-mono mt-1 break-all">{scannedResult.raw.slice(0, 60)}</p>
            </div>
          )}
          <Input label="廠商名稱" value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)} placeholder="廠商名稱" />
          <Input label="廠商統編" value={form.vendor_tax_id} onChange={e => set('vendor_tax_id', e.target.value)} placeholder="12345678" maxLength={8} />
          <Input label="發票號碼" value={form.invoice_no} onChange={e => set('invoice_no', e.target.value)} placeholder="AB12345678" />
          <Input label="發票日期" type="date" value={form.invoice_date} onChange={e => set('invoice_date', e.target.value)} />
          <Input label="含稅金額" type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" />
          <Select label="類別" value={form.category} onChange={e => set('category', e.target.value)}
            options={categories.map(c => ({ value: c.code, label: c.label }))} placeholder="請選擇（選填）" />
          <Select label="扣抵狀態" value={form.deductible} onChange={e => set('deductible', e.target.value)}
            options={[
              { value: 'claimable',     label: DEDUCTIBLE_STATUS_LABELS.claimable },
              { value: 'review',        label: DEDUCTIBLE_STATUS_LABELS.review },
              { value: 'non_claimable', label: DEDUCTIBLE_STATUS_LABELS.non_claimable },
            ]} />
          <Select label="付款方式" value={form.payment_method} onChange={e => set('payment_method', e.target.value)}
            options={Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
          <Input label="用途說明" value={form.purpose} onChange={e => set('purpose', e.target.value)} placeholder="選填" />
          <p className="text-xs text-slate-400">若類別與金額都填寫，將自動轉為正式支出</p>
          <Button className="w-full" onClick={handleSave} loading={saving}>儲存</Button>
          <Button variant="secondary" className="w-full" onClick={() => setShowForm(false)}>取消</Button>
        </div>
      </Modal>
    </div>
  )
}
