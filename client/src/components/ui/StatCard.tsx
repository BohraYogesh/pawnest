
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  description?: string
  iconClassName?: string
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  iconClassName = 'bg-emerald-50 text-emerald-700',
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {description && (
            <p className="mt-2 text-xs text-slate-500">{description}</p>
          )}
        </div>

        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}>
          <Icon size={21} />
        </div>
      </div>
    </article>
  )
}
