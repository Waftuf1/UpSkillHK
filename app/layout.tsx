import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900`}>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
