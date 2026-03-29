'use client'

import Link from 'next/link'
import { Card, StatCard, Badge } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Document, DashboardStats } from '@/types'
import { DOCUMENT_STATUS_LABELS } from '@/types'

interface Props {
  stats: DashboardStats
  recentDocuments: Partial<Document>[]
  userName: string
  companyName: string
  yearMonth: { year: number; month: number }
}

export default function HomeClient({ stats, recentDocuments, userName, companyName, yearMonth }: Props) {
  const { year, month } = yearMonth

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-slate-100">
        <p className="text-xs text-slate-400">{companyName}</p>
        <h1 className="text-xl font-bold text-slate-900">嗨，{userName} 👋</h1>
        <p className="text-sm text-slate-400 mt-0.5">{year} 年 {month} 月</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Pending alert */}
        {stats.pendingDocuments > 0 && (
          <Link href="/documents?status=pending">
            <Card className="bg-amber-50 border border-amber-100 flex items-center gap-3" padding="sm">
              <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800">
                  {stats.pendingDocuments} 筆單據待整理
                </p>
                <p className="text-xs text-amber-600">點此查看 →</p>
              </div>
            </Card>
          </Link>
        )}

        {/* Accountant alert */}
        {stats.pendingAccountantItems > 0 && (
          <Link href="/accountant">
            <Card className="bg-violet-50 border border-violet-100 flex items-center gap-3" padding="sm">
              <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <svg className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-violet-800">
                  會計師有 {stats.pendingAccountantItems} 筆待確認
                </p>
                <p className="text-xs text-violet-600">點此查看 →</p>
              </div>
            </Card>
          </Link>
        )}

        {/* Stats Grid */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">本月概況</p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="支出總額"
              value={formatCurrency(stats.monthlyExpenseTotal)}
              sub="已確認支出"
              color="blue"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="可扣抵稅額"
              value={formatCurrency(stats.monthlyTaxDeductible)}
              sub="進項稅額"
              color="emerald"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01" />
                </svg>
              }
            />
            <StatCard
              label="銷項總額"
              value={formatCurrency(stats.monthlySalesTotal)}
              sub="已開立發票"
              color="amber"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
            <StatCard
              label="待整理單據"
              value={stats.pendingDocuments}
              sub="尚未處理"
              color="slate"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">快速操作</p>
          <div className="grid grid-cols-3 gap-3">
            <Link href="/scan">
              <Card className="flex flex-col items-center gap-2 py-4 active:bg-slate-50" padding="none">
                <div className="h-11 w-11 rounded-2xl gradient-primary flex items-center justify-center shadow-sm shadow-blue-200">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-700 text-center leading-tight">拍照收單</span>
              </Card>
            </Link>
            <Link href="/import">
              <Card className="flex flex-col items-center gap-2 py-4 active:bg-slate-50" padding="none">
                <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-700 text-center leading-tight">匯入發票</span>
              </Card>
            </Link>
            <Link href="/expenses?view=monthly">
              <Card className="flex flex-col items-center gap-2 py-4 active:bg-slate-50" padding="none">
                <div className="h-11 w-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-700 text-center leading-tight">本月報表</span>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent documents */}
        {recentDocuments.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">最近新增</p>
              <Link href="/documents" className="text-xs text-blue-600 font-medium">查看全部</Link>
            </div>
            <div className="space-y-2">
              {recentDocuments.map((doc) => (
                <Link key={doc.id} href={`/documents/${doc.id}`}>
                  <Card padding="sm" className="flex items-center gap-3 active:bg-slate-50">
                    {/* Thumbnail or icon */}
                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {doc.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={doc.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {doc.vendor_name ?? doc.invoice_no ?? '未命名單據'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(doc.invoice_date ?? doc.uploaded_at)}
                        {doc.amount ? ` · ${formatCurrency(doc.amount)}` : ''}
                      </p>
                    </div>
                    <Badge variant={doc.status as 'pending'}>
                      {DOCUMENT_STATUS_LABELS[doc.status as keyof typeof DOCUMENT_STATUS_LABELS] ?? doc.status}
                    </Badge>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
