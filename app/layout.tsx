import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HandCanvas",
  description:
    "Draw on a canvas with hand gestures — MediaPipe Hands and Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${jetbrainsMono.variable} min-h-full bg-[#0d0d0d] font-mono antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
