import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";

// eslint-disable-next-line react-refresh/only-export-components
export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: PageSize;
  onPageChange: (p: number) => void;
  onPageSizeChange: (ps: PageSize) => void;
}

export function SongsPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const compact = totalPages > 5;

  // Build page number buttons (max 5 visible)
  const getPages = () => {
    if (compact) {
      const range: (number | "…")[] = [];

      if (page > 2) range.push(1);
      if (page > 3) range.push("…");
      if (page > 1) range.push(page - 1);
      range.push(page);
      if (page < totalPages) range.push(page + 1);
      if (page < totalPages - 2) range.push("…");
      if (page < totalPages - 1) range.push(totalPages);

      return Array.from(new Set(range));
    }

    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const range: (number | "…")[] = [];
    const delta = 2;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    range.push(1);
    if (left > 2) range.push("…");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push("…");
    range.push(totalPages);
    return range;
  };

  return (
    <div className="flex flex-col gap-4 border-t pt-3">
      {/* Info + page size */}
      <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="text-center sm:text-left">
          Mostrando{" "}
          <span className="font-semibold text-foreground">
            {from}–{to}
          </span>{" "}
          de <span className="font-semibold text-foreground">{totalItems}</span>
        </span>
        <span className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
          <span>Por pagina:</span>
          <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-start">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                onClick={() => onPageSizeChange(size)}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                  pageSize === size
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </span>
      </div>

      {/* Page controls */}
      <div className="flex flex-wrap items-center justify-center gap-1">
        <IconButton
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          title="Primeira página"
          className="hidden sm:inline-flex"
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
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1 text-xs text-muted-foreground select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`size-8 rounded-lg text-xs font-semibold transition-colors ${
                p === page
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {p}
            </button>
          ),
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
  );
}

function IconButton({
  children,
  disabled,
  onClick,
  title,
  className,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30 inline-flex ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
