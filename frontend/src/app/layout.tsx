import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "X Tracker",
  description: "Track your Beyblade X matchup records",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-black font-sans text-neutral-100 antialiased">
        <Header />
        <div
          className="flex flex-1 flex-col pt-(--header-height)"
          style={{ minHeight: "calc(100vh - var(--header-height) - var(--footer-height))" }}
        >
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
