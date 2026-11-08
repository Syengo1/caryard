// src/components/layout/mobile-nav.tsx
import { Suspense } from "react"
import { connection } from "next/server"
import { getCurrentStaff } from "@/lib/auth/roles"
import { BottomNavUI } from "./navigation-client"

// A static placeholder that doesn't use usePathname()
function MobileNavSkeleton() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/90 backdrop-blur-xl h-[4.5rem] pb-[env(safe-area-inset-bottom)] md:hidden shadow-[0_-8px_24px_rgba(0,0,0,0.08)]" />
  )
}

async function MobileNavDynamic() {
  await connection()
  const staff = await getCurrentStaff()
  return <BottomNavUI staff={staff} />
}

export function MobileNav() {
  return (
    <Suspense fallback={<MobileNavSkeleton />}>
      <MobileNavDynamic />
    </Suspense>
  )
}