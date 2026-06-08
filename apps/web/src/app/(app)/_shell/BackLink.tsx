import Link from "next/link";
import { ChevronLeftIcon } from "./icons";

/** Link de voltar para uma listagem (cabeçalho das telas de detalhe). */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-ml-1 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeftIcon className="h-4 w-4" />
      {label}
    </Link>
  );
}
