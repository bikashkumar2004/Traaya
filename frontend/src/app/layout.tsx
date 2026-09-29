import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Header } from "@/components/common/Header";
import { DisclaimerBanner } from "@/components/common/DisclaimerBanner";
import { MainContainer } from "@/components/common/MainContainer";

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

export const metadata: Metadata = {
  title: "TriageAssist — Clinical Calm & Precision Triage Platform",
  description: "AI-Assisted Primary Healthcare Triage & Patient Flow for Community Clinics and District Hospitals in India",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakartaSans.variable} ${inter.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-200 selection:text-teal-950">
        <AuthProvider>
          <Header />
          <MainContainer>
            {children}
          </MainContainer>
          <DisclaimerBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
