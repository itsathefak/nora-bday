"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const profiles = [
  { id: "nora", name: "Nora", img: "/videos/nora/nora.png" },
  { id: "piggy", name: "Piggy", img: "/videos/piggy/piggy.jpg" },
  { id: "dauda", name: "Dauda", img: "/videos/dauda/daud.png" },
  { id: "atna", name: "Atna", img: "/videos/atna/atna.png" },
];

export function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const closeTimeout = useRef<number | null>(null);

  const openMenu = () => {
    if (closeTimeout.current) {
      window.clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setOpen(true);
  };

  const scheduleClose = () => {
    if (closeTimeout.current) window.clearTimeout(closeTimeout.current);
    // small delay so user can move mouse into menu
    closeTimeout.current = window.setTimeout(() => setOpen(false), 180);
  };

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <div className="flex items-center gap-3 cursor-pointer select-none">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10">
          <Image
            src={profiles[0].img}
            alt="avatar"
            width={40}
            height={40}
            className="object-cover"
          />
        </div>
        <div className="text-sm text-white">Nora</div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
        transition={{ duration: 0.16 }}
        className={`absolute right-0 mt-2 w-48 bg-black/70 backdrop-blur-md rounded-md border border-white/10 p-2 shadow-lg pointer-events-auto ${open ? "block" : "hidden"}`}
      >
        {profiles.map((p) => (
          <div
            key={p.id}
            onClick={() => router.push(`/profile/${p.id}`)}
            className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <Image
                src={p.img}
                alt={p.name}
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <div className="text-sm text-white">{p.name}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
