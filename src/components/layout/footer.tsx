import Link from "next/link"
import { CarFront, MapPin, Phone, Mail, Clock, Globe, Share2, MessageCircle } from "lucide-react"

export async function Footer() {
  "use cache"
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-muted/30">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
          
          {/* Column 1: Brand & About */}
          <div className="space-y-5">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                <CarFront className="w-5 h-5" />
              </div>
              <span className="font-heading font-bold text-xl">
                Mota<span className="text-primary">Motors</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed pr-4">
              Kenya&apos;s trusted importer of premium, foreign-used, and brand new vehicles. Delivering quality, transparency, and value in every drive.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <a href="#" aria-label="Website" className="text-muted-foreground hover:text-primary transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" aria-label="WhatsApp" className="text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Socials" className="text-muted-foreground hover:text-primary transition-colors">
                <Share2 className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-5">
            <h3 className="font-heading font-semibold text-foreground text-base">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/vehicles" className="text-muted-foreground hover:text-primary transition-colors">Browse Inventory</Link>
              </li>
              <li>
                <Link href="/showrooms" className="text-muted-foreground hover:text-primary transition-colors">Our Showrooms</Link>
              </li>
              <li>
                <Link href="/financing" className="text-muted-foreground hover:text-primary transition-colors">Financing Calculator</Link>
              </li>
              <li>
                <Link href="/trade-in" className="text-muted-foreground hover:text-primary transition-colors">Trade-In Valuation</Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Popular Categories */}
          <div className="space-y-5">
            <h3 className="font-heading font-semibold text-foreground text-base">Popular Categories</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/vehicles?category=uber-ready" className="text-muted-foreground hover:text-primary transition-colors">Uber Ready</Link>
              </li>
              <li>
                <Link href="/vehicles?category=family-cars" className="text-muted-foreground hover:text-primary transition-colors">Family 7-Seaters</Link>
              </li>
              <li>
                <Link href="/vehicles?category=luxury" className="text-muted-foreground hover:text-primary transition-colors">Premium &amp; Luxury</Link>
              </li>
              <li>
                <Link href="/vehicles?category=off-road" className="text-muted-foreground hover:text-primary transition-colors">4WD &amp; Off-Road</Link>
              </li>
              <li>
                <Link href="/vehicles?category=hybrids" className="text-muted-foreground hover:text-primary transition-colors">Hybrids &amp; EVs</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div className="space-y-5">
            <h3 className="font-heading font-semibold text-foreground text-base">Flagship Showroom</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span className="leading-tight">Ngong Road, Nairobi<br />Kenya</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0 text-primary" />
                <span>+254 700 000 000</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0 text-primary" />
                <span>sales@motamotors.co.ke</span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground">
                <Clock className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <span className="leading-tight">Mon - Sat: 8:00 AM - 6:00 PM<br />Sun: Closed</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="border-t bg-muted/50">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            &copy; {currentYear} MotaMotors. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/admin" className="hover:text-foreground transition-colors">Staff Login</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}