import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'

export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: PageSize
  onPageChange: (p: number) => void
  onPageSizeChange: (ps: PageSize) => void
}

export function SongsPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  // Build page number buttons (max 5 visible)
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const range: (number | '…')[] = []
    const delta = 2
    const left = Math.max(2, page - delta)
    const right = Math.min(totalPages - 1, page + delta)

    range.push(1)
    if (left > 2) range.push('…')
    for (let i = left; i <= right; i++) range.push(i)
    if (right < totalPages - 1) range.push('…')
    range.push(totalPages)
    return range
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t">
      {/* Info + page size */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          Mostrando <span className="font-semibold text-foreground">{from}–{to}</span> de{' '}
          <span className="font-semibold text-foreground">{totalItems}</span>
        </span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1.5">
          Por página:
          <div className="flex items-center gap-1">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                onClick={() => onPageSizeChange(size)}
                className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-colors ${pageSize === size
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground'
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
        </span>
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        <IconButton
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          title="Primeira página"
        >
          <ChevronsLeftIcon className="size-3.5" />
        </IconButton>
        <IconButton
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          title="Página anterior"
        >
          <ChevronLeftIcon className="size-3.5" />
        </IconButton>

        {getPages().map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`size-8 rounded-lg text-xs font-semibold transition-colors ${p === page
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground'
                }`}
            >
              {p}
            </button>
          )
        )}

        <IconButton
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          title="Próxima página"
        >
          <ChevronRightIcon className="size-3.5" />
        </IconButton>
        <IconButton
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          title="Última página"
        >
          <ChevronsRightIcon className="size-3.5" />
        </IconButton>
      </div>
    </div>
  )
}

function IconButton({
  children,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
    >
      {children}
    </button>
  )
}
