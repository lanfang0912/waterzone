'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, Card } from '@/components/ui'
import { toast } from '@/components/ui'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('密碼至少 8 個字元'); return }
    if (!/^\d{8}$/.test(taxId)) { setError('統一編號須為 8 位數字'); return }

    setLoading(true)
    setError('')

    const supabase = createClient()

    // Sign up
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role: 'admin' } },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? '註冊失敗，請稍後再試')
      setLoading(false)
      return
    }

    // Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({ company_name: companyName, tax_id: taxId, owner_id: data.user.id })
      .select()
      .single()

    if (companyError || !company) {
      setError('公司資料建立失敗，請稍後再試')
      setLoading(false)
      return
    }

    // Link user to company
    await supabase
      .from('users')
      .update({ company_id: company.id })
      .eq('id', data.user.id)

    // Seed default categories
    await supabase.rpc('seed_default_categories', { p_company_id: company.id })

    toast('帳號建立成功！', 'success')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-slate-50 px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-blue-200">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900">建立帳號</h1>
        <p className="text-sm text-slate-500 mt-1">開始整理你的發票</p>
      </div>

      <Card className="w-full max-w-sm">
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">個人資料</p>
          </div>
          <Input label="姓名" value={name} onChange={(e) => setName(e.target.value)} placeholder="王小明" required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
          <Input label="密碼" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 8 個字元" required hint="至少 8 個字元" />

          <div className="pt-2 space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">公司資料</p>
          </div>
          <Input label="公司名稱" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="○○有限公司" required />
          <Input label="統一編號" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="12345678" maxLength={8} required />

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            建立帳號
          </Button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-5">
          已有帳號？{' '}
          <Link href="/login" className="text-blue-600 font-medium">登入</Link>
        </p>
      </Card>
    </div>
  )
}
