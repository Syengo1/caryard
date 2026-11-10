// src/components/layout/navbar.tsx
import { Suspense } from "react"
import { connection } from "next/server"
import { CarFront } from "lucide-react"
import { getCurrentStaff } from "@/lib/auth/roles"
import { TopNavUI } from "./navigation-client"

function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background h-16">
      <div className="container relative flex h-full items-center justify-between mx-auto max-w-7xl px-4 md:px-8">
        
        {/* Left Side */}
        <div className="flex items-center z-10">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-xs">
              <CarFront className="w-5 h-5" />
            </div>
            {/* Hidden on mobile, visible on desktop */}
            <span className="font-heading font-extrabold text-xl tracking-tight hidden md:inline-block">
              Mota<span className="text-primary">Motors</span>
            </span>
          </div>
        </div>

        {/* Center Placeholder (Mobile Brand Text) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 flex items-center justify-center">
          <span className="font-heading font-extrabold text-[1.35rem] tracking-tight md:hidden">
            Mota<span className="text-primary">Motors</span>
          </span>
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