import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/top-nav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Allocation",
  description: "Container allocation and customer comms",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans text-[14px] leading-[1.5] text-ink antialiased">
        <TopNav />
        <main className="mx-auto max-w-[960px] px-8 pb-24 pt-8">{children}</main>
      </body>
    </html>
  );
}
