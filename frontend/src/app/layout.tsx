import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Header } from "@/components/common/Header";
import { DisclaimerBanner } from "@/components/common/DisclaimerBanner";
import { MainContainer } from "@/components/common/MainContainer";
import { SarvamWebsiteTranslator } from "@/components/common/SarvamWebsiteTranslator";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

import { cookies } from "next/headers";
import { UserProfile } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "TRAAYA",
  description: "TRAAYA: AI-Assisted Primary Healthcare Triage & Patient Flow for Community Clinics and District Hospitals in India",
  icons: {
    icon: "/traaya-logo-short.png",
    shortcut: "/traaya-logo-short.png",
    apple: "/traaya-logo-short.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  let initialUser: UserProfile | null = null;
  const userCookie = cookieStore.get("triage_user_display")?.value;
  if (userCookie) {
    try {
      initialUser = JSON.parse(decodeURIComponent(userCookie));
    } catch {}
  }

  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakartaSans.variable} ${inter.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-200 selection:text-teal-950">
        <AuthProvider initialUser={initialUser}>
          <Header />
          <MainContainer>
            {children}
          </MainContainer>
          <DisclaimerBanner />
          <SarvamWebsiteTranslator />
        </AuthProvider>
      </body>
    </html>
  );
}
