"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <nav className={`flex items-center justify-center gap-2 ${className}`} aria-label="Pagination">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Page précédente"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "primary" : "outline"}
            size="sm"
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Page suivante"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </nav>
  );
}

function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  const pages: (number | "ellipsis")[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Always show first page
  pages.push(1);

  let start = Math.max(2, currentPage - 1);
  let end = Math.min(totalPages - 1, currentPage + 1);

  // Adjust if near start
  if (currentPage <= 3) {
    end = Math.min(totalPages - 1, 4);
  }
  // Adjust if near end
  if (currentPage >= totalPages - 2) {
    start = Math.max(2, totalPages - 3);
  }

  if (start > 2) {
    pages.push("ellipsis");
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages - 1) {
    pages.push("ellipsis");
  }

  // Always show last page
  pages.push(totalPages);

  return pages;
}