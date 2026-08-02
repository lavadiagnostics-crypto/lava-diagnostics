import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/misc";

/** Skeleton matching the dashboard's stat-tiles-plus-panels layout. */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-72" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />

      <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="mt-5 h-8 w-20" />
            <Skeleton className="mt-2 h-3 w-24" />
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {Array.from({ length: 2 }).map((_, panel) => (
          <Card key={panel} className="p-6 sm:p-7">
            <Skeleton className="h-5 w-40" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 4 }).map((_, row) => (
                <div key={row} className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="mt-2 h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
