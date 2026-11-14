import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Flash } from "@/components/layout/Flash";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(config.appUrl),
  title: {
    default: "Reelance — Les meilleurs monteurs vidéo freelances d'Afrique francophone",
    template: "%s · Reelance",
  },
  description:
    "Trouvez un monteur vidéo freelance pour vos vidéos YouTube, corporate, pubs réseaux sociaux, mariages, clips et motion design. Paiement sécurisé par séquestre.",
  openGraph: { siteName: "Reelance", locale: "fr_FR", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh">
        {children}
        <Flash />
      </body>
    </html>
  );
}
