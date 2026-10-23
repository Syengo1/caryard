import Link from "next/link"
import { CarFront, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
      <div className="bg-muted p-4 rounded-full">
        <CarFront className="w-12 h-12 text-muted-foreground" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-4xl font-heading font-bold tracking-tight text-foreground">
          404 - Page Not Found
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          We couldn&apos;t find the page you&apos;re looking for. The vehicle may have been sold, or the link might be broken.
        </p>
      </div>

      <Link href="/">
        <Button size="lg" className="mt-4">
          <Home className="w-4 h-4 mr-2" />
          Back to Showroom
        </Button>
      </Link>
    </div>
  )
}