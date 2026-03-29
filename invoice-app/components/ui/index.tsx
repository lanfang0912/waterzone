import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ─── Button ────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none tap-highlight select-none'
    const variants = {
      primary:   'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
      secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
      ghost:     'text-slate-600 hover:bg-slate-100',
      danger:    'bg-red-500 text-white hover:bg-red-600',
      outline:   'border border-slate-200 text-slate-700 hover:bg-slate-50 bg-white',
    }
    const sizes = {
      sm:   'text-sm px-3 py-1.5 h-8',
      md:   'text-sm px-4 py-2 h-10',
      lg:   'text-base px-5 py-3 h-12',
      icon: 'h-10 w-10 p-0',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ─── Card ───────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'md', children, ...props }, ref) => {
    const pads = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-5' }
    return (
      <div ref={ref} className={cn('bg-white rounded-2xl card-shadow', pads[padding], className)} {...props}>
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

// ─── Badge ──────────────────────────────────────────────────
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'pending' | 'reviewing' | 'confirmed' | 'duplicate' | 'voided' | 'ignored' |
            'claimable' | 'review' | 'non_claimable' | 'info' | 'warning' | 'error' |
            'paid' | 'unpaid'
}

export const Badge = ({ className, variant = 'info', children, ...props }: BadgeProps) => {
  const variants: Record<string, string> = {
    pending:       'bg-amber-50 text-amber-800 border-amber-100',
    reviewing:     'bg-violet-50 text-violet-800 border-violet-100',
    confirmed:     'bg-emerald-50 text-emerald-800 border-emerald-100',
    duplicate:     'bg-red-50 text-red-800 border-red-100',
    voided:        'bg-slate-100 text-slate-500 border-slate-200',
    ignored:       'bg-slate-50 text-slate-400 border-slate-100',
    claimable:     'bg-emerald-50 text-emerald-800 border-emerald-100',
    review:        'bg-amber-50 text-amber-800 border-amber-100',
    non_claimable: 'bg-red-50 text-red-700 border-red-100',
    info:          'bg-blue-50 text-blue-800 border-blue-100',
    warning:       'bg-amber-50 text-amber-800 border-amber-100',
    error:         'bg-red-50 text-red-800 border-red-100',
    paid:          'bg-emerald-50 text-emerald-800 border-emerald-100',
    unpaid:        'bg-slate-100 text-slate-600 border-slate-200',
  }
  return (
    <span
      className={cn('inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border', variants[variant] ?? variants.info, className)}
      {...props}
    >
      {children}
    </span>
  )
}

// ─── Input ──────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2.5 rounded-xl border text-sm bg-white text-slate-900 placeholder:text-slate-400 transition-colors',
            error ? 'border-red-400 focus:outline-red-400' : 'border-slate-200',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ─── Textarea ───────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2.5 rounded-xl border text-sm bg-white text-slate-900 placeholder:text-slate-400 transition-colors resize-none',
            error ? 'border-red-400' : 'border-slate-200',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

// ─── Select ─────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const inputId = id ?? label
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2.5 rounded-xl border text-sm bg-white text-slate-900 transition-colors appearance-none',
            error ? 'border-red-400' : 'border-slate-200',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

// ─── Divider ────────────────────────────────────────────────
export const Divider = ({ className }: { className?: string }) => (
  <hr className={cn('border-t border-slate-100', className)} />
)

// ─── EmptyState ─────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    {icon && <div className="text-slate-300 mb-4">{icon}</div>}
    <p className="text-slate-600 font-medium">{title}</p>
    {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

// ─── Skeleton ───────────────────────────────────────────────
export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse bg-slate-100 rounded-xl', className)} />
)

// ─── Modal ──────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'full'
}

export const Modal = ({ open, onClose, title, children, size = 'md' }: ModalProps) => {
  if (!open) return null
  const sizes = {
    sm:   'max-w-sm',
    md:   'max-w-lg',
    full: 'max-w-full h-full rounded-none',
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className={cn(
          'relative bg-white rounded-t-3xl sm:rounded-2xl w-full animate-slide-up shadow-xl',
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-0">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-5 pt-4">{children}</div>
        <div className="safe-bottom" />
      </div>
    </div>
  )
}

// ─── PageHeader ─────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  subtitle?: string
  right?: React.ReactNode
  back?: () => void
}

export const PageHeader = ({ title, subtitle, right, back }: PageHeaderProps) => (
  <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-3">
    <div className="flex items-center gap-3">
      {back && (
        <button onClick={back} className="p-1 -ml-1 rounded-lg hover:bg-slate-100">
          <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
    </div>
  </div>
)

// ─── StatCard ───────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: 'blue' | 'emerald' | 'amber' | 'slate'
  icon?: React.ReactNode
}

export const StatCard = ({ label, value, sub, color = 'blue', icon }: StatCardProps) => {
  const colors = {
    blue:    'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50 text-amber-600',
    slate:   'bg-slate-100 text-slate-500',
  }
  return (
    <Card className="flex-1 min-w-0" padding="sm">
      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-2', colors[color])}>
        {icon}
      </div>
      <p className="text-xs text-slate-500 truncate">{label}</p>
      <p className="text-lg font-bold text-slate-900 truncate">{value}</p>
      {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
    </Card>
  )
}

// Toast and ToastProvider are in ./ToastProvider.tsx (client component)
export { toast, ToastProvider } from './ToastProvider'

