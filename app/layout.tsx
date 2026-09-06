import type { Metadata } from 'next'
import Script from 'next/script'
import { Manjari, Playfair_Display } from 'next/font/google'
import './globals.css'

/*
 * Polices de la charte, auto-hébergées par next/font : téléchargées au build et
 * servies depuis les assets statiques, sans appel à Google à l'exécution.
 * Les variables CSS sont reprises dans `@theme` (globals.css).
 */
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

const manjari = Manjari({
  subsets: ['latin'],
  weight: ['100', '400', '700'],
  variable: '--font-manjari',
  display: 'swap',
})

/** Valeurs par défaut ; chaque page les surcharge via `generateMetadata`. */
export const metadata: Metadata = {
  title: { default: 'MaisonK', template: '%s | MaisonK' },
  description: "Conception & décoration d'intérieur à La Réunion, par Carole Mondon",
}

/**
 * Layout racine, volontairement minimal.
 *
 * Il sert aussi `/keystatic`, qui ne doit ni afficher l'habillage du site ni
 * dépendre de la lecture du contenu sur disque (impossible à l'exécution sur
 * Cloudflare Workers). L'en-tête et le pied de page vivent dans
 * `app/(site)/layout.tsx`, sur des routes pré-rendues.
 *
 * Le beacon Cloudflare Web Analytics n'est injecté que si le token est défini.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const beaconToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN

  return (
    <html lang="fr" className={`${playfair.variable} ${manjari.variable}`}>
      <body className="flex min-h-screen flex-col">
        {children}
        {beaconToken && (
          <Script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: beaconToken })}
          />
        )}
      </body>
    </html>
  )
}
