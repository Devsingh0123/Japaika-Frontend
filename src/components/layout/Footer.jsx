import { Link } from "react-router-dom"
import { QrCode, Sun, Moon } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"

const SOCIAL_LINKS = [
  { name: "LinkedIn", url: "https://www.linkedin.com" },
  { name: "Facebook", url: "https://www.facebook.com" },
  { name: "Instagram", url: "https://instagram.com" },
  { name: "X", url: "https://twitter.com" },
  { name: "YouTube", url: "https://youtube.com" },
  { name: "Quora", url: "https://quora.com" },
]

export default function Footer() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <footer className="w-full border-t border-border bg-card/70 backdrop-blur-xl text-muted-foreground mt-8 sm:mt-16 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Socials Column - Full width on mobile, 1 col on md+ */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <img
                src="/japaikaLogo.svg"
                alt=""
                className="w-9 h-9 object-contain shrink-0 group-hover:scale-105 transition-transform"
              />
              <img
                src="/japaikaName.svg"
                alt="Japaika"
                className="h-6 w-auto object-contain select-none"
              />
            </Link>

            <p className="text-xs text-muted-foreground leading-relaxed">
              World’s Most Accurate Astrology Engine.
            </p>

            {/* Social Links as touch-friendly badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-accent/40 hover:bg-accent border border-border/50 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs"
                >
                  {social.name}
                </a>
              ))}
            </div>
          </div>

          {/* Company Column - 1 col on mobile and md+ */}
          <div className="col-span-1 space-y-3">
            <p className="text-xs font-semibold text-foreground font-mono tracking-wider uppercase">
              Company
            </p>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/jobs" className="hover:text-foreground transition-colors">
                  Join Us
                </Link>
              </li>
              <li>
                <Link to="/review" className="hover:text-foreground transition-colors">
                  Add a Review
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Legal Column - 1 col on mobile and md+ */}
          <div className="col-span-1 space-y-3">
            <p className="text-xs font-semibold text-foreground font-mono tracking-wider uppercase">
              Help & Legal
            </p>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/faq" className="hover:text-foreground transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="hover:text-foreground transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-foreground transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="hover:text-foreground transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          {/* App Downloads & QR Code Column - Full width on mobile, 1 col on md+ */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <p className="text-xs font-semibold text-foreground font-mono tracking-wider uppercase">
              Mobile App
            </p>
            <div className="flex items-center gap-3">
              {/* QR Code only on tablet / desktop */}
              <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-card/80 border border-border/80 items-center justify-center text-primary shadow-xs shrink-0">
                <QrCode className="w-10 h-10 text-primary" />
              </div>

              {/* Side-by-side on mobile, stacked on desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5 w-full sm:w-auto">
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noreferrer"
                  className="block px-3.5 py-2 rounded-xl bg-card/80 hover:bg-card border border-border/80 hover:border-primary/40 text-[10px] text-foreground transition-all shadow-xs text-center sm:text-left"
                >
                  <span className="block text-[8px] text-muted-foreground uppercase tracking-wide">
                    Download From
                  </span>
                  <span className="font-semibold text-xs">App Store</span>
                </a>
                <a
                  href="https://play.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="block px-3.5 py-2 rounded-xl bg-card/80 hover:bg-card border border-border/80 hover:border-primary/40 text-[10px] text-foreground transition-all shadow-xs text-center sm:text-left"
                >
                  <span className="block text-[8px] text-muted-foreground uppercase tracking-wide">
                    Download From
                  </span>
                  <span className="font-semibold text-xs">Play Store</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Theme Toggle */}
        <div className="mt-8 sm:mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="text-center sm:text-left font-mono">
            © 2026 Japaika Technologies Private Limited
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-border bg-card/80 hover:bg-card hover:border-primary/50 text-foreground transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md backdrop-blur-md group"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                <span className="text-xs font-sans font-medium">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:-rotate-12 transition-transform duration-300" />
                <span className="text-xs font-sans font-medium">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  )
}
