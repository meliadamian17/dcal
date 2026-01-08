import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "dcal | Assignment Tracker",
  description: "Your personal academic assignment tracking system",
};

export const viewport: Viewport = {
  themeColor: "#050508",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Analytics />
      <body 
        className={`${spaceGrotesk.variable} antialiased`}
        style={{ 
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          backgroundColor: "#050508",
          color: "#fafafa",
          minHeight: "100vh"
        }}
        suppressHydrationWarning
      >
        {/* Background Effects */}
        <div 
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: -1
          }}
        >
          {/* Cyan orb top-left */}
          <div 
            style={{
              position: "absolute",
              top: "-15%",
              left: "-5%",
              width: "500px",
              height: "500px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)",
              filter: "blur(60px)"
            }}
          />
          {/* Purple orb right */}
          <div 
            style={{
              position: "absolute",
              top: "30%",
              right: "-10%",
              width: "400px",
              height: "400px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)",
              filter: "blur(60px)"
            }}
          />
          {/* Green orb bottom */}
          <div 
            style={{
              position: "absolute",
              bottom: "-10%",
              left: "40%",
              width: "350px",
              height: "350px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
              filter: "blur(60px)"
            }}
          />
        </div>
        
        {children}
      </body>
    </html>
  );
}
