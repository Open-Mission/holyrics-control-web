import { cn } from "@/lib/utils"

interface SongPillProps {
  icon: React.ReactNode
  children: React.ReactNode
  highlight?: boolean
  className?: string
}

export function SongPill({
  icon,
  children,
  highlight,
  className
}: SongPillProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors",
        highlight
          ? "bg-primary/10 border-primary/20 text-primary"
          : "bg-muted/60 text-muted-foreground",
        className
      )}
    >
      {icon}
      {children}
    </div>
  )
}
