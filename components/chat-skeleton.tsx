import { Skeleton } from "@/components/ui/skeleton"

export function ChatSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 max-w-2xl">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1">
            <div className="bg-muted rounded-lg p-3">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-3 w-16 mt-1" />
          </div>
        </div>
      ))}
    </div>
  )
}
