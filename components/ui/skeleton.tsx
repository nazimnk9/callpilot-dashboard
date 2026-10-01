import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('skeleton-shimmer rounded-xl bg-blue-50 dark:bg-white/5', className)}
      {...props}
    />
  )
}

export { Skeleton }
