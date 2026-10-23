import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { MobileNav } from "@/components/layout/mobile-nav"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Desktop & Tablet Top Navbar */}
      <Navbar />
      
      {/* Main Content Area - Expands to fill available space */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      
      <Footer />

      {/* Floating Bottom App Bar - Visible only on mobile/foldables */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  )
}