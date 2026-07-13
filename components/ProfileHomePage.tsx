"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "./Header";
import { HeroBanner } from "./HeroBanner";
import { ContentRow } from "./ContentRow";
import { PawPrints } from "./PawPrints";
import { FloatingParticles } from "./FloatingParticles";
import { FloatingObjects } from "./FloatingObjects";
import MediaModal from "./MediaModal";

interface RowDefinition {
  id: string;
  title: string;
  type?: "grid" | "carousel" | string;
  items: string[]; // array of media ids
}

const FOREVER_STORAGE_KEY = "noraflix:forever-collection";

function getFavoriteKey(item: any) {
  return item?.id || item?.slug || item?.title || "";
}

function normalizeFavoriteItem(item: any) {
  const id = getFavoriteKey(item);

  return {
    ...item,
    id,
    thumbnail: item?.thumbnail || item?.backdropImage,
    backdropImage: item?.backdropImage || item?.thumbnail,
  };
}

export function ProfileHomePage({ heroData, rows, mediaMap }: { heroData: any; rows: RowDefinition[]; mediaMap: Record<string, any> }) {
  const [selectedMedia, setSelectedMedia] = React.useState<any | null>(null);
  const [modalAutoplay, setModalAutoplay] = React.useState<boolean>(false);
  const [foreverItems, setForeverItems] = React.useState<any[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = React.useState(false);
  const [toastVisible, setToastVisible] = React.useState(false);
  const toastTimerRef = React.useRef<number | null>(null);
  const heroFavoriteItem = normalizeFavoriteItem(heroData);

  React.useEffect(() => {
    const savedItems = localStorage.getItem(FOREVER_STORAGE_KEY);

    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems);
        setForeverItems(Array.isArray(parsed) ? parsed : []);
      } catch {
        setForeverItems([]);
      }
    }

    setFavoritesLoaded(true);
  }, []);

  React.useEffect(() => {
    if (favoritesLoaded) {
      localStorage.setItem(FOREVER_STORAGE_KEY, JSON.stringify(foreverItems));
    }
  }, [favoritesLoaded, foreverItems]);

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const openModal = (item: any, opts?: { autoplay?: boolean }) => {
    setSelectedMedia(item ? normalizeFavoriteItem(item) : null);
    setModalAutoplay(!!opts?.autoplay);
  };

  const closeModal = () => {
    setSelectedMedia(null);
    setModalAutoplay(false);
  };

  const showForeverToast = () => {
    setToastVisible(true);

    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
    }, 2200);
  };

  const toggleForeverItem = (item?: any | null) => {
    if (!item) return;

    const favoriteItem = normalizeFavoriteItem(item);
    const favoriteKey = getFavoriteKey(favoriteItem);
    let added = false;

    setForeverItems((currentItems) => {
      const exists = currentItems.some((currentItem) => getFavoriteKey(currentItem) === favoriteKey);

      if (exists) {
        return currentItems.filter((currentItem) => getFavoriteKey(currentItem) !== favoriteKey);
      }

      added = true;
      return [favoriteItem, ...currentItems];
    });

    if (added) showForeverToast();
  };

  const foreverDisplayItems = foreverItems.map((item) =>
    getFavoriteKey(item) === getFavoriteKey(heroFavoriteItem)
      ? { ...item, thumbnail: heroFavoriteItem.thumbnail, backdropImage: heroFavoriteItem.backdropImage }
      : item
  );

  const selectedMediaKey = getFavoriteKey(selectedMedia);
  const selectedMediaIsForever =
    !!selectedMediaKey &&
    foreverItems.some((item) => getFavoriteKey(item) === selectedMediaKey);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-red-950/30 via-black to-black text-white">
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-red-950/30 via-black/80 to-black" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,0,0,0.24),transparent_16%),radial-gradient(circle_at_bottom_right,rgba(255,82,82,0.24),transparent_28%)]" />
      <div className="absolute inset-0 -z-5 pointer-events-none">
        <FloatingParticles />
        <PawPrints />
        <FloatingObjects objects={heroData?.backgroundObjects} />
      </div>

      <Header />

      <main className="pt-24">
        <HeroBanner data={heroData} onOpen={(it: any, opts?: any) => openModal(it, opts)} />

        <div id="profile-rows" className="max-w-7xl mx-auto px-6 py-12 space-y-10 scroll-mt-24">
          {foreverDisplayItems.length > 0 && (
            <ContentRow
              title="❤️ Our Forever Collection"
              items={foreverDisplayItems}
              onOpen={(it: any) => openModal(it)}
            />
          )}

          {rows.map((r) => (
            <ContentRow
              key={r.id}
              title={r.title}
              items={r.items.map((id) => mediaMap[id]).filter(Boolean)}
              layout={r.type === "carousel" ? "carousel" : undefined}
              onOpen={(it: any) => openModal(it)}
            />
          ))}
        </div>
      </main>

      <MediaModal
        open={!!selectedMedia}
        item={selectedMedia}
        onClose={closeModal}
        autoplay={modalAutoplay}
        onToggleFavorite={toggleForeverItem}
        isFavorite={selectedMediaIsForever}
      />

      <AnimatePresence>
        {toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-8 left-1/2 z-[80] -translate-x-1/2 rounded-full border border-red-400/30 bg-black/85 px-5 py-3 text-sm font-semibold text-white shadow-2xl shadow-red-950/50 backdrop-blur"
          >
            ❤️ Added to Our Forever Collection
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProfileHomePage;
