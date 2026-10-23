import { Suspense } from "react"
import { connection } from "next/server"
import { CarFront } from "lucide-react"
import { getCurrentStaff } from "@/lib/auth/roles"
import { TopNavUI } from "./navigation-client"

// A static placeholder that doesn't use usePathname() to prevent build crashes
function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-16">
      <div className="container flex h-16 items-center justify-between mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <CarFront className="w-5 h-5" />
            </div>
            <span className="font-heading font-bold text-lg hidden sm:inline-block">
              Mota<span className="text-primary">Motors</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

async function NavbarDynamic() {
  await connection()
  const staff = await getCurrentStaff()
  return <TopNavUI staff={staff} />
}

export function Navbar() {
  return (
    <Suspense fallback={<NavbarSkeleton />}>
      <NavbarDynamic />
    </Suspense>
  )
}