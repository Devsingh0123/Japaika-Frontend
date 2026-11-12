export default function PageFallback() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="w-full flex-1 min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-200"
    >
      <div className="relative flex items-center justify-center">
        {/* Breathing ambient glow */}
        <div className="absolute w-16 h-16 rounded-full bg-primary/15 blur-xl animate-pulse" />
        {/* Spinner ring */}
        <div className="w-9 h-9 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        {/* Inner center dot */}
        <div className="absolute w-1.5 h-1.5 rounded-full bg-primary" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}

