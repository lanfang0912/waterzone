'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button, Card, Input, PageHeader, Divider, Modal } from '@/components/ui'
import { toast } from '@/components/ui'
import { getInitials, formatDate } from '@/lib/utils'
import type { User } from '@/types'

interface Props {
  profile: User & { companies?: Record<string, string> | null }
  company: Record<string, string> | null
  accountants: { id: string; name: string; email: string; role: string; created_at: string }[]
  categories: { id: string; code: string; label: string; is_default: boolean; sort_order: number }[]
}

export default function SettingsClient({ profile, company, accountants, categories }: Props) {
  const router = useRouter()
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviting, setInviting] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleInviteAccountant() {
    if (!inviteEmail || !inviteName || !invitePassword) { toast('請填寫所有欄位', 'error'); return }
    if (invitePassword.length < 8) { toast('密碼至少 8 個字元', 'error'); return }
    setInviting(true)

    const supabase = createClient()
    // Sign up the accountant
    const { data, error } = await supabase.auth.signUp({
      email: inviteEmail,
      password: invitePassword,
      options: { data: { name: inviteName, role: 'accountant' } },
    })

    if (error || !data.user) { toast('建立帳號失敗', 'error'); setInviting(false); return }

    // Link to same company
    await supabase.from('users').upsert({
      id: data.user.id,
      name: inviteName,
      email: inviteEmail,
      role: 'accountant',
      company_id: profile.company_id,
    })

    setInviting(false)
    setShowInvite(false)
    setInviteEmail(''); setInviteName(''); setInvitePassword('')
    toast('會計師帳號已建立', 'success')
    router.refresh()
  }

  return (
    <div>
      <PageHeader title="我的 / 設定" />

      <div className="px-4 py-4 space-y-4">
        {/* User profile */}
        <Card className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
            {getInitials(profile.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900">{profile.name}</p>
            <p className="text-sm text-slate-500 truncate">{profile.email}</p>
            <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full mt-1 bg-blue-50 text-blue-700">
              {profile.role === 'admin' ? '管理者' : '會計師'}
            </span>
          </div>
        </Card>

        {/* Company info */}
        {company && (
          <Card>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">公司資料</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">公司名稱</span>
                <span className="text-slate-800 font-medium">{company.company_name}</span>
              </div>
              <Divider />
              <div className="flex justify-between">
                <span className="text-slate-500">統一編號</span>
                <span className="text-slate-800 font-mono">{company.tax_id}</span>
              </div>
              {company.address && (
                <>
                  <Divider />
                  <div className="flex justify-between">
                    <span className="text-slate-500">地址</span>
                    <span className="text-slate-800 text-right max-w-[60%]">{company.address}</span>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Accountant management (admin only) */}
        {profile.role === 'admin' && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">會計師帳號</p>
              <Button size="sm" onClick={() => setShowInvite(true)}>新增</Button>
            </div>
            {accountants.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">尚未新增會計師帳號</p>
            ) : (
              <div className="space-y-3">
                {accountants.map(a => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                      {getInitials(a.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{a.name}</p>
                      <p className="text-xs text-slate-400 truncate">{a.email}</p>
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(a.created_at, 'MM/dd')}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Categories */}
        <Card>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">支出分類</p>
          <div className="space-y-2">
            {categories.map(c => (
              <div key={c.id} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{c.label}</span>
                <span className="text-xs text-slate-400 font-mono">{c.code}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Links */}
        <Card padding="none">
          <Link href="/import" className="flex items-center justify-between px-4 py-3 active:bg-slate-50">
            <span className="text-sm text-slate-700">匯入 M / D 檔</span>
            <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
          <Divider />
          <Link href="/accountant" className="flex items-center justify-between px-4 py-3 active:bg-slate-50">
            <span className="text-sm text-slate-700">會計師協作頁</span>
            <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </Card>

        {/* Logout */}
        <Button variant="outline" className="w-full text-red-500 border-red-100" onClick={handleLogout} loading={loggingOut}>
          登出
        </Button>

        <div className="h-4" />
      </div>

      {/* Invite accountant modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="新增會計師帳號">
        <div className="space-y-3">
          <p className="text-sm text-slate-500">為你的會計師建立一個協作帳號，他們只能查看與留下註記，無法修改系統設定。</p>
          <Input label="姓名" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="會計師姓名" />
          <Input label="Email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="accountant@example.com" />
          <Input label="初始密碼" type="password" value={invitePassword} onChange={e => setInvitePassword(e.target.value)} placeholder="至少 8 個字元" hint="請給會計師這組密碼，他們可以之後自行更改" />
          <Button className="w-full" onClick={handleInviteAccountant} loading={inviting}>建立帳號</Button>
        </div>
      </Modal>
    </div>
  )
}

