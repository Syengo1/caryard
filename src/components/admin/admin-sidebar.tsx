"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { m } from "framer-motion"
import { 
  CarFront, LayoutDashboard, Car, Inbox, Store, 
  Settings, ChevronLeft, ChevronRight, LogOut 
} from "lucide-react"
import { useSidebar } from "./sidebar-provider"
import { Button } from "@/components/ui/button"
import { signOutAction } from "@/lib/actions/auth-actions"
import { cn } from "@/lib/utils"
import type { CurrentStaff } from "@/lib/auth/roles"

const navItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Inventory", href: "/admin/vehicles", icon: Car },
  { name: "Leads & Inquiries", href: "/admin/leads", icon: Inbox },
  { name: "Catalog", href: "/admin/catalog", icon: Store },
]

export function AdminSidebar({ staff }: { staff: CurrentStaff | null }) {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar } = useSidebar()

  const links = [...navItems]
  if (staff?.role === "admin") {
    links.push({ name: "Settings", href: "/admin/settings", icon: Settings })
  }

  return (
    <m.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden md:flex flex-col h-screen border-r bg-background shrink-0 sticky top-0"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b shrink-0">
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md shrink-0">
            <CarFront className="w-5 h-5" />
          </div>
          <m.span 
            animate={{ opacity: isCollapsed ? 0 : 1, display: isCollapsed ? "none" : "block" }}
            className="font-heading font-bold text-lg"
          >
            Al-Husnain
          </m.span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground hidden md:flex"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 flex flex-col">
        {links.map((link) => {
          const isActive = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href)
          
          return (
            <Link key={link.name} href={link.href} className="group relative">
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-10 transition-colors",
                  isCollapsed ? "px-0 justify-center" : "px-3",
                  isActive ? "bg-primary/10 text-primary font-medium hover:bg-primary/15" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <link.icon className={cn("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4 mr-3")} />
                <m.span
                  animate={{ opacity: isCollapsed ? 0 : 1, display: isCollapsed ? "none" : "block" }}
                  className="truncate"
                >
                  {link.name}
                </m.span>
              </Button>

              {/* Custom CSS Tooltip for Collapsed State */}
              {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1.5 bg-foreground text-background text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {link.name}
                </div>
              )}
            </Link>
          )
        })}

        <div className="mt-auto pt-4 space-y-1.5">
          <Link href="/" className="group relative">
            <Button variant="outline" className={cn("w-full h-10", isCollapsed ? "px-0 justify-center border-dashed" : "justify-start px-3")}>
              <Store className={cn("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4 mr-3")} />
              <m.span animate={{ opacity: isCollapsed ? 0 : 1, display: isCollapsed ? "none" : "block" }}>Storefront</m.span>
            </Button>
          </Link>
          <form action={signOutAction} className="group relative">
            <Button variant="ghost" type="submit" className={cn("w-full h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10", isCollapsed ? "px-0 justify-center" : "justify-start px-3")}>
              <LogOut className={cn("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4 mr-3")} />
              <m.span animate={{ opacity: isCollapsed ? 0 : 1, display: isCollapsed ? "none" : "block" }}>Sign out</m.span>
            </Button>
          </form>
        </div>
      </nav>
    </m.aside>
  )
}