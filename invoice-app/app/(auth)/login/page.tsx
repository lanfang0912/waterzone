'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, Card } from '@/components/ui'
import { toast } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('帳號或密碼錯誤，請再試一次')
      setLoading(false)
      return
    }

    toast('登入成功', 'success')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-slate-50 px-5 py-10">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-blue-200">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900">發票整理系統</h1>
        <p className="text-sm text-slate-500 mt-1">一人公司財務助手</p>
      </div>

      <Card className="w-full max-w-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">登入帳號</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            autoComplete="email"
          />
          <Input
            label="密碼"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            登入
          </Button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-5">
          還沒有帳號？{' '}
          <Link href="/register" className="text-blue-600 font-medium">
            立即註冊
          </Link>
        </p>
      </Card>
    </div>
  )
}
