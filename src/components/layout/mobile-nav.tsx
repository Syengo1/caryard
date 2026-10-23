import { Suspense } from "react"
import { connection } from "next/server"
import { getCurrentStaff } from "@/lib/auth/roles"
import { BottomNavUI } from "./navigation-client"

// A static placeholder that doesn't use usePathname()
function MobileNavSkeleton() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur h-16 md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)]" />
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