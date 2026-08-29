import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { RegisterSW } from "@/components/register-sw";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const title = "Verdikt — the crowd's verdict, settled on-chain";
const description =
  "Escrow MON, post your thumbnails or data, get scored by real people. Payout is automatic and trustless. Live on Monad testnet.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: "Verdikt",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Verdikt", statusBarStyle: "black-translucent" },
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#f6f5f3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <div className="app-backdrop" aria-hidden />
        <Providers>{children}</Providers>
        <RegisterSW />
      </body>
    </html>
  );
}
