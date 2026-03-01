import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { AuthProvider } from "@/context/AuthContext";
import { AppHeader } from "@/components/layout/AppHeader";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UpSkill HK — AI-Powered Career Skill Diagnosis",
  description: "Get your personalised Skill Gap Map and career roadmaps for Hong Kong professionals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontSans.variable} font-sans antialiased bg-zinc-950 text-zinc-100`}>
        <AuthProvider>
          <UserProvider>
            <AppHeader />
            {children}
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
