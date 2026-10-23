"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, CarFront, LayoutDashboard, Car, Inbox, Store, Settings, LogOut } from "lucide-react"
import { useSidebar } from "./sidebar-provider"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { signOutAction } from "@/lib/actions/auth-actions"
import { cn } from "@/lib/utils"
import type { CurrentStaff } from "@/lib/auth/roles"

export function AdminHeader({ staff }: { staff: CurrentStaff | null }) {
  const pathname = usePathname()
  const { isMobileOpen, setIsMobileOpen } = useSidebar()

  // Generate dynamic breadcrumbs from URL
  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = `/${pathSegments.slice(0, index + 1).join('/')}`
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    return { href, label, isLast: index === pathSegments.length - 1 }
  })

  const mobileLinks = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Inventory", href: "/admin/vehicles", icon: Car },
    { name: "Leads & Inquiries", href: "/admin/leads", icon: Inbox },
    { name: "Catalog", href: "/admin/catalog", icon: Store },
    ...(staff?.role === "admin" ? [{ name: "Settings", href: "/admin/settings", icon: Settings }] : []),
  ]

  return (
    <header className="h-16 flex items-center justify-between px-4 border-b bg-background shrink-0 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        
        {/* Mobile Hamburger Drawer */}
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-muted-foreground">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
            <SheetHeader className="h-16 flex items-center justify-center border-b px-4 text-left">
              <SheetTitle className="flex items-center gap-3 w-full">
                <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                  <CarFront className="w-5 h-5" />
                </div>
                <span className="font-heading font-bold text-lg">Al-Husnain</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {mobileLinks.map((link) => {
                const isActive = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href)
                return (
                  <Link key={link.name} href={link.href} onClick={() => setIsMobileOpen(false)}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-11",
                        isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                      )}
                    >
                      <link.icon className="w-5 h-5 mr-3" />
                      {link.name}
                    </Button>
                  </Link>
                )
              })}
            </nav>
            <div className="p-4 border-t space-y-2">
              <Link href="/">
                <Button variant="outline" className="w-full justify-start h-11 border-dashed">
                  <Store className="w-5 h-5 mr-3" /> Storefront
                </Button>
              </Link>
              <form action={signOutAction}>
                <Button variant="ghost" type="submit" className="w-full justify-start h-11 text-muted-foreground hover:text-destructive">
                  <LogOut className="w-5 h-5 mr-3" /> Sign out
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>

        {/* Dynamic Breadcrumbs */}
        <div className="hidden sm:flex items-center text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.href}>
              {idx > 0 && <span className="mx-2 text-border">/</span>}
              {crumb.isLast ? (
                <span className="font-semibold text-foreground">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="hidden sm:flex items-center gap-2 pl-4 border-l">
          <div className="text-sm text-right">
            <p className="font-medium leading-none text-foreground">{staff?.fullName}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{staff?.role}</p>
          </div>
          <div className="h-9 w-9 bg-primary/10 text-primary rounded-full flex items-center justify-center font-heading font-bold">
            {staff?.fullName?.charAt(0) || "U"}
          </div>
        </div>
      </div>
    </header>
  )
}