import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { BRAND, FOOTER_NAV } from "@/lib/constants";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-28 border-t border-border bg-muted/35">
      <div className="container py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-5 text-pretty text-sm leading-relaxed text-muted-foreground">
              {BRAND.name} is an independent analytical laboratory. We hold no
              ownership stake in, and take no commission from, any manufacturer
              or distributor of research peptides.
            </p>

            <address className="mt-7 space-y-3 text-sm not-italic text-muted-foreground">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-lava-500" aria-hidden />
                <span>
                  {BRAND.address.line1}
                  <br />
                  {BRAND.address.line2}
                  <br />
                  {BRAND.address.city}, {BRAND.address.state}{" "}
                  {BRAND.address.postalCode}
                </span>
              </div>
              <div className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-lava-500" aria-hidden />
                <a
                  href={`mailto:${BRAND.email}`}
                  className="transition-colors hover:text-foreground"
                >
                  {BRAND.email}
                </a>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-lava-500" aria-hidden />
                <a
                  href={`tel:${BRAND.phone.replace(/[^\d+]/g, "")}`}
                  className="transition-colors hover:text-foreground"
                >
                  {BRAND.phone}
                </a>
              </div>
            </address>
          </div>

          {FOOTER_NAV.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3 className="overline mb-5">{group.title}</h3>
              <ul className="space-y-3.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 border-t border-border pt-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <p className="text-xs leading-relaxed text-muted-foreground">
              © {year} {BRAND.name}. All rights reserved.
              <br className="sm:hidden" />
              <span className="hidden sm:inline"> · </span>
              {BRAND.hours}
            </p>
            <p className="max-w-lg text-xs leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">
                Research use only.
              </strong>{" "}
              All analytical services are provided for laboratory research
              purposes. Nothing on this site is intended for human or veterinary
              use, and no result constitutes a safety or fitness-for-purpose
              assessment.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
