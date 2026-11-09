// src/components/layout/navigation-client.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CarFront,
  LayoutDashboard,
  Settings,
  Inbox,
  Home,
  MapPin,
  MessageSquare,
  LogOut,
  Store,
  Car,
  Phone,
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
    ...(staff?.role === "admin"
      ? [{ name: "Settings", href: "/admin/settings", icon: Settings }]
      : []),
  ]

  const links = isAdminRoute ? adminLinks : publicLinks

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background transition-colors duration-200">
      <div className="container relative flex h-16 items-center justify-between mx-auto max-w-7xl px-4 md:px-8">
        {/* Left Side: Brand / Logo */}
        <div className="flex items-center z-10">
          <Link
            href={isAdminRoute ? "/admin" : "/"}
            className="flex items-center gap-2.5 group"
          >
            <div className="relative bg-primary text-primary-foreground p-2 rounded-xl shadow-xs group-hover:scale-105 transition-transform duration-300">
              <CarFront className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand-red ring-2 ring-background" />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight hidden sm:inline-block">
              Mota<span className="text-primary">Motors</span>
            </span>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links Inside a Soft Tinted Pill Track */}
        <nav className="hidden md:flex items-center gap-1.5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 rounded-full bg-muted/70 border border-border/70 p-1">
          {links.map((link) => {
            const isActive =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
            return (
              <Link key={link.name} href={link.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-9 px-4 rounded-full transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10 font-medium"
                  )}
                >
                  <link.icon
                    className={cn(
                      "w-4 h-4 mr-1.5",
                      isActive ? "text-primary-foreground" : "text-primary/80"
                    )}
                  />
                  {link.name}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2.5 z-10">
          <ThemeToggle />

          {staff ? (
            isAdminRoute ? (
              <>
                <Link href="/" className="hidden sm:inline-block">
                  <Button
                    variant="outline"
                    className="rounded-full font-medium h-9 px-4 border-primary/30 text-primary hover:bg-primary/10"
                  >
                    Storefront
                  </Button>
                </Link>
                <form action={signOutAction}>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="submit"
                    title="Log out"
                    className="rounded-full w-9 h-9 text-muted-foreground hover:text-brand-red hover:bg-brand-red/10"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </form>
              </>
            ) : (
              <Link href="/admin">
                <Button className="rounded-full shadow-xs font-semibold h-9 px-4 bg-brand-red hover:bg-brand-red/90 text-brand-red-foreground">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Dashboard
                </Button>
              </Link>
            )
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/contact" className="hidden lg:inline-block">
                <Button
                  variant="outline"
                  className="rounded-full font-semibold h-9 px-4 border-brand-red/30 bg-secondary/60 text-secondary-foreground hover:bg-brand-red hover:text-brand-red-foreground transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 mr-1.5" />
                  0700 000 000
                </Button>
              </Link>
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-[4.25rem] px-2">
        {links.map((link) => {
          const isActive =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
          return (
            <Link
              key={link.name}
              href={link.href}
              className="flex flex-col items-center justify-center w-full h-full gap-1"
            >
              <div
                className={cn(
                  "relative flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-transparent text-muted-foreground hover:bg-primary/10 hover:text-primary"
                )}
              >
                <link.icon className="w-4 h-4" />
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-brand-red" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10.5px] font-semibold transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}