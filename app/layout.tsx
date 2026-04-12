import type { Metadata } from "next";
import { Outfit, Adamina, Fira_Code } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { RouteDetector } from "@/components/layout/route-detector";
import { getUser } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const adamina = Adamina({
  variable: "--font-adamina",
  weight: "400",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard - ArnaudGct",
  description:
    "Espace privé pour gérer les données du portfolio de Arnaud Graciet",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${adamina.variable} ${firaCode.variable} font-sans antialiased`}
      >
        <Toaster />
        <RouteDetector user={user}>{children}</RouteDetector>
      </body>
    </html>
  );
}
