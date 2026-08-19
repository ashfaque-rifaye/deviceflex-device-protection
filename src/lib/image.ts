// Client-side photo prep for the Damage Assessment Agent.
//
// A modern phone camera produces 3–8 MB per shot; base64 inflates that by a third, and
// three of them would blow straight past the provider's 10 MB request ceiling. Downscaling
// to 1024px costs nothing in assessment quality — cracks are still plainly visible — and
// keeps a three-photo claim at roughly 300 KB.

const MAX_EDGE = 1024;
const QUALITY = 0.82;

/** Read a File into a downscaled JPEG data URI. */
export async function toDataUrl(file: File): Promise<string> {
  const bitmap = await loadBitmap(file);

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser");
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, w, h);
  if ("close" in bitmap) bitmap.close();

  return canvas.toDataURL("image/jpeg", QUALITY);
}

/** createImageBitmap where available, <img> everywhere else. */
async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to the <img> path */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("That file could not be read as an image"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
