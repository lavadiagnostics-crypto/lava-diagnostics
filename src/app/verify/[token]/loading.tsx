import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/misc";

/**
 * Verification lookups hit the database and the rate limiter, so this skeleton
 * is worth the small amount of markup - a blank screen during a lookup reads as
 * a failure to a visitor checking whether a document is genuine.
 */
export default function VerifyLoading() {
  return (
    <>
      <section className="border-b border-border bg-muted/35">
        <div className="container py-12 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-7 w-56 rounded-full" />
                <Skeleton className="mt-5 h-9 w-64" />
                <Skeleton className="mt-4 h-4 w-full max-w-md" />
              </div>
              <Skeleton className="h-[74px] w-44 rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-10">
          <div>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-5 h-[68vh] min-h-[420px] w-full rounded-2xl" />
          </div>

          <div className="space-y-6">
            <Card className="p-7">
              <Skeleton className="h-5 w-40" />
              <div className="mt-6 space-y-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-2.5 w-20" />
                    <Skeleton className="mt-2 h-4 w-36" />
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-7">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="mx-auto mt-6 size-40 rounded-2xl" />
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
