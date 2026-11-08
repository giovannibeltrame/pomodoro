export function Bar({ value, className, height = 'h-2' }: { value: number; className: string; height?: string }) {
  return (
    <div className={`${height} w-full bg-surface-container-highest rounded-full overflow-hidden`}>
      <div className={`h-full rounded-full transition-all duration-700 ${className}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}
