"use client";

import React from "react";
import { Header } from "./Header";
import { HeroBanner } from "./HeroBanner";
import { ContentRow } from "./ContentRow";
import { PawPrints } from "./PawPrints";
import { FloatingParticles } from "./FloatingParticles";
import { FloatingObjects } from "./FloatingObjects";
import MediaModal from "./MediaModal";
import type { ReactNode } from "react";

interface RowDefinition {
  id: string;
  title: string;
  type?: string;
  items: string[]; // array of media ids
}

export function ProfileHomePage({ heroData, rows, mediaMap }: { heroData: any; rows: RowDefinition[]; mediaMap: Record<string, any> }) {
  const [selectedMedia, setSelectedMedia] = React.useState<any | null>(null);
  const [modalAutoplay, setModalAutoplay] = React.useState<boolean>(false);

  const openModal = (item: any, opts?: { autoplay?: boolean }) => {
    setSelectedMedia(item || null);
    setModalAutoplay(!!opts?.autoplay);
  };

  const closeModal = () => {
    setSelectedMedia(null);
    setModalAutoplay(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-red-950/30 via-black to-black text-white">
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-red-950/30 via-black/80 to-black" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,0,0,0.24),transparent_16%),radial-gradient(circle_at_bottom_right,rgba(255,82,82,0.24),transparent_28%)]" />
      <div className="absolute inset-0 -z-5 pointer-events-none">
        <FloatingParticles />
        <PawPrints />
        <FloatingObjects />
      </div>

      <Header />

      <main className="pt-24">
        <HeroBanner data={heroData} onOpen={(it: any, opts?: any) => openModal(it, opts)} />

        <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
          {rows.map((r) => (
            <ContentRow key={r.id} title={r.title} items={r.items.map((id) => mediaMap[id])} onOpen={(it: any) => openModal(it)} />
          ))}
        </div>
      </main>

      <MediaModal open={!!selectedMedia} item={selectedMedia} onClose={closeModal} autoplay={modalAutoplay} />
    </div>
  );
}

export default ProfileHomePage;
