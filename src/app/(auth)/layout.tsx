import Link from "next/link"
import { CarFront, ArrowLeft } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left Side - The Login Form */}
      <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24 bg-background relative">
        <Link 
          href="/" 
          className="absolute top-8 left-8 sm:left-12 flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to website
        </Link>
        
        <div className="mx-auto w-full max-w-sm">
          {children}
        </div>
      </div>

      {/* Right Side - Premium Branding Banner */}
      <div className="hidden md:flex flex-col justify-center items-center bg-muted/30 border-l relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-md px-4">
          <div className="bg-background p-4 rounded-2xl shadow-sm border">
            <div className="bg-primary text-primary-foreground p-3 rounded-xl">
              <CarFront className="w-10 h-10" />
            </div>
          </div>
          <h2 className="text-3xl font-heading font-bold text-foreground">
            MotaMotors
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Secure staff portal for managing inventory, tracking leads, and updating showroom operations.
          </p>
        </div>
      </div>
    </div>
  )
}