"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn, Button } from "@obracerta/ui";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalItems: number;
  baseUrl: string;
}

export function PaginationControls({ page, totalPages, totalItems, baseUrl }: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const createPageUrl = (p: number) => {
    // For app router, we usually construct URLs with the new search param
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}page=${p}`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-border mt-4">
      <div className="text-sm text-muted-foreground">
        Mostrando página <span className="font-bold text-foreground">{page}</span> de <span className="font-bold text-foreground">{totalPages}</span> ({totalItems} itens totais)
      </div>
      <div className="flex items-center gap-1">
        <Link href={createPageUrl(1)} passHref legacyBehavior>
          <Button variant="ghost" size="sm" disabled={page === 1} title="Primeira página" className={cn("px-2", page === 1 && "pointer-events-none opacity-50")}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Link href={createPageUrl(page - 1)} passHref legacyBehavior>
          <Button variant="ghost" size="sm" disabled={page === 1} title="Página anterior" className={cn("px-2", page === 1 && "pointer-events-none opacity-50")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        
        <div className="flex items-center gap-1 mx-2">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            let p = page - 2 + i;
            if (page <= 3) p = i + 1;
            else if (page >= totalPages - 2) p = totalPages - 4 + i;
            
            if (p < 1 || p > totalPages) return null;

            return (
              <Link key={p} href={createPageUrl(p)} passHref legacyBehavior>
                <Button 
                  variant={p === page ? "primary" : "ghost"} 
                  size="sm" 
                  className={cn("w-9 h-9 px-0", p !== page && "hover:bg-muted")}
                >
                  {p}
                </Button>
              </Link>
            );
          })}
        </div>

        <Link href={createPageUrl(page + 1)} passHref legacyBehavior>
          <Button variant="ghost" size="sm" disabled={page === totalPages} title="Próxima página" className={cn("px-2", page === totalPages && "pointer-events-none opacity-50")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href={createPageUrl(totalPages)} passHref legacyBehavior>
          <Button variant="ghost" size="sm" disabled={page === totalPages} title="Última página" className={cn("px-2", page === totalPages && "pointer-events-none opacity-50")}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
