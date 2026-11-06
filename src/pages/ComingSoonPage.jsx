import { Link, useRouteError } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Compass } from "lucide-react"

export default function NotFoundPage() {
  const error = useRouteError()
  if (error) {
    console.error("Caught route error:", error)
  }
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-4">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
        <Compass className="w-6 h-6" />
      </div>
      <h1 className="text-3xl font-bold">Coming Soon - Stars Are Aligning</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        We are preparing something special for you. This feature will be live soon!
      </p>
      <Button asChild className="mt-2">
        <Link to="/">Return to Home</Link>
      </Button>
    </div>
  )
}
