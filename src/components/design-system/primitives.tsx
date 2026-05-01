import { SearchIcon, XIcon, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function AppPage({
  className,
  narrow = false,
  ...props
}: React.ComponentProps<"section"> & { narrow?: boolean }) {
  return (
    <section
      className={cn("app-page", narrow && "app-page--narrow", className)}
      {...props}
    />
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {eyebrow ? <span className="app-kicker">{eyebrow}</span> : null}
        <div className="flex flex-col gap-2">
          <h1 className="app-title">{title}</h1>
          {description ? <p className="app-copy">{description}</p> : null}
        </div>
        {meta ? (
          <div className="flex flex-wrap items-center gap-2">{meta}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

export function SectionBlock({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {title || description || action ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            {title ? (
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            ) : null}
            {description ? (
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {action ? (
            <div className="flex items-center gap-2">{action}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function SurfaceCard({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn("app-surface rounded-2xl border", className)}
      {...props}
    />
  );
}

export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon: LucideIcon;
  tone?: "neutral" | "primary";
}) {
  return (
    <SurfaceCard size="sm" className="gap-4">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center justify-between gap-3 text-sm font-medium text-muted-foreground">
          <span>{label}</span>
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-xl border",
              tone === "primary"
                ? "border-primary/15 bg-primary/10 text-primary"
                : "border-border/60 bg-muted/70 text-muted-foreground",
            )}
          >
            <Icon />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="text-2xl font-semibold tracking-tight md:text-3xl">
          {value}
        </div>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </SurfaceCard>
  );
}

export function StatusChip({
  children,
  tone = "neutral",
  className,
}: React.ComponentProps<"span"> & {
  tone?: "neutral" | "primary" | "success";
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
        tone === "primary" && "border-primary/20 bg-primary/10 text-primary",
        tone === "success" &&
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        tone === "neutral" && "bg-background/70 text-muted-foreground",
        className,
      )}
    >
      {children}
    </Badge>
  );
}

export function ToolbarRow({
  className,
  children,
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border app-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SearchToolbar({
  value,
  onValueChange,
  onClear,
  placeholder,
  resultLabel,
  actions,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onClear?: () => void;
  placeholder: string;
  resultLabel?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col lg:gap-0 lg:items-start", className)}>
      <InputGroup className="app-surface h-10 border">
        <InputGroupAddon align="inline-start">
          <InputGroupText>
            <SearchIcon />
          </InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
        />
        {value ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              variant="ghost"
              size="icon-xs"
              onClick={onClear}
              className="text-muted-foreground"
            >
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
      {resultLabel || actions ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-1">
          <div className="flex items-center">{resultLabel}</div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function EmptyStateSection({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Empty className={cn("app-surface rounded-2xl border py-16", className)}>
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="size-14 rounded-2xl border border-primary/15 bg-primary/10 text-primary"
        >
          <Icon className="size-6" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

export function SplitPanelSection({
  primary,
  secondary,
  className,
}: {
  primary: React.ReactNode;
  secondary: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("app-section-grid", className)}>
      {primary}
      {secondary}
    </div>
  );
}
