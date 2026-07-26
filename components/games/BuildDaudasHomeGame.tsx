"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, PointerEvent } from "react";

type Zone = "floor" | "wall" | "raised";

interface HabitatItemData {
  id: string;
  name: string;
  type: string;
  category: string;
  allowedZones: string[];
  happiness: number;
  comfort: number;
  safety: number;
  fun: number;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  order: number;
  allowMultiple?: boolean;
}

interface BuildHomeData {
  requiredItems: string[];
  items: HabitatItemData[];
}

interface PlacedItem {
  instanceId: string;
  itemId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zone: Zone;
  rotation: number;
  zIndex: number;
}

interface SavedLayout {
  placedItems: PlacedItem[];
  finalScore: number;
  lastUpdated: string;
}

interface Scores {
  happiness: number;
  comfort: number;
  safety: number;
  fun: number;
  finalScore: number;
}

const LAYOUT_KEY = "dauda-build-home-layout";
const BEST_KEY = "dauda-build-home-best";
const THUMBNAIL = "/videos/dauda/games/build-home/build-daudas-home.png";
const DAUDA_IMAGE = "/videos/dauda/games/build-home/dauda.png";

const MAJOR_ITEM_TYPES = new Set([
  "house",
  "wheel",
  "tunnel",
  "food-bowl",
  "water-bottle",
  "bedding",
  "bridge",
  "hammock",
  "hideout",
]);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function snap(value: number) {
  return Math.round(value / 2) * 2;
}

function getZoneFromY(y: number): Zone {
  if (y < 34) return "wall";
  if (y < 56) return "raised";
  return "floor";
}

function generateInstanceId(itemId: string) {
  return `${itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function overlapRatio(a: PlacedItem, b: PlacedItem) {
  const left = Math.max(a.x, b.x);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const top = Math.max(a.y, b.y);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  const area = width * height;
  if (!area) return 0;
  return area / Math.min(a.width * a.height, b.width * b.height);
}

function getRank(score: number) {
  if (score >= 95) {
    return {
      title: "Dauda’s Tiny Palace 🏆",
      message: "A five-star habitat worthy of the household seed hoarder.",
    };
  }
  if (score >= 80) {
    return {
      title: "Certified Hamster Architect 🐹",
      message: "Cozy, safe, and highly snack-compatible.",
    };
  }
  if (score >= 60) {
    return {
      title: "Tiny Home Designer",
      message: "Dauda approves, but has submitted several minor requests.",
    };
  }
  if (score >= 40) {
    return {
      title: "Junior Habitat Assistant",
      message: "The essentials are present. The luxury is still pending.",
    };
  }
  return {
    title: "Renovation Required",
    message: "Dauda has contacted another contractor.",
  };
}

function getDaudaReaction(score: number) {
  if (score >= 95) return "Tiny palace approved!";
  if (score >= 80) return "Dauda is preparing to move in.";
  if (score >= 60) return "Tiny home progress approved.";
  if (score >= 40) return "Dauda is cautiously optimistic.";
  return "This renovation is under review.";
}

function SafeImage({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  className: string;
  fallback: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={[
          className,
          "flex items-center justify-center bg-gradient-to-br from-amber-950/70 via-black to-red-950/50 text-6xl",
        ].join(" ")}
        aria-label={alt}
      >
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function ItemVisual({ type, compact = false }: { type: string; compact?: boolean }) {
  const sizeClass = compact ? "h-14 w-16" : "h-full w-full";

  if (type === "house") {
    return (
      <div className={`${sizeClass} relative mx-auto`}>
        <div className="absolute left-[8%] top-[6%] h-[30%] w-[84%] rounded-t-xl bg-gradient-to-br from-red-700 to-red-950 shadow-lg" />
        <div className="absolute bottom-0 left-[14%] h-[72%] w-[72%] rounded-xl bg-gradient-to-br from-amber-800 via-amber-950 to-stone-950 shadow-inner" />
        <div className="absolute bottom-0 left-[38%] h-[42%] w-[24%] rounded-t-full bg-black/55" />
      </div>
    );
  }

  if (type === "wheel") {
    return (
      <div className={`${sizeClass} relative mx-auto rounded-full border-[8px] border-orange-400/80 bg-orange-950/20 shadow-[0_0_24px_rgba(251,146,60,0.35)]`}>
        <div className="absolute left-1/2 top-1/2 h-[76%] w-[4px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-200/70" />
        <div className="absolute left-1/2 top-1/2 h-[4px] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-200/70" />
        <div className="absolute left-1/2 top-1/2 h-[5px] w-[78%] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-orange-200/50" />
        <div className="absolute left-1/2 top-1/2 h-[5px] w-[78%] -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-orange-200/50" />
        <div className="absolute left-1/2 top-1/2 h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-100" />
      </div>
    );
  }

  if (type === "tunnel") {
    return (
      <div className={`${sizeClass} relative mx-auto overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 via-teal-700 to-blue-950 shadow-inner`}>
        <div className="absolute left-[8%] top-[18%] h-[30%] w-[80%] rounded-full bg-white/25 blur-sm" />
        <div className="absolute inset-y-[12%] left-[8%] w-[18%] rounded-full bg-black/35" />
        <div className="absolute inset-y-[12%] right-[8%] w-[18%] rounded-full bg-black/35" />
      </div>
    );
  }

  if (type === "food-bowl" || type === "seed-bowl") {
    return (
      <div className={`${sizeClass} relative mx-auto`}>
        <div className="absolute bottom-[12%] left-[10%] h-[48%] w-[80%] rounded-b-full rounded-t-xl bg-gradient-to-b from-red-500 to-red-950 shadow-lg" />
        <div className="absolute bottom-[44%] left-[16%] h-[18%] w-[68%] rounded-full bg-amber-200/90" />
        <div className="absolute left-[30%] top-[28%] h-2 w-2 rounded-full bg-yellow-700" />
        <div className="absolute left-[48%] top-[24%] h-2 w-2 rounded-full bg-yellow-600" />
        <div className="absolute left-[62%] top-[31%] h-2 w-2 rounded-full bg-orange-700" />
      </div>
    );
  }

  if (type === "water-bottle") {
    return (
      <div className={`${sizeClass} relative mx-auto`}>
        <div className="absolute left-[26%] top-0 h-[72%] w-[48%] rounded-2xl border border-white/35 bg-gradient-to-b from-cyan-100/80 to-cyan-500/45 shadow-inner" />
        <div className="absolute bottom-[20%] left-[44%] h-[34%] w-[12%] rounded-full bg-slate-300" />
        <div className="absolute bottom-[10%] left-[50%] h-[20%] w-[42%] origin-left rotate-[24deg] rounded-full bg-slate-300" />
        <div className="absolute bottom-[5%] right-[2%] h-2 w-2 rounded-full bg-cyan-200" />
      </div>
    );
  }

  if (type === "bedding") {
    return (
      <div className={`${sizeClass} relative mx-auto`}>
        <div className="absolute inset-x-[4%] bottom-[8%] h-[64%] rounded-[2rem] bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-200 shadow-inner" />
        <div className="absolute left-[10%] top-[22%] h-[38%] w-[38%] rounded-full bg-white/35 blur-sm" />
        <div className="absolute right-[10%] top-[18%] h-[34%] w-[40%] rounded-full bg-amber-50/45 blur-sm" />
      </div>
    );
  }

  if (type === "bridge") {
    return (
      <div className={`${sizeClass} relative mx-auto`}>
        <div className="absolute inset-x-[4%] top-[45%] h-[18%] rounded-full bg-amber-950" />
        {[12, 28, 44, 60, 76].map((left) => (
          <div
            key={left}
            className="absolute top-[25%] h-[52%] w-[10%] rounded bg-gradient-to-b from-amber-500 to-amber-900"
            style={{ left: `${left}%` }}
          />
        ))}
      </div>
    );
  }

  if (type === "hammock") {
    return (
      <div className={`${sizeClass} relative mx-auto`}>
        <div className="absolute left-[8%] top-[15%] h-[70%] w-[4px] rounded-full bg-amber-700" />
        <div className="absolute right-[8%] top-[15%] h-[70%] w-[4px] rounded-full bg-amber-700" />
        <div className="absolute bottom-[20%] left-[14%] h-[42%] w-[72%] rounded-b-full bg-gradient-to-br from-blue-700 via-indigo-950 to-slate-950 shadow-lg" />
        <div className="absolute left-[35%] top-[38%] text-[10px] text-amber-100">✦</div>
        <div className="absolute left-[58%] top-[48%] text-[9px] text-amber-100">✦</div>
      </div>
    );
  }

  if (type === "chew-toy") {
    return (
      <div className={`${sizeClass} relative mx-auto`}>
        <div className="absolute left-[24%] top-[22%] h-[56%] w-[52%] rotate-12 rounded-lg bg-gradient-to-br from-amber-500 to-amber-900 shadow-lg" />
        <div className="absolute left-[34%] top-[34%] h-[10%] w-[32%] rotate-12 rounded bg-amber-200/40" />
      </div>
    );
  }

  if (type === "hideout") {
    return (
      <div className={`${sizeClass} relative mx-auto`}>
        <div className="absolute bottom-[6%] left-[12%] h-[78%] w-[76%] rounded-t-full bg-gradient-to-br from-stone-400 via-amber-800 to-stone-950 shadow-lg" />
        <div className="absolute bottom-[6%] left-[36%] h-[44%] w-[28%] rounded-t-full bg-black/65" />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} relative mx-auto`}>
      <div className="absolute bottom-[8%] left-[28%] h-[32%] w-[44%] rounded-lg bg-gradient-to-br from-amber-700 to-amber-950" />
      <div className="absolute bottom-[36%] left-[46%] h-[38%] w-[8%] rounded-full bg-emerald-800" />
      <div className="absolute bottom-[58%] left-[30%] h-[24%] w-[28%] -rotate-12 rounded-full bg-emerald-500" />
      <div className="absolute bottom-[56%] right-[26%] h-[24%] w-[28%] rotate-12 rounded-full bg-lime-500" />
    </div>
  );
}

function getItemById(items: HabitatItemData[], id: string) {
  return items.find((item) => item.id === id);
}

function calculateScores(
  items: HabitatItemData[],
  requiredItems: string[],
  placedItems: PlacedItem[],
  overlapWarnings: string[],
  invalidItems: string[],
): Scores {
  let happiness = 0;
  let comfort = 0;
  let safety = 0;
  let fun = 0;

  placedItems.forEach((placed) => {
    const item = getItemById(items, placed.itemId);
    if (!item) return;
    happiness += item.happiness;
    comfort += item.comfort;
    safety += item.safety;
    fun += item.fun;
  });

  const missingRequired = requiredItems.filter(
    (id) => !placedItems.some((placed) => placed.itemId === id),
  );
  if (missingRequired.length === 0) safety += 25;
  if (overlapWarnings.length === 0) safety += 20;
  if (invalidItems.length === 0) safety += 15;

  happiness = clamp(happiness, 0, 100);
  comfort = clamp(comfort, 0, 100);
  safety = clamp(safety, 0, 100);
  fun = clamp(fun, 0, 100);

  let finalScore = Math.round((happiness + comfort + safety + fun) / 4);
  const optionalCount = placedItems.filter((placed) => {
    const item = getItemById(items, placed.itemId);
    return item?.category === "optional";
  }).length;

  if (missingRequired.length === 0) finalScore += 5;
  if (overlapWarnings.length === 0) finalScore += 5;
  if (optionalCount >= 3) finalScore += 5;
  if ([happiness, comfort, safety, fun].every((score) => score >= 70)) {
    finalScore += 5;
  }

  return {
    happiness,
    comfort,
    safety,
    fun,
    finalScore: clamp(finalScore, 0, 100),
  };
}

function validateLayout(items: HabitatItemData[], placedItems: PlacedItem[]) {
  const invalidItems = placedItems
    .filter((placed) => {
      const item = getItemById(items, placed.itemId);
      return item && !item.allowedZones.includes(placed.zone);
    })
    .map((placed) => placed.instanceId);

  const overlapWarnings: string[] = [];
  for (let aIndex = 0; aIndex < placedItems.length; aIndex += 1) {
    for (let bIndex = aIndex + 1; bIndex < placedItems.length; bIndex += 1) {
      const a = placedItems[aIndex];
      const b = placedItems[bIndex];
      const aItem = getItemById(items, a.itemId);
      const bItem = getItemById(items, b.itemId);
      if (!aItem || !bItem) continue;
      if (!MAJOR_ITEM_TYPES.has(aItem.type) || !MAJOR_ITEM_TYPES.has(bItem.type)) {
        continue;
      }
      if (overlapRatio(a, b) > 0.35) {
        overlapWarnings.push(`${aItem.name} overlaps ${bItem.name}`);
      }
    }
  }

  return { invalidItems, overlapWarnings };
}

export function BuildDaudasHomeGame({ data }: { data: BuildHomeData }) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState("");
  const [selectedPlacedItem, setSelectedPlacedItem] = useState("");
  const [draggingPlacedItem, setDraggingPlacedItem] = useState("");
  const [message, setMessage] = useState("Choose an item and start building Dauda’s tiny palace.");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [savedLayout, setSavedLayout] = useState<SavedLayout | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const sortedItems = useMemo(
    () => [...data.items].sort((a, b) => a.order - b.order),
    [data.items],
  );
  const { invalidItems, overlapWarnings } = useMemo(
    () => validateLayout(data.items, placedItems),
    [data.items, placedItems],
  );
  const scores = useMemo(
    () =>
      calculateScores(
        data.items,
        data.requiredItems,
        placedItems,
        overlapWarnings,
        invalidItems,
      ),
    [data.items, data.requiredItems, invalidItems, overlapWarnings, placedItems],
  );
  const requiredRemaining = data.requiredItems.filter(
    (id) => !placedItems.some((placed) => placed.itemId === id),
  );
  const selectedPlaced = placedItems.find(
    (placed) => placed.instanceId === selectedPlacedItem,
  );
  const rank = getRank(scores.finalScore);

  useEffect(() => {
    const saved = window.localStorage.getItem(LAYOUT_KEY);
    const best = window.localStorage.getItem(BEST_KEY);
    if (saved) {
      try {
        setSavedLayout(JSON.parse(saved) as SavedLayout);
      } catch {
        setSavedLayout(null);
      }
    }
    if (best) setBestScore(Number(best) || 0);
  }, []);

  useEffect(() => {
    if (!gameStarted) return;
    const layout: SavedLayout = {
      placedItems,
      finalScore: scores.finalScore,
      lastUpdated: new Date().toISOString(),
    };
    window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
    setSavedLayout(layout);
  }, [gameStarted, placedItems, scores.finalScore]);

  const playSound = (src: string) => {
    if (!soundEnabled) return;
    const audio = new Audio(src);
    audio.volume = 0.25;
    audio.play().catch(() => undefined);
  };

  const getPointFromEvent = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return null;
    return { x, y, zone: getZoneFromY(y) };
  };

  const canPlaceAnother = (item: HabitatItemData) => {
    if (item.allowMultiple) return true;
    return !placedItems.some((placed) => placed.itemId === item.id);
  };

  const placeItem = (itemId: string, x: number, y: number) => {
    const item = getItemById(data.items, itemId);
    if (!item) return;

    if (!canPlaceAnother(item)) {
      setMessage(`${item.name} is already in Dauda’s home.`);
      return;
    }

    const zone = getZoneFromY(y);
    if (!item.allowedZones.includes(zone)) {
      setMessage("Dauda says that does not belong there.");
      playSound("/sounds/dauda/wrong.mp3");
      return;
    }

    const width = item.defaultWidth;
    const height = item.defaultHeight;
    const placed: PlacedItem = {
      instanceId: generateInstanceId(item.id),
      itemId: item.id,
      x: clamp(snap(x - width / 2), 0, 100 - width),
      y: clamp(snap(y - height / 2), 0, 100 - height),
      width,
      height,
      zone,
      rotation: 0,
      zIndex: placedItems.length + 1,
    };

    setPlacedItems((current) => [...current, placed]);
    setSelectedPlacedItem(placed.instanceId);
    setSelectedInventoryItem("");
    setMessage(`${item.name} placed. ${item.description}`);
    setValidationErrors([]);
    playSound("/sounds/dauda/place.mp3");
  };

  const movePlacedItem = (instanceId: string, x: number, y: number) => {
    setPlacedItems((current) =>
      current.map((placed) => {
        if (placed.instanceId !== instanceId) return placed;
        const item = getItemById(data.items, placed.itemId);
        const zone = getZoneFromY(y);
        if (item && !item.allowedZones.includes(zone)) {
          setMessage("Dauda says that does not belong there.");
          return placed;
        }
        return {
          ...placed,
          x: clamp(snap(x - placed.width / 2), 0, 100 - placed.width),
          y: clamp(snap(y - placed.height / 2), 0, 100 - placed.height),
          zone,
        };
      }),
    );
  };

  const handleCanvasClick = (event: PointerEvent<HTMLDivElement>) => {
    if (!selectedInventoryItem) return;
    const point = getPointFromEvent(event.clientX, event.clientY);
    if (!point) return;
    placeItem(selectedInventoryItem, point.x, point.y);
  };

  const handleCanvasDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const itemId = event.dataTransfer.getData("text/plain");
    const point = getPointFromEvent(event.clientX, event.clientY);
    if (!itemId || !point) return;
    placeItem(itemId, point.x, point.y);
  };

  const handlePlacedPointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    placed: PlacedItem,
  ) => {
    event.stopPropagation();
    setSelectedPlacedItem(placed.instanceId);
    setDraggingPlacedItem(placed.instanceId);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePlacedPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!draggingPlacedItem) return;
    event.preventDefault();
    const point = getPointFromEvent(event.clientX, event.clientY);
    if (!point) return;
    movePlacedItem(draggingPlacedItem, point.x, point.y);
  };

  const updateSelectedItem = (changes: Partial<PlacedItem>) => {
    setPlacedItems((current) =>
      current.map((placed) =>
        placed.instanceId === selectedPlacedItem ? { ...placed, ...changes } : placed,
      ),
    );
  };

  const deleteSelectedItem = () => {
    const selected = placedItems.find((placed) => placed.instanceId === selectedPlacedItem);
    const item = selected ? getItemById(data.items, selected.itemId) : null;
    setPlacedItems((current) =>
      current.filter((placed) => placed.instanceId !== selectedPlacedItem),
    );
    setSelectedPlacedItem("");
    setMessage(item ? `${item.name} returned to inventory.` : "Item returned to inventory.");
    playSound("/sounds/dauda/remove.mp3");
  };

  const startNewHome = () => {
    setPlacedItems([]);
    setGameStarted(true);
    setGameCompleted(false);
    setSelectedInventoryItem("");
    setSelectedPlacedItem("");
    setValidationErrors([]);
    setMessage("Choose an item and start building Dauda’s tiny palace.");
  };

  const continueSavedHome = () => {
    if (!savedLayout) return;
    setPlacedItems(savedLayout.placedItems);
    setGameStarted(true);
    setGameCompleted(false);
    setMessage("Saved home loaded. Dauda is inspecting the renovation.");
  };

  const resetHome = () => {
    setPlacedItems([]);
    setSelectedInventoryItem("");
    setSelectedPlacedItem("");
    setGameCompleted(false);
    setValidationErrors([]);
    setMessage("The habitat has been reset. Dauda expects improvements.");
  };

  const finishHome = () => {
    const missing = requiredRemaining.map((id) => getItemById(data.items, id)?.name ?? id);
    const errors: string[] = [];
    if (missing.length) errors.push(`Missing: ${missing.join(", ")}`);
    if (overlapWarnings.length) errors.push(...overlapWarnings);
    if (invalidItems.length) errors.push("Some items are in the wrong habitat zone.");

    if (errors.length) {
      setValidationErrors(errors);
      setMessage("Dauda’s home is not ready yet.");
      playSound("/sounds/dauda/wrong.mp3");
      return;
    }

    setValidationErrors([]);
    setGameCompleted(true);
    setMessage("Dauda is exploring the finished habitat.");
    if (scores.finalScore > bestScore) {
      setBestScore(scores.finalScore);
      window.localStorage.setItem(BEST_KEY, String(scores.finalScore));
    }
    playSound("/sounds/dauda/complete.mp3");
  };

  if (!gameStarted) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-950/30 via-black to-black px-6 py-20 text-white">
        <div className="absolute left-[-8rem] top-20 h-80 w-80 rounded-full bg-red-900/25 blur-3xl" />
        <div className="absolute right-[-8rem] top-1/3 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
          <div className="absolute left-[12%] top-[18%] text-4xl">🌻</div>
          <div className="absolute right-[16%] top-[24%] text-3xl">🐹</div>
          <div className="absolute bottom-[18%] left-[42%] text-4xl">🌻</div>
        </div>

        <section className="relative mx-auto grid max-w-6xl gap-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/40 backdrop-blur md:grid-cols-[0.95fr_1.05fr] md:p-8">
          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
            <SafeImage
              src={THUMBNAIL}
              alt="Build Dauda’s Home"
              fallback="🏠"
              className="h-full min-h-[320px] w-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-amber-300">
              Dauda Habitat Builder
            </p>
            <h1 className="mt-4 text-5xl font-black leading-tight md:text-6xl">
              Build Dauda’s Home
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-200">
              Dauda has requested a full habitat renovation and has provided
              absolutely no budget.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <StatCard label="Best habitat" value={`${bestScore}/100`} />
              <StatCard
                label="Saved layout"
                value={savedLayout ? "Available" : "None yet"}
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {savedLayout ? (
                <button
                  type="button"
                  onClick={continueSavedHome}
                  className="rounded-xl bg-amber-300 px-5 py-3 font-black text-black transition hover:bg-amber-200"
                >
                  Continue Last Home
                </button>
              ) : null}
              <button
                type="button"
                onClick={startNewHome}
                className="rounded-xl bg-white px-5 py-3 font-black text-black transition hover:bg-slate-200"
              >
                Start New Home
              </button>
              <Link
                href="/profile/dauda"
                className="rounded-xl bg-white/10 px-5 py-3 font-black text-white transition hover:bg-white/15"
              >
                Back to Dauda Games
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-amber-950/25 via-black to-black px-4 py-8 text-white md:px-6">
      <div className="absolute left-[-10rem] top-28 h-96 w-96 rounded-full bg-red-900/25 blur-3xl" />
      <div className="absolute right-[-10rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-amber-300/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
        <div className="absolute left-[8%] top-[16%] text-4xl">🌻</div>
        <div className="absolute right-[12%] top-[22%] text-3xl">🐾</div>
        <div className="absolute bottom-[12%] left-[34%] text-4xl">🌻</div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-300">
              Build Dauda’s Home
            </p>
            <h1 className="mt-1 text-3xl font-black md:text-5xl">
              Tiny Habitat Renovation
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/profile/dauda"
              className="rounded-xl bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15"
            >
              Back
            </Link>
            <button
              type="button"
              onClick={() => setReducedMotion((value) => !value)}
              className="rounded-xl bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15"
            >
              Reduced Motion: {reducedMotion ? "On" : "Off"}
            </button>
            <button
              type="button"
              onClick={() => setSoundEnabled((value) => !value)}
              className="rounded-xl bg-white/10 px-4 py-3 text-sm font-black transition hover:bg-white/15"
            >
              Sound: {soundEnabled ? "On" : "Muted"}
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-amber-950/35 via-white/[0.04] to-black p-4 shadow-2xl shadow-black/40">
            <div className="mb-4 min-h-[56px] rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-center font-black text-slate-100">
              {message}
            </div>

            <div
              ref={canvasRef}
              onPointerDown={handleCanvasClick}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleCanvasDrop}
              className={[
                "relative aspect-[16/10] min-h-[360px] overflow-hidden rounded-[1.75rem] border border-amber-200/15 shadow-inner",
                "bg-[radial-gradient(circle_at_70%_20%,rgba(251,191,36,0.22),transparent_28%),linear-gradient(to_bottom,#3d2114_0%,#2b170f_35%,#5a321c_36%,#2d180f_100%)]",
                selectedInventoryItem ? "cursor-crosshair ring-2 ring-amber-300/50" : "",
              ].join(" ")}
              aria-label="Dauda habitat canvas"
            >
              <div className="absolute inset-x-0 top-0 h-[34%] border-b border-white/10 bg-gradient-to-b from-black/25 to-transparent">
                <p className="absolute right-4 top-3 rounded-full bg-black/35 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-amber-100">
                  Wall
                </p>
              </div>
              <div className="absolute inset-x-[8%] top-[38%] h-[12%] rounded-full bg-gradient-to-b from-amber-900 to-amber-950 shadow-lg">
                <p className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black uppercase tracking-[0.2em] text-amber-100/80">
                  Raised
                </p>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-[44%] bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:44px_44px]">
                <p className="absolute right-4 top-3 rounded-full bg-black/35 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-amber-100">
                  Floor
                </p>
              </div>

              <motion.div
                animate={reducedMotion ? {} : { y: [0, -4, 0] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="absolute bottom-[8%] left-[48%] z-20 w-[12%] min-w-16"
              >
                <div className="mb-2 rounded-2xl border border-white/10 bg-black/55 px-3 py-2 text-center text-xs font-black text-amber-100 shadow-xl">
                  {getDaudaReaction(scores.finalScore)}
                </div>
                <SafeImage
                  src={DAUDA_IMAGE}
                  alt="Dauda inspecting the habitat"
                  fallback="🐹"
                  className="mx-auto aspect-square w-full rounded-full object-cover shadow-[0_0_28px_rgba(251,191,36,0.35)]"
                />
              </motion.div>

              {placedItems.map((placed) => {
                const item = getItemById(data.items, placed.itemId);
                if (!item) return null;
                const hasWarning =
                  invalidItems.includes(placed.instanceId) ||
                  overlapWarnings.some((warning) => warning.includes(item.name));
                const selected = selectedPlacedItem === placed.instanceId;
                return (
                  <button
                    key={placed.instanceId}
                    type="button"
                    onPointerDown={(event) => handlePlacedPointerDown(event, placed)}
                    onPointerMove={handlePlacedPointerMove}
                    onPointerUp={() => setDraggingPlacedItem("")}
                    onPointerCancel={() => setDraggingPlacedItem("")}
                    className={[
                      "absolute touch-none rounded-2xl outline-none transition",
                      selected ? "ring-4 ring-amber-300" : "ring-1 ring-white/10",
                      hasWarning ? "shadow-[0_0_0_4px_rgba(239,68,68,0.75)]" : "",
                    ].join(" ")}
                    style={{
                      left: `${placed.x}%`,
                      top: `${placed.y}%`,
                      width: `${placed.width}%`,
                      height: `${placed.height}%`,
                      zIndex: placed.zIndex,
                      transform: `rotate(${placed.rotation}deg)`,
                    }}
                    aria-label={`Placed ${item.name}. Drag to move.`}
                  >
                    <ItemVisual type={item.type} />
                    <span className="sr-only">{item.name}</span>
                  </button>
                );
              })}
            </div>

            {selectedInventoryItem ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-4 py-3">
                <p className="font-bold text-amber-100">
                  Click the habitat to place{" "}
                  {getItemById(data.items, selectedInventoryItem)?.name}.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedInventoryItem("")}
                  className="rounded-xl bg-black/40 px-4 py-2 font-black text-white"
                >
                  Cancel Placement
                </button>
              </div>
            ) : null}
          </section>

          <aside className="space-y-4">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Score" value={`${scores.finalScore}/100`} />
                <StatCard label="Items" value={placedItems.length} />
                <StatCard label="Comfort" value={scores.comfort} />
                <StatCard label="Safety" value={scores.safety} />
                <StatCard label="Happy" value={scores.happiness} />
                <StatCard label="Fun" value={scores.fun} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={finishHome}
                  className="rounded-xl bg-amber-300 px-4 py-3 font-black text-black transition hover:bg-amber-200"
                >
                  Finish Home
                </button>
                <button
                  type="button"
                  onClick={resetHome}
                  className="rounded-xl bg-white/10 px-4 py-3 font-black transition hover:bg-white/15"
                >
                  Reset Home
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <h2 className="text-xl font-black">Required Items</h2>
              <div className="mt-3 grid gap-2">
                {data.requiredItems.map((id) => {
                  const item = getItemById(data.items, id);
                  const done = !requiredRemaining.includes(id);
                  return (
                    <div
                      key={id}
                      className={[
                        "flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-bold",
                        done
                          ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
                          : "border-white/10 bg-black/25 text-slate-200",
                      ].join(" ")}
                    >
                      <span>{item?.name ?? id}</span>
                      <span aria-label={done ? "completed" : "missing"}>
                        {done ? "🐾" : "Needed"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {selectedPlaced ? (
              <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-4">
                <h2 className="text-xl font-black">
                  {getItemById(data.items, selectedPlaced.itemId)?.name}
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateSelectedItem({ rotation: selectedPlaced.rotation - 15 })
                    }
                    className="rounded-xl bg-black/35 px-3 py-2 font-black"
                  >
                    Rotate Left
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateSelectedItem({ rotation: selectedPlaced.rotation + 15 })
                    }
                    className="rounded-xl bg-black/35 px-3 py-2 font-black"
                  >
                    Rotate Right
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateSelectedItem({ zIndex: selectedPlaced.zIndex + 1 })
                    }
                    className="rounded-xl bg-black/35 px-3 py-2 font-black"
                  >
                    Forward
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateSelectedItem({
                        zIndex: Math.max(1, selectedPlaced.zIndex - 1),
                      })
                    }
                    className="rounded-xl bg-black/35 px-3 py-2 font-black"
                  >
                    Backward
                  </button>
                  <button
                    type="button"
                    onClick={deleteSelectedItem}
                    className="col-span-2 rounded-xl bg-red-500 px-3 py-2 font-black text-white"
                  >
                    Delete
                  </button>
                </div>
              </section>
            ) : null}

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <h2 className="text-xl font-black">Inventory</h2>
              <div className="mt-3 grid max-h-[560px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1">
                {sortedItems.map((item) => {
                  const alreadyPlaced = !canPlaceAnother(item);
                  const selected = selectedInventoryItem === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      draggable={!alreadyPlaced}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", item.id);
                      }}
                      onClick={() => {
                        if (alreadyPlaced) {
                          setMessage(`${item.name} is already in Dauda’s home.`);
                          return;
                        }
                        setSelectedInventoryItem(selected ? "" : item.id);
                        setSelectedPlacedItem("");
                      }}
                      disabled={alreadyPlaced}
                      className={[
                        "grid grid-cols-[76px_1fr] gap-3 rounded-2xl border p-3 text-left transition",
                        selected
                          ? "border-amber-300 bg-amber-300/15"
                          : "border-white/10 bg-black/25 hover:bg-white/10",
                        alreadyPlaced ? "cursor-not-allowed opacity-45" : "",
                      ].join(" ")}
                    >
                      <div className="rounded-xl bg-white/10 p-2">
                        <ItemVisual type={item.type} compact />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-white">{item.name}</p>
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.15em] text-amber-100">
                            {item.category}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-300">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {validationErrors.length ? (
              <section className="rounded-[2rem] border border-red-400/25 bg-red-500/10 p-4">
                <h2 className="text-lg font-black text-red-100">Needs Fixing</h2>
                <ul className="mt-2 space-y-1 text-sm font-semibold text-red-100">
                  {validationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </aside>
        </div>
      </div>

      {gameCompleted ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <motion.section
            initial={reducedMotion ? false : { scale: 0.94, opacity: 0 }}
            animate={reducedMotion ? {} : { scale: 1, opacity: 1 }}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-amber-300/25 bg-gradient-to-br from-zinc-950 via-amber-950/30 to-black p-6 shadow-2xl shadow-black"
          >
            <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-300">
              Habitat Complete
            </p>
            <h2 className="mt-3 text-4xl font-black">{rank.title}</h2>
            <p className="mt-3 text-lg text-slate-200">{rank.message}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <StatCard label="Final score" value={`${scores.finalScore}/100`} />
              <StatCard label="Happiness" value={scores.happiness} />
              <StatCard label="Comfort" value={scores.comfort} />
              <StatCard label="Safety" value={scores.safety} />
              <StatCard label="Fun" value={scores.fun} />
              <StatCard label="Items used" value={placedItems.length} />
              <StatCard
                label="Optional"
                value={
                  placedItems.filter(
                    (placed) =>
                      getItemById(data.items, placed.itemId)?.category === "optional",
                  ).length
                }
              />
              <StatCard label="Best" value={`${Math.max(bestScore, scores.finalScore)}/100`} />
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-4">
              <div className="relative aspect-[16/8] rounded-xl bg-gradient-to-b from-amber-950/60 to-black">
                <motion.div
                  animate={reducedMotion ? {} : { x: ["10%", "76%", "42%", "10%"] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute bottom-[18%] w-16"
                >
                  <SafeImage
                    src={DAUDA_IMAGE}
                    alt="Dauda exploring the finished home"
                    fallback="🐹"
                    className="aspect-square w-full rounded-full object-cover shadow-[0_0_30px_rgba(251,191,36,0.45)]"
                  />
                </motion.div>
                <p className="absolute bottom-4 left-4 rounded-xl bg-black/50 px-4 py-2 font-black text-amber-100">
                  Saved habitat preview
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetHome}
                className="rounded-xl bg-white px-5 py-3 font-black text-black"
              >
                Rebuild Home
              </button>
              <button
                type="button"
                onClick={() => setGameCompleted(false)}
                className="rounded-xl bg-amber-300 px-5 py-3 font-black text-black"
              >
                Continue Decorating
              </button>
              <Link
                href="/profile/dauda"
                className="rounded-xl bg-white/10 px-5 py-3 font-black text-white"
              >
                Back to Dauda Games
              </Link>
            </div>
          </motion.section>
        </div>
      ) : null}
    </main>
  );
}
