import Link from "next/link";
// lucide-react throughout: the project already standardises on it, and mixing
// icon families in one tree is worse than the library choice either way.
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, buildGraph, type Crumb } from "@/lib/seo/schema";
import { cn } from "@/lib/utils";

/**
 * Breadcrumb trail.
 *
 * Emits both the visible navigation and the matching BreadcrumbList node, so
 * the hierarchy Google shows in a result and the hierarchy an assistant infers
 * come from the same source of truth.
 */
export function Breadcrumbs({
  crumbs,
  className,
}: {
  crumbs: Crumb[];
  className?: string;
}) {
  return (
    <>
      <JsonLd data={buildGraph([breadcrumbSchema(crumbs)])} />
      <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
        <ol className="flex flex-wrap items-center gap-1.5 text-[13px]">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <li key={crumb.path} className="flex items-center gap-1.5">
                {isLast ? (
                  <span
                    aria-current="page"
                    className="truncate font-medium text-foreground"
                  >
                    {crumb.name}
                  </span>
                ) : (
                  <>
                    <Link
                      href={crumb.path}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {crumb.name}
                    </Link>
                    <ChevronRight
                      className="size-3 shrink-0 text-muted-foreground/50"
                      aria-hidden
                    />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
