import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Navbar } from "../components/Navbar";

export const metadata: Metadata = {
  title: "NoraFlix",
  description: "Private birthday Netflix-style web app.",
  icons: {
    icon: "/images/common/AN-favicon.png",
    shortcut: "/images/common/AN-favicon.png",
    apple: "/images/common/AN-favicon.png",
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
