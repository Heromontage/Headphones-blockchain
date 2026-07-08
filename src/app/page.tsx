'use client';

import Navbar from "@/components/Navbar";
import Overlay from "@/components/Overlay";
import dynamic from "next/dynamic";

// Lazy load heavy WebGL and below-the-fold components
const ScrollyCanvas = dynamic(() => import("@/components/ScrollyCanvas"), { ssr: false });
const Projects = dynamic(() => import("@/components/Projects"));
const Footer = dynamic(() => import("@/components/Footer"));

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar />
      <ScrollyCanvas>
        <Overlay />
      </ScrollyCanvas>
      <Projects />
      <Footer />
    </main>
  );
}
