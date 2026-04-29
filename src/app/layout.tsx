import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AcademyThemeProvider } from "@/contexts/AcademyThemeContext";
import { ClerkProvider } from '@clerk/nextjs';
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Faixa Preta — Gestão de Academias",
  description: "Sistema completo de gestão para academias de artes marciais. Controle alunos, graduações, financeiro e mais.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Faixa Preta",
  },
  openGraph: {
    title: "Faixa Preta — Gestão de Academias",
    description: "Sistema completo de gestão para academias de artes marciais.",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icons/icon-512-v2.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon-192-v2.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/icon-512-v2.png",
    shortcut: "/icons/icon-512-v2.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0F172A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <ClerkProvider>
          <AcademyThemeProvider>
            {children}
            <ServiceWorkerRegister />
          </AcademyThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
