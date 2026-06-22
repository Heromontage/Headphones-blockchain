import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AETHER — Engineered for Silence",
  description:
    "Experience sound like never before. AETHER headphones deliver adaptive noise cancellation, 60-hour battery life, and spatial audio in a premium design.",
  keywords: [
    "AETHER",
    "headphones",
    "noise cancellation",
    "spatial audio",
    "premium audio",
  ],
  openGraph: {
    title: "AETHER — Engineered for Silence",
    description:
      "Experience sound like never before. Premium headphones with adaptive noise cancellation and spatial audio.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} antialiased`}
    >
      <body className="min-h-screen bg-[#0a0a0f] text-white">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
