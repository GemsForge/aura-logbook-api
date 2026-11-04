const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_EDGE = 2400;

/**
 * Converts a browser-decodable photo into a smaller JPEG before upload.
 * Large phone originals are downsampled and recompressed to fit the API's 10 MB limit.
 */
export async function prepareMoodPhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  const image = bitmap ?? (await loadImageElement(file));
  const sourceWidth = bitmap?.width ?? image.width;
  const sourceHeight = bitmap?.height ?? image.height;
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(sourceWidth, sourceHeight));
  let width = Math.max(1, Math.round(sourceWidth * scale));
  let height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap?.close();
    throw new Error("This browser cannot prepare the selected image.");
  }

  // Re-encode even smaller files so HEIC/HEIF sources become a supported JPEG when decodable.
  let result: Blob | null = null;
  try {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      canvas.width = width;
      canvas.height = height;
      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap ?? image, 0, 0, width, height);
      result = await canvasToJpeg(canvas, 0.86 - attempt * 0.08);
      if (result.size <= MAX_UPLOAD_BYTES) break;
      width = Math.max(1, Math.round(width * 0.78));
      height = Math.max(1, Math.round(height * 0.78));
    }
  } finally {
    bitmap?.close();
  }

  if (!result || result.size > MAX_UPLOAD_BYTES) {
    throw new Error("This image is still too large after compression. Choose a smaller photo.");
  }
  const name = file.name.replace(/\.[^.]+$/, "") || "mood-photo";
  return new File([result], `${name}.jpg`, { type: "image/jpeg", lastModified: file.lastModified });
}

/** Loads image formats that the browser supports when ImageBitmap decoding is unavailable. */
function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This browser cannot read this image format. Export it as JPEG or PNG and try again."));
    };
    image.src = url;
  });
}

/** Encodes canvas content as JPEG and rejects if the browser cannot create an image blob. */
function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("This browser could not compress the selected image."));
    }, "image/jpeg", Math.max(0.35, quality));
  });
}
