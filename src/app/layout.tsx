import type { Metadata } from "next"
import { Inter, Outfit } from "next/font/google"
import { ThemeProvider } from "@/components/shared/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

// The highly legible font for UI components and data
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", 
})

// The premium, geometric font for headings and marketing copy
const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "Premium Car Yard | Find Your Next Vehicle",
  description: "Browse high-quality vehicles with transparent pricing.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          {/* This is required for toast.error() messages to appear on screen */}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}