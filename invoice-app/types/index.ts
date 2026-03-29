// ============================================================
// Core Type Definitions
// ============================================================

export type UserRole = 'admin' | 'accountant'

export type DocumentStatus = 'pending' | 'reviewing' | 'confirmed' | 'duplicate' | 'voided' | 'ignored'
export type DocumentSource = 'camera' | 'upload' | 'qr' | 'email' | 'import'

export type ImportStatus = 'pending' | 'reviewing' | 'confirmed' | 'duplicate' | 'error' | 'ignored'
export type ImportBatchStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type ImportSourceType = 'M_file' | 'D_file' | 'MD_combined' | 'manual' | 'qr' | 'camera' | 'email'

export type DeductibleStatus = 'claimable' | 'review' | 'non_claimable'
export type PaymentMethod = 'cash' | 'credit_card' | 'bank_transfer' | 'other'
export type ExpenseStatus = 'draft' | 'confirmed' | 'voided'

export type InvoiceStatus = 'issued' | 'void' | 'allowance'
export type PaymentStatus = 'unpaid' | 'paid' | 'partial'
export type InvoiceDirection = 'incoming' | 'outgoing' | 'unknown'

export type CommentStatus = 'info' | 'pending_doc' | 'pending_confirm' | 'resolved'
export type CommentTargetType = 'expense' | 'sales_invoice' | 'document' | 'raw_header'

export type ExpenseCategory =
  | 'purchase_product'
  | 'transportation'
  | 'parking_fuel'
  | 'stationery_office'
  | 'electronics_equipment'
  | 'repair_consumables'
  | 'venue_rental'
  | 'appliance_equipment'
  | 'advertising_marketing'
  | 'other_pending'

// ============================================================
// Database Row Types
// ============================================================

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  company_id: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  company_name: string
  tax_id: string
  address: string | null
  phone: string | null
  email: string | null
  owner_id: string | null
  created_at: string
  updated_at: string
}

export interface ImportBatch {
  id: string
  company_id: string
  source_type: ImportSourceType
  file_name: string | null
  imported_at: string
  imported_by: string | null
  total_rows: number
  success_rows: number
  error_rows: number
  duplicate_rows: number
  status: ImportBatchStatus
  remark: string | null
  created_at: string
}

export interface RawInvoiceHeader {
  id: string
  company_id: string
  batch_id: string | null
  source_type: string
  invoice_no: string
  buyer_mark: string | null
  format_code: string | null
  invoice_status: string | null
  invoice_date: string | null
  buyer_tax_id: string | null
  buyer_name: string | null
  seller_tax_id: string | null
  seller_name: string | null
  send_date: string | null
  sales_amount: number
  taxable_amount: number
  zero_tax_amount: number
  exempt_amount: number
  tax_amount: number
  total_amount: number
  tax_type: string | null
  exchange_rate: number
  carrier_type: string | null
  carrier_no1: string | null
  carrier_no2: string | null
  total_remark: string | null
  issued_at: string | null
  last_modified_at: string | null
  mig_type: string | null
  sender_tax_id: string | null
  sender_name: string | null
  raw_payload: Record<string, unknown> | null
  duplicate_key: string | null
  import_status: ImportStatus
  error_message: string | null
  invoice_direction: InvoiceDirection
  created_at: string
  updated_at: string
}

export interface RawInvoiceItem {
  id: string
  header_id: string | null
  invoice_no: string
  invoice_date: string | null
  seq_no: number | null
  item_name: string | null
  qty: number | null
  unit: string | null
  unit_price: number | null
  amount: number | null
  item_remark: string | null
  related_no: string | null
  raw_payload: Record<string, unknown> | null
  created_at: string
}

export interface Document {
  id: string
  company_id: string
  source_type: DocumentSource
  file_url: string | null
  thumbnail_url: string | null
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  uploaded_by: string | null
  uploaded_at: string
  status: DocumentStatus
  invoice_no: string | null
  invoice_date: string | null
  vendor_name: string | null
  vendor_tax_id: string | null
  amount: number | null
  ocr_text: string | null
  ocr_payload: Record<string, unknown> | null
  raw_header_id: string | null
  expense_id: string | null
  remark: string | null
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  company_id: string
  raw_header_id: string | null
  document_id: string | null
  invoice_no: string | null
  expense_date: string
  vendor_name: string
  vendor_tax_id: string | null
  untaxed_amount: number
  tax_amount: number
  total_amount: number
  category: ExpenseCategory | null
  deductible_status: DeductibleStatus
  deductible_note: string | null
  business_purpose: string | null
  payment_method: PaymentMethod | null
  project_tag: string | null
  status: ExpenseStatus
  created_by: string | null
  created_at: string
  updated_at: string
  // Joins
  items?: ExpenseItem[]
  document?: Document
  comments?: AccountantComment[]
}

export interface ExpenseItem {
  id: string
  expense_id: string
  item_name: string
  qty: number
  unit: string | null
  unit_price: number | null
  amount: number
  remark: string | null
  created_at: string
}

export interface SalesInvoice {
  id: string
  company_id: string
  raw_header_id: string | null
  invoice_no: string
  invoice_date: string
  customer_name: string | null
  customer_tax_id: string | null
  untaxed_amount: number
  tax_amount: number
  total_amount: number
  invoice_status: InvoiceStatus
  payment_status: PaymentStatus
  paid_at: string | null
  remark: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joins
  comments?: AccountantComment[]
}

export interface AccountantComment {
  id: string
  company_id: string
  target_type: CommentTargetType
  target_id: string
  comment: string
  status: CommentStatus
  created_by: string | null
  created_at: string
  updated_at: string
  // Joins
  author?: User
}

export interface ExpenseCategory_DB {
  id: string
  company_id: string
  code: string
  label: string
  is_default: boolean
  sort_order: number
  created_at: string
}

// ============================================================
// UI / Form Types
// ============================================================

export interface DashboardStats {
  pendingDocuments: number
  monthlyExpenseTotal: number
  monthlyTaxDeductible: number
  monthlySalesTotal: number
  pendingAccountantItems: number
}

export interface ImportPreviewRow {
  rowIndex: number
  invoiceNo: string
  invoiceDate: string
  sellerName: string
  sellerTaxId: string
  buyerName: string
  buyerTaxId: string
  totalAmount: number
  taxAmount: number
  status: 'ok' | 'duplicate' | 'error' | 'warning'
  errorMessage?: string
  rawData: Record<string, string>
}

export interface ImportResult {
  total: number
  success: number
  errors: number
  duplicates: number
  errorRows: ImportPreviewRow[]
  duplicateRows: ImportPreviewRow[]
}

export interface QRScanResult {
  invoiceNo?: string
  invoiceDate?: string
  sellerTaxId?: string
  buyerTaxId?: string
  amount?: number
  randomCode?: string
  raw: string
}

// Column mapping for M/D file import
export interface ColumnMapping {
  [fieldKey: string]: string // fieldKey -> CSV column name
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  purchase_product: '進貨 / 產品',
  transportation: '交通',
  parking_fuel: '停車 / 油資',
  stationery_office: '文具 / 辦公用品',
  electronics_equipment: '3C / 設備',
  repair_consumables: '修繕 / 耗材',
  venue_rental: '場租',
  appliance_equipment: '家電 / 設備',
  advertising_marketing: '廣告 / 行銷',
  other_pending: '其他待確認',
}

export const DEDUCTIBLE_STATUS_LABELS: Record<DeductibleStatus, string> = {
  claimable: '可先申報',
  review: '待會計師確認',
  non_claimable: '不可扣抵',
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: '待整理',
  reviewing: '待確認',
  confirmed: '已轉正式資料',
  duplicate: '疑似重複',
  voided: '已作廢',
  ignored: '已忽略',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '現金',
  credit_card: '信用卡',
  bank_transfer: '匯款',
  other: '其他',
}

export const COMMENT_STATUS_LABELS: Record<CommentStatus, string> = {
  info: '一般註記',
  pending_doc: '待補件',
  pending_confirm: '待確認',
  resolved: '已處理',
}
