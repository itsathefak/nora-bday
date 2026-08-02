"use client";

import { useState } from "react";

const imageExtensions = ["jpg", "jpeg", "png", "webp", "avif"];

function LetterMemoryImage({ imageNumber, index }: { imageNumber: number; index: number }) {
  const [extensionIndex, setExtensionIndex] = useState(0);
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  const extension = imageExtensions[extensionIndex];
  const imagePath = `/images/letter-image/${imageNumber}.${extension}`;

  return (
    <div className={`${index % 2 === 0 ? "-rotate-1" : "rotate-1"} rounded-[1.4rem] bg-[#f8efd9] p-2 pb-6 shadow-[0_18px_40px_rgba(68,38,15,0.2)]`}>
      <img
        src={imagePath}
        alt="A memory placed inside Atna's letter"
        className="aspect-[4/5] w-full rounded-[1rem] object-cover grayscale-[8%] sepia-[10%]"
        loading="lazy"
        onError={() => {
          if (extensionIndex < imageExtensions.length - 1) {
            setExtensionIndex((current) => current + 1);
          } else {
            setHidden(true);
          }
        }}
      />
    </div>
  );
}

export function LetterImageBlock({ imageNumbers, caption }: { imageNumbers: number[]; caption?: string }) {
  if (!imageNumbers.length) return null;

  return (
    <figure className="my-12">
      <div className={`mx-auto grid max-w-2xl gap-4 ${imageNumbers.length > 1 ? "grid-cols-2" : "grid-cols-1 sm:max-w-sm"}`}>
        {imageNumbers.map((imageNumber, index) => (
          <LetterMemoryImage key={imageNumber} imageNumber={imageNumber} index={index} />
        ))}
      </div>
      {caption && <figcaption className="mt-5 text-center font-serif text-sm italic text-[#7a654c]">{caption}</figcaption>}
    </figure>
  );
}
