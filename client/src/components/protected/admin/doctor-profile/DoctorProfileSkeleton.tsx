const SkeletonBlock = ({ className }: { className: string }) => <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;

export function DoctorProfileSkeleton() {
  return (
    <div className="space-y-5">
      <SkeletonBlock className="h-8 w-40" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <SkeletonBlock className="h-56 w-full" />
          <SkeletonBlock className="h-14 w-full" />
          <SkeletonBlock className="h-72 w-full" />
          <SkeletonBlock className="h-40 w-full" />
        </div>
        <div className="space-y-5">
          <SkeletonBlock className="h-40 w-full" />
          <SkeletonBlock className="h-52 w-full" />
          <SkeletonBlock className="h-44 w-full" />
        </div>
      </div>
    </div>
  );
}
