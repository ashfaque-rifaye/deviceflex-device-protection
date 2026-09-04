// Client-side photo and video prep for the Damage Assessment Agent.
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

  const url = drawDownscaled(bitmap as CanvasImageSource, bitmap.width, bitmap.height);
  if ("close" in bitmap) bitmap.close();
  return url;
}

/** Draw any decoded source onto a canvas at no more than MAX_EDGE, as a JPEG data URI. */
function drawDownscaled(source: CanvasImageSource, width: number, height: number): string {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser");
  ctx.drawImage(source, 0, 0, w, h);

  return canvas.toDataURL("image/jpeg", QUALITY);
}

/**
 * Pull evenly-spaced stills out of a video, so a member can film the damage
 * instead of framing three separate photographs.
 *
 * The vision model reads images, not video, and a claim-length clip is far too
 * large to send anyway — so the frames are captured here and the video itself
 * never leaves the device. Frames are sampled at interior points rather than at
 * 0 and the final frame, which on a hand-held clip are usually the blurred
 * moments of raising and lowering the phone.
 */
export async function framesFromVideo(file: File, count: number): Promise<string[]> {
  if (count < 1) return [];
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  try {
    await once(video, "loadeddata", "That video couldn't be read in this browser");

    // A clip straight off MediaRecorder can report Infinity until it is fully
    // buffered. Seeking is then meaningless, so take a single opening frame.
    const duration = video.duration;
    const seekable = Number.isFinite(duration) && duration > 0;
    const times = seekable
      ? Array.from({ length: count }, (_, i) => (duration * (i + 1)) / (count + 1))
      : [0];

    const frames: string[] = [];
    for (const t of times) {
      if (seekable) {
        video.currentTime = t;
        await once(video, "seeked", "That video couldn't be read in this browser");
      }
      frames.push(drawDownscaled(video, video.videoWidth, video.videoHeight));
    }
    return frames;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

/** Resolve on the next occurrence of `event`, rejecting on error or after 15s. */
function once(video: HTMLVideoElement, event: string, message: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const done = () => {
      clearTimeout(timer);
      video.removeEventListener(event, done);
      video.removeEventListener("error", fail);
      resolve();
    };
    const fail = () => {
      clearTimeout(timer);
      video.removeEventListener(event, done);
      video.removeEventListener("error", fail);
      reject(new Error(message));
    };
    const timer = setTimeout(fail, 15000);
    video.addEventListener(event, done, { once: true });
    video.addEventListener("error", fail, { once: true });
  });
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
