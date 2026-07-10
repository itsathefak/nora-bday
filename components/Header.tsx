"use client";

import { ProfileDropdown } from "./ProfileDropdown";

export function Header() {
  return (
    <header className="fixed top-4 left-6 right-6 z-50 flex items-center justify-between">
      <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
        <span className="text-red-600">Nora</span>
        <span className="text-white">Flix</span>
      </div>

      <div className="flex items-center gap-6">
        <nav className="hidden md:flex gap-6 text-sm text-white/80" />
        <ProfileDropdown />
      </div>
    </header>
  );
}
