import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type { ImportPreviewRow, ColumnMapping } from '@/types'

// ============================================================
// M 檔欄位對應
// ============================================================
export const M_FILE_FIELDS: Array<{ key: string; label: string; required: boolean }> = [
  { key: 'invoice_no',       label: '發票號碼',       required: true },
  { key: 'invoice_date',     label: '發票日期',       required: true },
  { key: 'invoice_status',   label: '發票狀態',       required: false },
  { key: 'buyer_mark',       label: '買受人註記',     required: false },
  { key: 'format_code',      label: '格式代號',       required: false },
  { key: 'buyer_tax_id',     label: '買方統一編號',   required: false },
  { key: 'buyer_name',       label: '買方名稱',       required: false },
  { key: 'seller_tax_id',    label: '賣方統一編號',   required: false },
  { key: 'seller_name',      label: '賣方名稱',       required: false },
  { key: 'send_date',        label: '寄送日期',       required: false },
  { key: 'sales_amount',     label: '銷售額合計',     required: false },
  { key: 'taxable_amount',   label: '應稅銷售額',     required: false },
  { key: 'zero_tax_amount',  label: '零稅銷售額',     required: false },
  { key: 'exempt_amount',    label: '免稅銷售額',     required: false },
  { key: 'tax_amount',       label: '營業稅',         required: false },
  { key: 'total_amount',     label: '總計',           required: true },
  { key: 'tax_type',         label: '課稅別',         required: false },
  { key: 'exchange_rate',    label: '匯率',           required: false },
  { key: 'carrier_type',     label: '載具類別編號',   required: false },
  { key: 'carrier_no1',      label: '載具號碼1',      required: false },
  { key: 'carrier_no2',      label: '載具號碼2',      required: false },
  { key: 'total_remark',     label: '總備註',         required: false },
  { key: 'issued_at',        label: '開立確認時間',   required: false },
  { key: 'last_modified_at', label: '最後異動時間',   required: false },
  { key: 'mig_type',         label: 'MIG訊息類別',    required: false },
  { key: 'sender_tax_id',    label: '傳送方統編',     required: false },
  { key: 'sender_name',      label: '傳送方名稱',     required: false },
]

// D 檔欄位對應
export const D_FILE_FIELDS: Array<{ key: string; label: string; required: boolean }> = [
  { key: 'invoice_no',   label: '發票號碼', required: true },
  { key: 'invoice_date', label: '發票日期', required: true },
  { key: 'seq_no',       label: '序號',     required: false },
  { key: 'item_name',    label: '品名',     required: false },
  { key: 'qty',          label: '數量',     required: false },
  { key: 'unit',         label: '單位',     required: false },
  { key: 'unit_price',   label: '單價',     required: false },
  { key: 'amount',       label: '金額',     required: false },
  { key: 'item_remark',  label: '單一欄位備註', required: false },
  { key: 'related_no',   label: '相關號碼', required: false },
]

// ============================================================
// Auto-detect column mapping
// ============================================================
export function autoDetectMapping(
  headers: string[],
  fields: typeof M_FILE_FIELDS
): ColumnMapping {
  const mapping: ColumnMapping = {}
  for (const field of fields) {
    // Try exact label match first
    const exactMatch = headers.find(
      (h) => h.trim() === field.label || h.trim() === field.key
    )
    if (exactMatch) {
      mapping[field.key] = exactMatch
      continue
    }
    // Try partial match
    const partial = headers.find((h) =>
      h.toLowerCase().includes(field.label.toLowerCase().slice(0, 4))
    )
    if (partial) {
      mapping[field.key] = partial
    }
  }
  return mapping
}

// ============================================================
// Parse CSV or Excel to raw rows
// ============================================================
export async function parseFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const headers = result.meta.fields ?? []
          resolve({ headers, rows: result.data as Record<string, string>[] })
        },
        error: (err) => reject(err),
      })
    })
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
    const headers = data.length > 0 ? Object.keys(data[0]) : []
    return { headers, rows: data }
  }

  throw new Error('不支援的檔案格式，請上傳 CSV 或 Excel 檔案')
}

// ============================================================
// Map raw rows to M file preview rows
// ============================================================
export function mapMFileRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  existingDuplicateKeys: Set<string>
): ImportPreviewRow[] {
  return rows.map((row, idx) => {
    const get = (key: string) => (mapping[key] ? (row[mapping[key]] ?? '').trim() : '')

    const invoiceNo = get('invoice_no')
    const invoiceDate = normalizeDateStr(get('invoice_date'))
    const sellerTaxId = get('seller_tax_id')
    const totalAmount = parseFloat(get('total_amount').replace(/,/g, '')) || 0
    const taxAmount = parseFloat(get('tax_amount').replace(/,/g, '')) || 0

    const errors: string[] = []
    if (!invoiceNo) errors.push('缺少發票號碼')
    if (!invoiceDate) errors.push('缺少或無效日期')

    const duplicateKey = sellerTaxId && invoiceNo ? `${sellerTaxId}_${invoiceNo}` : ''
    const isDuplicate = duplicateKey ? existingDuplicateKeys.has(duplicateKey) : false

    let status: ImportPreviewRow['status'] = 'ok'
    if (errors.length > 0) status = 'error'
    else if (isDuplicate) status = 'duplicate'

    return {
      rowIndex: idx + 1,
      invoiceNo,
      invoiceDate,
      sellerName: get('seller_name'),
      sellerTaxId,
      buyerName: get('buyer_name'),
      buyerTaxId: get('buyer_tax_id'),
      totalAmount,
      taxAmount,
      status,
      errorMessage: errors.length > 0 ? errors.join('；') : isDuplicate ? '疑似重複' : undefined,
      rawData: row,
    }
  })
}

// ============================================================
// Map raw M file row to DB insert payload
// ============================================================
export function mapMRowToDbPayload(
  row: Record<string, string>,
  mapping: ColumnMapping,
  companyId: string,
  batchId: string
) {
  const get = (key: string) => (mapping[key] ? (row[mapping[key]] ?? '').trim() : '')
  const getNum = (key: string) => parseFloat(get(key).replace(/,/g, '')) || 0

  const invoiceNo = get('invoice_no')
  const sellerTaxId = get('seller_tax_id')

  return {
    company_id: companyId,
    batch_id: batchId,
    source_type: 'M_file',
    invoice_no: invoiceNo,
    buyer_mark: get('buyer_mark') || null,
    format_code: get('format_code') || null,
    invoice_status: get('invoice_status') || null,
    invoice_date: normalizeDateStr(get('invoice_date')) || null,
    buyer_tax_id: get('buyer_tax_id') || null,
    buyer_name: get('buyer_name') || null,
    seller_tax_id: sellerTaxId || null,
    seller_name: get('seller_name') || null,
    send_date: normalizeDateStr(get('send_date')) || null,
    sales_amount: getNum('sales_amount'),
    taxable_amount: getNum('taxable_amount'),
    zero_tax_amount: getNum('zero_tax_amount'),
    exempt_amount: getNum('exempt_amount'),
    tax_amount: getNum('tax_amount'),
    total_amount: getNum('total_amount'),
    tax_type: get('tax_type') || null,
    exchange_rate: parseFloat(get('exchange_rate')) || 1,
    carrier_type: get('carrier_type') || null,
    carrier_no1: get('carrier_no1') || null,
    carrier_no2: get('carrier_no2') || null,
    total_remark: get('total_remark') || null,
    issued_at: get('issued_at') || null,
    last_modified_at: get('last_modified_at') || null,
    mig_type: get('mig_type') || null,
    sender_tax_id: get('sender_tax_id') || null,
    sender_name: get('sender_name') || null,
    raw_payload: row,
    duplicate_key: sellerTaxId && invoiceNo ? `${sellerTaxId}_${invoiceNo}` : null,
    import_status: 'pending',
    invoice_direction: 'unknown',
  }
}

// ============================================================
// Taiwan QR Code Parser
// 台灣電子發票 QR Code 格式解析
// ============================================================
export function parseInvoiceQR(raw: string): {
  invoiceNo?: string
  invoiceDate?: string
  randomCode?: string
  sellerTaxId?: string
  buyerTaxId?: string
  amount?: number
  taxAmount?: number
  raw: string
} {
  // Format: 發票號碼 + 民國年月日 + 隨機碼 + 買方統編 + 賣方統編 + 未稅 + 稅額
  // Example: AB12345678 1120115 A001 00000000 12345678 1000 50
  const trimmed = raw.trim()

  // Left QR (primary)
  // Format varies by version, but common format:
  const parts = trimmed.split(':')
  if (parts.length >= 1) {
    const segment = parts[0]
    // Try to extract invoice no (2 uppercase letters + 8 digits)
    const invoiceMatch = segment.match(/([A-Z]{2}\d{8})/)
    if (invoiceMatch) {
      const invoiceNo = invoiceMatch[1]
      const rest = segment.slice(invoiceMatch.index! + invoiceNo.length).trim()
      const tokens = rest.split(/\s+/)

      // ROC date (民國年月日, 7 digits: YYYMMDD)
      const dateMatch = (tokens[0] || '').match(/^(\d{3})(\d{2})(\d{2})$/)
      let invoiceDate: string | undefined
      if (dateMatch) {
        const rocYear = parseInt(dateMatch[1])
        const adYear = rocYear + 1911
        invoiceDate = `${adYear}-${dateMatch[2]}-${dateMatch[3]}`
      }

      return {
        invoiceNo,
        invoiceDate,
        randomCode: tokens[1],
        buyerTaxId: tokens[2] === '00000000' ? undefined : tokens[2],
        sellerTaxId: tokens[3],
        amount: tokens[4] ? parseInt(tokens[4]) : undefined,
        taxAmount: tokens[5] ? parseInt(tokens[5]) : undefined,
        raw: trimmed,
      }
    }
  }

  return { raw: trimmed }
}

// ============================================================
// Helpers
// ============================================================
function normalizeDateStr(raw: string): string {
  if (!raw) return ''

  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)

  // YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}/.test(raw)) return raw.slice(0, 10).replace(/\//g, '-')

  // ROC date: 1120115 → 2023-01-15
  if (/^\d{7}$/.test(raw)) {
    const year = parseInt(raw.slice(0, 3)) + 1911
    const month = raw.slice(3, 5)
    const day = raw.slice(5, 7)
    return `${year}-${month}-${day}`
  }

  // ROC date with slash: 112/01/15
  if (/^\d{3}\/\d{2}\/\d{2}$/.test(raw)) {
    const parts = raw.split('/')
    const year = parseInt(parts[0]) + 1911
    return `${year}-${parts[1]}-${parts[2]}`
  }

  return raw
}
