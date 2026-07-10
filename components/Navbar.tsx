"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export function Navbar() {
  const pathname = usePathname();

  // Hide navbar on home page and profile routes where a custom ProfileHeader exists
  if (pathname === "/" || pathname?.startsWith("/profile")) {
    return null;
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <Link
          href="/"
          className="font-semibold uppercase tracking-[0.3em] text-white/90"
        >
          NoraFlix
        </Link>
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Profiles
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
