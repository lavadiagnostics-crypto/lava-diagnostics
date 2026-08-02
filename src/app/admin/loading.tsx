import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/misc";

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-3 h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="mt-5 h-8 w-24" />
            <Skeleton className="mt-2 h-3 w-28" />
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-0">
        <div className="space-y-px">
          {Array.from({ length: 8 }).map((_, row) => (
            <div key={row} className="flex items-center gap-4 px-6 py-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
