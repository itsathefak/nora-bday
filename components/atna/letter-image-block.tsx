"use client";

import { useEffect, useState } from "react";

export function LetterImageBlock() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/song-photos", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((result: { photos?: string[] }) => {
        const photos = result.photos ?? [];
        if (!photos.length) return;
        const positions = [0, Math.floor(photos.length / 2), photos.length - 1];
        setImages(positions.map((position) => photos[position]));
      })
      .catch(() => setImages([]));
  }, []);

  if (!images.length) return null;

  return (
    <figure className="my-12">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {images.map((image, index) => (
          <div key={image} className={`${index === 1 ? "-translate-y-3 rotate-1" : index === 0 ? "-rotate-2" : "rotate-2"} bg-[#f8efd9] p-1.5 pb-5 shadow-lg sm:p-2 sm:pb-7`}>
            <img src={image} alt="A memory of Atna and Nora" className="aspect-[4/5] w-full object-cover grayscale-[12%] sepia-[8%]" />
          </div>
        ))}
      </div>
      <figcaption className="mt-5 text-center font-serif text-sm italic text-[#7a654c]">Proof that the quiet moments were never small.</figcaption>
    </figure>
  );
}
