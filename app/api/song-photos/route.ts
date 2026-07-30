import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

export async function GET() {
  const photosDirectory = path.join(process.cwd(), "public", "images", "bb");

  try {
    const entries = await readdir(photosDirectory, { withFileTypes: true });
    const photos = entries
      .filter(
        (entry) =>
          entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()),
      )
      .map((entry) => `/images/bb/${encodeURIComponent(entry.name)}`)
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

    return NextResponse.json(
      { photos },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json({ photos: [] });
  }
}
