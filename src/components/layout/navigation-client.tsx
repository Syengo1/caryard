"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  CarFront, LayoutDashboard, Settings, Inbox, Home, 
  MapPin, MessageSquare, LogOut, Store, Car 
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

  // Define route-specific links
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between mx-auto max-w-7xl px-4 md:px-8">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link href={isAdminRoute ? "/admin" : "/"} className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <CarFront className="w-5 h-5" />
            </div>
            <span className="font-heading font-bold text-lg hidden sm:inline-block">
              Mota<span className="text-primary">Motors</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {links.map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
              return (
                <Link key={link.name} href={link.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn("h-9", isActive ? "font-semibold" : "text-muted-foreground")}
                  >
                    <link.icon className="w-4 h-4 mr-2" />
                    {link.name}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {staff ? (
            isAdminRoute ? (
              <>
                <Link href="/" className="hidden sm:inline-block">
                  <Button variant="outline" size="sm">Storefront</Button>
                </Link>
                <form action={signOutAction}>
                  <Button variant="ghost" size="icon" type="submit" title="Log out" className="text-muted-foreground hover:text-destructive">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </form>
              </>
            ) : (
              <Link href="/admin">
                <Button size="sm" className="shadow-sm">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )
          ) : (
            <Link href="/login" className="hidden sm:inline-block">
              <Button variant="ghost" size="sm">Staff Login</Button>
            </Link>
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-16 px-2">
        {links.map((link) => {
          const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <link.icon className={cn("w-5 h-5", isActive && "fill-primary/20")} />
              <span className="text-[10px] font-medium">{link.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}