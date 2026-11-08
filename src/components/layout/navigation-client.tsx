// src/components/layout/navigation-client.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  CarFront, LayoutDashboard, Settings, Inbox, Home, 
  MapPin, MessageSquare, LogOut, Store, Car, Phone 
} from "lucide-react"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"
import { signOutAction } from "@/lib/actions/auth-actions"
import { cn } from "@/lib/utils"
import type { CurrentStaff } from "@/lib/auth/roles"

interface NavProps {
  staff: CurrentStaff | null
}

export function TopNavUI({ staff }: NavProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith("/admin")

  const publicLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Inventory", href: "/vehicles", icon: CarFront },
    { name: "Showrooms", href: "/showrooms", icon: MapPin },
    { name: "Contact", href: "/contact", icon: MessageSquare },
  ]

  const adminLinks = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Vehicles", href: "/admin/vehicles", icon: Car },
    { name: "Leads", href: "/admin/leads", icon: Inbox },
    { name: "Catalog", href: "/admin/catalog", icon: Store },
    ...(staff?.role === "admin" ? [{ name: "Settings", href: "/admin/settings", icon: Settings }] : []),
  ]

  const links = isAdminRoute ? adminLinks : publicLinks

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background transition-colors duration-200">
      <div className="container relative flex h-16 items-center justify-between mx-auto max-w-7xl px-4 md:px-8">
        
        {/* Left Side: Brand / Logo */}
        <div className="flex items-center z-10">
          <Link href={isAdminRoute ? "/admin" : "/"} className="flex items-center gap-2.5 group">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300">
              <CarFront className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight hidden sm:inline-block">
              Mota<span className="text-primary">Motors</span>
            </span>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links - PERFECTLY CENTERED */}
        <nav className="hidden md:flex items-center gap-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
          {links.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
            return (
              <Link key={link.name} href={link.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "h-10 px-4 rounded-full transition-all duration-300", 
                    isActive 
                      ? "bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium"
                  )}
                >
                  <link.icon className={cn("w-4 h-4 mr-2", isActive ? "text-background" : "text-muted-foreground")} />
                  {link.name}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3 z-10">
          <ThemeToggle />
          
          {staff ? (
            isAdminRoute ? (
              <>
                <Link href="/" className="hidden sm:inline-block">
                  <Button variant="outline" className="rounded-full font-medium h-10 px-5 border-border">Storefront</Button>
                </Link>
                <form action={signOutAction}>
                  <Button variant="ghost" size="icon" type="submit" title="Log out" className="rounded-full w-10 h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                    <LogOut className="w-5 h-5" />
                  </Button>
                </form>
              </>
            ) : (
              <Link href="/admin">
                <Button className="rounded-full shadow-md font-semibold h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/contact" className="hidden lg:inline-block">
                <Button variant="outline" className="rounded-full font-medium h-10 px-5 border-border">
                  <Phone className="w-4 h-4 mr-2" />
                  0700 000 000
                </Button>
              </Link>
              {/* STAFF LOGIN REMOVED */}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export function BottomNavUI({ staff }: NavProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname.startsWith("/admin")

  const publicLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Search", href: "/vehicles", icon: CarFront },
    { name: "Locations", href: "/showrooms", icon: MapPin },
    { name: "Contact", href: "/contact", icon: MessageSquare },
  ]

  const adminLinks = [
    { name: "Home", href: "/admin", icon: LayoutDashboard },
    { name: "Stock", href: "/admin/vehicles", icon: Car },
    { name: "Leads", href: "/admin/leads", icon: Inbox },
    { name: "Catalog", href: "/admin/catalog", icon: Store },
  ]

  const links = isAdminRoute ? adminLinks : publicLinks

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden shadow-[0_-8px_24px_rgba(0,0,0,0.08)] transition-all duration-300">
      <div className="flex items-center justify-around h-[4.5rem] px-2">
        {links.map((link) => {
          const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className="flex flex-col items-center justify-center w-full h-full gap-1.5"
            >
              <div className={cn(
                "flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300",
                isActive ? "bg-primary text-primary-foreground shadow-sm" : "bg-transparent text-muted-foreground hover:bg-muted/50"
              )}>
                <link.icon className={cn("w-5 h-5", isActive && "fill-current/20")} />
              </div>
              <span className={cn(
                "text-[11px] font-semibold transition-colors duration-300", 
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {link.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}