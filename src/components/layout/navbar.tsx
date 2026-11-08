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
        <div className="flex items-center z-10">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-xs">
              <CarFront className="w-5 h-5" />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight hidden sm:inline-block">
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