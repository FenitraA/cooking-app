"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  previousLabel?: string;
  nextLabel?: string;
  showIcons?: boolean;
};

export default function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
  previousLabel = "Previous",
  nextLabel = "Next",
  showIcons = true,
}: PaginationProps) {
  const generatePages = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center flex-nowrap min-w-max">
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="
          flex items-center gap-2 
          h-9 sm:h-10
          px-2 sm:px-3 rounded-l-xl
          border border-white/20
        bg-white/10
          text-white/80
          backdrop-blur-sm
          transition-all
          hover:bg-white/10
          disabled:cursor-not-allowed
          disabled:opacity-40
          cursor-pointer
        "
      >
        {showIcons && <ChevronLeft size={18} />}
        <span className="hidden sm:inline">{previousLabel}</span>
      </button>

      {/* Pages */}
      {generatePages().map((page, index) =>
        page === "..." ? (
          <div key={`dots-${index}`} className="px-2 text-white/50 text-sm">
            ...
          </div>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(Number(page))}
            className={`
              h-9 sm:h-10
              min-w-9 sm:min-w-10
              px-2 sm:px-3
              text-sm font-medium
              transition-all
              cursor-pointer
              border
              ${
                currentPage === page
                  ? `
                    text-white
                    shadow-md
                    bg-custom-sand-dune/50
                    border-white/20
                  `
                  : `
                    bg-white/10
                    border-white/20
                    text-white/80
                    hover:bg-white/10
                  `
              }
            `}
          >
            {page}
          </button>
        ),
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="
          flex items-center gap-2
          h-9 sm:h-10
          px-2 sm:px-3 rounded-r-xl
          border border-white/20
        bg-white/10
          text-white/80
          backdrop-blur-sm
          transition-all
          hover:bg-white/10
          disabled:opacity-40
          disabled:cursor-not-allowed
          cursor-pointer
        "
      >
        <span className="hidden sm:inline">{nextLabel}</span>
        {showIcons && <ChevronRight size={18} />}
      </button>
    </div>
  );
}
