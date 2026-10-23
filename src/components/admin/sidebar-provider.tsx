"use client"

import React, { createContext, useContext, useState } from "react"
import { LazyMotion, domAnimation } from "framer-motion"

type SidebarContextType = {
  isCollapsed: boolean
  toggleSidebar: () => void
  isMobileOpen: boolean
  setIsMobileOpen: (isOpen: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ 
  children,
  defaultCollapsed = false
}: { 
  children: React.ReactNode
  defaultCollapsed?: boolean
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      // Save state to a cookie so the Server Component can read it instantly on next refresh
      document.cookie = `sidebar-collapsed=${next}; path=/; max-age=31536000; SameSite=Lax`
      return next
    })
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, isMobileOpen, setIsMobileOpen }}>
      <LazyMotion features={domAnimation}>
        {children}
      </LazyMotion>
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider")
  return context
}