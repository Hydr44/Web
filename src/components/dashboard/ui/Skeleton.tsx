// src/components/dashboard/ui/Skeleton.tsx
import * as React from "react";

/**
 * Componenti skeleton condivisi per il dashboard. Centralizzati per evitare
 * di replicare la stessa shape `animate-pulse + bg-gray-X` in 26+ pagine.
 *
 * Uso tipico:
 *   <SkeletonHeader />
 *   <SkeletonCard rows={3} />
 *   <SkeletonGrid count={4} />
 */

const base = "bg-gray-200 rounded animate-pulse";

export function SkeletonText({
  width = "w-32",
  height = "h-4",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return <div className={`${base} ${width} ${height} ${className}`} />;
}

/** Header standard: titolo + sottotitolo */
export function SkeletonHeader({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <SkeletonText width="w-48" height="h-8" />
      <SkeletonText width="w-64" height="h-3" />
    </div>
  );
}

/** Card bianca con N righe contenuto */
export function SkeletonCard({
  rows = 2,
  className = "",
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-gray-100 rounded-lg p-6 space-y-4 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <React.Fragment key={i}>
          <SkeletonText width="w-32" height="h-4" />
          <div className={`w-full h-10 bg-gray-50 rounded animate-pulse`} />
        </React.Fragment>
      ))}
    </div>
  );
}

/** Griglia di card (es. lista item / kpi) */
export function SkeletonGrid({
  count = 4,
  cols = 2,
  className = "",
}: {
  count?: number;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  const colsCls = cols === 4 ? "md:grid-cols-4" : cols === 3 ? "md:grid-cols-3" : "md:grid-cols-2";
  return (
    <div className={`grid grid-cols-1 ${colsCls} gap-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 border border-gray-100 bg-white rounded flex items-center gap-3"
        >
          <div className="w-9 h-9 bg-gray-100 rounded animate-pulse shrink-0" />
          <div className="space-y-2 flex-1">
            <SkeletonText width="w-1/2" height="h-4" />
            <SkeletonText width="w-3/4" height="h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Riga di tabella (es. lista fatture/sessioni) */
export function SkeletonRow({ className = "" }: { className?: string }) {
  return (
    <div className={`p-5 bg-white border border-gray-200 rounded animate-pulse ${className}`}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-gray-100 rounded shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

/** Composizione full-page: header + card o griglia (preset comuni) */
export function SkeletonPage({
  variant = "form",
}: {
  variant?: "form" | "list" | "grid";
}) {
  if (variant === "list") {
    return (
      <div className="space-y-6 max-w-3xl">
        <SkeletonHeader />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }
  if (variant === "grid") {
    return (
      <div className="space-y-6">
        <SkeletonHeader />
        <SkeletonGrid count={4} cols={2} />
      </div>
    );
  }
  // form
  return (
    <div className="space-y-6 max-w-2xl">
      <SkeletonHeader />
      <SkeletonCard rows={2} />
    </div>
  );
}
