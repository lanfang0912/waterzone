-- ============================================================
-- Invoice Management System - Supabase Schema
-- 一人公司電子發票整理與會計師協作系統
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Users table (extends Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'accountant')) DEFAULT 'admin',
  company_id UUID,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Companies table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  tax_id TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  owner_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from users to companies
ALTER TABLE public.users
  ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id)
  REFERENCES public.companies(id) ON DELETE SET NULL;

-- ============================================================
-- Import Batches - 匯入批次記錄
-- ============================================================
CREATE TABLE IF NOT EXISTS public.import_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('M_file', 'D_file', 'MD_combined', 'manual', 'qr', 'camera', 'email')),
  file_name TEXT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  imported_by UUID REFERENCES public.users(id),
  total_rows INTEGER DEFAULT 0,
  success_rows INTEGER DEFAULT 0,
  error_rows INTEGER DEFAULT 0,
  duplicate_rows INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Raw Invoice Headers - 原始發票主檔 (M 檔)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.raw_invoice_headers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('M_file', 'qr', 'manual', 'camera', 'email')) DEFAULT 'M_file',
  -- 發票基本資料
  invoice_no TEXT NOT NULL,
  buyer_mark TEXT,               -- 買受人註記
  format_code TEXT,              -- 格式代號
  invoice_status TEXT,           -- 發票狀態
  invoice_date DATE,
  -- 買賣方資訊
  buyer_tax_id TEXT,
  buyer_name TEXT,
  seller_tax_id TEXT,
  seller_name TEXT,
  -- 金額欄位
  send_date DATE,                -- 寄送日期
  sales_amount NUMERIC(15,2) DEFAULT 0,        -- 銷售額合計
  taxable_amount NUMERIC(15,2) DEFAULT 0,      -- 應稅銷售額
  zero_tax_amount NUMERIC(15,2) DEFAULT 0,     -- 零稅銷售額
  exempt_amount NUMERIC(15,2) DEFAULT 0,       -- 免稅銷售額
  tax_amount NUMERIC(15,2) DEFAULT 0,          -- 營業稅
  total_amount NUMERIC(15,2) DEFAULT 0,        -- 總計
  tax_type TEXT,                 -- 課稅別
  exchange_rate NUMERIC(10,4) DEFAULT 1,       -- 匯率
  -- 載具
  carrier_type TEXT,             -- 載具類別編號
  carrier_no1 TEXT,              -- 載具號碼1
  carrier_no2 TEXT,              -- 載具號碼2
  -- 其他
  total_remark TEXT,             -- 總備註
  issued_at TIMESTAMPTZ,         -- 開立確認時間
  last_modified_at TIMESTAMPTZ,  -- 最後異動時間
  mig_type TEXT,                 -- MIG訊息類別
  sender_tax_id TEXT,            -- 傳送方統編
  sender_name TEXT,              -- 傳送方名稱
  -- 匯入管理欄位
  raw_payload JSONB,             -- 原始 JSON payload
  duplicate_key TEXT,            -- 賣方統編 + 發票號碼 (用於查重)
  import_status TEXT NOT NULL CHECK (import_status IN ('pending', 'reviewing', 'confirmed', 'duplicate', 'error', 'ignored')) DEFAULT 'pending',
  error_message TEXT,
  invoice_direction TEXT CHECK (invoice_direction IN ('incoming', 'outgoing', 'unknown')) DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for duplicate detection
CREATE INDEX IF NOT EXISTS idx_raw_headers_duplicate_key ON public.raw_invoice_headers(duplicate_key);
CREATE INDEX IF NOT EXISTS idx_raw_headers_company_date ON public.raw_invoice_headers(company_id, invoice_date);
CREATE INDEX IF NOT EXISTS idx_raw_headers_import_status ON public.raw_invoice_headers(import_status);

-- ============================================================
-- Raw Invoice Items - 原始發票明細 (D 檔)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.raw_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  header_id UUID REFERENCES public.raw_invoice_headers(id) ON DELETE CASCADE,
  invoice_no TEXT NOT NULL,
  invoice_date DATE,
  seq_no INTEGER,                -- 序號
  item_name TEXT,                -- 品名
  qty NUMERIC(15,4),             -- 數量
  unit TEXT,                     -- 單位
  unit_price NUMERIC(15,4),      -- 單價
  amount NUMERIC(15,2),          -- 金額
  item_remark TEXT,              -- 單一欄位備註
  related_no TEXT,               -- 相關號碼
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_items_header_id ON public.raw_invoice_items(header_id);
CREATE INDEX IF NOT EXISTS idx_raw_items_invoice_no ON public.raw_invoice_items(invoice_no);

-- ============================================================
-- Documents - 單據匣
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('camera', 'upload', 'qr', 'email', 'import')) DEFAULT 'camera',
  file_url TEXT,
  thumbnail_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewing', 'confirmed', 'duplicate', 'voided', 'ignored')) DEFAULT 'pending',
  -- 快速識別欄位 (手動填或 OCR 帶入)
  invoice_no TEXT,
  invoice_date DATE,
  vendor_name TEXT,
  vendor_tax_id TEXT,
  amount NUMERIC(15,2),
  -- OCR
  ocr_text TEXT,
  ocr_payload JSONB,
  -- 關聯
  raw_header_id UUID REFERENCES public.raw_invoice_headers(id) ON DELETE SET NULL,
  expense_id UUID,               -- 轉正式支出後的 FK (後面 add constraint)
  -- 其他
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_company_status ON public.documents(company_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON public.documents(uploaded_at DESC);

-- ============================================================
-- Expenses - 正式支出 / 進項
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  raw_header_id UUID REFERENCES public.raw_invoice_headers(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  -- 發票資訊
  invoice_no TEXT,
  expense_date DATE NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_tax_id TEXT,
  -- 金額
  untaxed_amount NUMERIC(15,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL,
  -- 分類與扣抵
  category TEXT CHECK (category IN (
    'purchase_product', 'transportation', 'parking_fuel',
    'stationery_office', 'electronics_equipment', 'repair_consumables',
    'venue_rental', 'appliance_equipment', 'advertising_marketing',
    'other_pending'
  )) DEFAULT 'other_pending',
  deductible_status TEXT CHECK (deductible_status IN ('claimable', 'review', 'non_claimable')) DEFAULT 'review',
  deductible_note TEXT,
  business_purpose TEXT,
  payment_method TEXT CHECK (payment_method IN ('cash', 'credit_card', 'bank_transfer', 'other')),
  project_tag TEXT,
  -- 狀態
  status TEXT NOT NULL CHECK (status IN ('draft', 'confirmed', 'voided')) DEFAULT 'draft',
  -- 稽核
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_company_date ON public.expenses(company_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_deductible ON public.expenses(deductible_status);

-- ============================================================
-- Expense Items - 支出明細
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expense_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  qty NUMERIC(15,4) DEFAULT 1,
  unit TEXT,
  unit_price NUMERIC(15,4),
  amount NUMERIC(15,2) NOT NULL,
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_items_expense_id ON public.expense_items(expense_id);

-- Add FK from documents to expenses (now both tables exist)
ALTER TABLE public.documents
  ADD CONSTRAINT fk_documents_expense FOREIGN KEY (expense_id)
  REFERENCES public.expenses(id) ON DELETE SET NULL;

-- ============================================================
-- Sales Invoices - 銷項發票
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sales_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  raw_header_id UUID REFERENCES public.raw_invoice_headers(id) ON DELETE SET NULL,
  -- 發票資訊
  invoice_no TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  customer_name TEXT,
  customer_tax_id TEXT,
  -- 金額
  untaxed_amount NUMERIC(15,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL,
  -- 狀態
  invoice_status TEXT CHECK (invoice_status IN ('issued', 'void', 'allowance')) DEFAULT 'issued',
  payment_status TEXT CHECK (payment_status IN ('unpaid', 'paid', 'partial')) DEFAULT 'unpaid',
  paid_at DATE,
  -- 其他
  remark TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_company_date ON public.sales_invoices(company_id, invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_no ON public.sales_invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON public.sales_invoices(payment_status);

-- ============================================================
-- Accountant Comments - 會計師註記
-- ============================================================
CREATE TABLE IF NOT EXISTS public.accountant_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('expense', 'sales_invoice', 'document', 'raw_header')),
  target_id UUID NOT NULL,
  comment TEXT NOT NULL,
  status TEXT CHECK (status IN ('info', 'pending_doc', 'pending_confirm', 'resolved')) DEFAULT 'info',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_target ON public.accountant_comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_comments_company ON public.accountant_comments(company_id, created_at DESC);

-- ============================================================
-- Categories - 分類設定 (可自訂)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_invoice_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accountant_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Helper function: get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Users: can see own record
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (id = auth.uid());

-- Companies: users in same company can read; only admin can update
CREATE POLICY "companies_select" ON public.companies FOR SELECT
  USING (id = public.get_user_company_id());
CREATE POLICY "companies_update_admin" ON public.companies FOR UPDATE
  USING (id = public.get_user_company_id() AND public.get_user_role() = 'admin');

-- All company data: same company_id restriction
CREATE POLICY "import_batches_company" ON public.import_batches FOR ALL
  USING (company_id = public.get_user_company_id());

CREATE POLICY "raw_headers_company" ON public.raw_invoice_headers FOR ALL
  USING (company_id = public.get_user_company_id());

CREATE POLICY "raw_items_company" ON public.raw_invoice_items FOR ALL
  USING (header_id IN (SELECT id FROM public.raw_invoice_headers WHERE company_id = public.get_user_company_id()));

CREATE POLICY "documents_company" ON public.documents FOR ALL
  USING (company_id = public.get_user_company_id());

CREATE POLICY "expenses_company" ON public.expenses FOR ALL
  USING (company_id = public.get_user_company_id());

CREATE POLICY "expense_items_company" ON public.expense_items FOR ALL
  USING (expense_id IN (SELECT id FROM public.expenses WHERE company_id = public.get_user_company_id()));

CREATE POLICY "sales_company" ON public.sales_invoices FOR ALL
  USING (company_id = public.get_user_company_id());

CREATE POLICY "comments_company" ON public.accountant_comments FOR ALL
  USING (company_id = public.get_user_company_id());

CREATE POLICY "categories_company" ON public.expense_categories FOR ALL
  USING (company_id = public.get_user_company_id());

-- Accountant: no DELETE on core tables
CREATE POLICY "no_delete_expenses_accountant" ON public.expenses FOR DELETE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "no_delete_sales_accountant" ON public.sales_invoices FOR DELETE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "no_delete_documents_accountant" ON public.documents FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- Functions & Triggers
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_companies BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_raw_headers BEFORE UPDATE ON public.raw_invoice_headers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_documents BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_expenses BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_sales BEFORE UPDATE ON public.sales_invoices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_comments BEFORE UPDATE ON public.accountant_comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed default expense categories
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_company_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.expense_categories (company_id, code, label, is_default, sort_order)
  VALUES
    (p_company_id, 'purchase_product',     '進貨 / 產品',        true, 1),
    (p_company_id, 'transportation',        '交通',               true, 2),
    (p_company_id, 'parking_fuel',          '停車 / 油資',        true, 3),
    (p_company_id, 'stationery_office',     '文具 / 辦公用品',    true, 4),
    (p_company_id, 'electronics_equipment', '3C / 設備',          true, 5),
    (p_company_id, 'repair_consumables',    '修繕 / 耗材',        true, 6),
    (p_company_id, 'venue_rental',          '場租',               true, 7),
    (p_company_id, 'appliance_equipment',   '家電 / 設備',        true, 8),
    (p_company_id, 'advertising_marketing', '廣告 / 行銷',        true, 9),
    (p_company_id, 'other_pending',         '其他待確認',         true, 10)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
