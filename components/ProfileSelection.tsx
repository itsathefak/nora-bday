"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { FloatingParticles } from "./FloatingParticles";
import { PawPrints } from "./PawPrints";
import { FloatingObjects } from "./FloatingObjects";

interface ProfileCard {
  id: string;
  name: string;
  title: string;
  image: string;
}

const profiles: ProfileCard[] = [
  {
    id: "nora",
    name: "Nora",
    title: "The Birthday Star",
    image: "/videos/nora/nora.png",
  },
  {
    id: "piggy",
    name: "Piggy",
    title: "The Cozy Cat",
    image: "/videos/piggy/piggy.jpg",
  },
  {
    id: "dauda",
    name: "Dauda",
    title: "The Speedy Hamster",
    image: "/videos/dauda/daud.png",
  },
  {
    id: "atna",
    name: "Atna",
    title: "The Creative Soul",
    image: "/videos/atna/atna.png",
  },
];

export function ProfileSelection() {
  const router = useRouter();
  const [hoveredProfile, setHoveredProfile] = useState<string | null>(null);

  const handleProfileClick = (profileId: string) => {
    router.push(`/profile/${profileId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.2 },
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-red-950/30 via-black to-black min-h-screen overflow-hidden">
      {/* Background animations */}
      <FloatingParticles />
      <PawPrints />
      <FloatingObjects />

      {/* Logo section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-12 text-center"
      >
        <div className="text-5xl sm:text-6xl font-black tracking-tighter">
          <span className="text-red-600">Nora</span>
          <span className="text-white">Flix</span>
        </div>
      </motion.div>

      {/* Title section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="mb-16 text-center"
      >
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-2">
          Who's watching?
        </h1>
        <p className="text-slate-400 text-sm">
          Select a profile to get started
        </p>
      </motion.div>

      {/* Profile grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12 px-6 max-w-7xl"
      >
        {profiles.map((profile) => (
          <motion.div
            key={profile.id}
            variants={cardVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onHoverStart={() => setHoveredProfile(profile.id)}
            onHoverEnd={() => setHoveredProfile(null)}
            onClick={() => handleProfileClick(profile.id)}
            className="cursor-pointer group"
          >
            {/* Profile Card */}
            <div className="relative overflow-hidden rounded-xl mb-6">
              {/* Image wrapper */}
              <div className="relative w-full aspect-square bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl overflow-hidden">
                <Image
                  src={profile.image}
                  alt={profile.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />

                {/* Hover overlay with glow */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: hoveredProfile === profile.id ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                />

                {/* Glow ring on hover */}
                <motion.div
                  className="absolute inset-0 border-3 border-red-500 rounded-xl pointer-events-none"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{
                    opacity: hoveredProfile === profile.id ? 1 : 0,
                    scale: hoveredProfile === profile.id ? 1 : 0.95,
                  }}
                  transition={{ duration: 0.2 }}
                />
              </div>

              {/* Profile info overlay (shows on hover) */}
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-lg"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: hoveredProfile === profile.id ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center">
                  <p className="text-white text-sm font-semibold mb-1">
                    TAP TO WATCH
                  </p>
                  <motion.div
                    animate={{
                      y: hoveredProfile === profile.id ? 0 : 8,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-red-400 text-2xl">→</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Profile labels */}
            <motion.div
              className="text-center"
              variants={titleVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
            >
              <h3
                className={`text-xl font-bold transition-colors duration-200 ${
                  hoveredProfile === profile.id ? "text-red-400" : "text-white"
                }`}
              >
                {profile.name}
              </h3>
              <p className="text-sm text-slate-400 mt-2">{profile.title}</p>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Manage Profiles button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-8 py-3 border-2 border-slate-500 text-slate-300 hover:border-red-500 hover:text-red-400 font-semibold tracking-widest uppercase text-sm transition-colors duration-200"
      >
        Manage Profiles
      </motion.button>
    </div>
  );
}
