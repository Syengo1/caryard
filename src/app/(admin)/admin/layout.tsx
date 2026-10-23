import { cookies } from "next/headers"
import { connection } from "next/server"
import { getCurrentStaff } from "@/lib/auth/roles"
import { SidebarProvider } from "@/components/admin/sidebar-provider"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

// FIX: Ensure the entire /admin tree is securely rendered at request time
export const instant = false

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await connection()
  
  const staff = await getCurrentStaff()
  const cookieStore = await cookies()
  const isCollapsed = cookieStore.get("sidebar-collapsed")?.value === "true"

  return (
    <SidebarProvider defaultCollapsed={isCollapsed}>
      <div className="flex h-screen w-full bg-muted/10 overflow-hidden font-sans">
        <AdminSidebar staff={staff} />
        
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
          <AdminHeader staff={staff} />
          
          <main className="flex-1 overflow-y-auto">
            <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 animate-in fade-in duration-500">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}