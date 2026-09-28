// Solo para el navegador. Achica las fotos antes de subirlas: una foto de celular
// pesa 3–8 MB y Vercel corta el body en 4.5 MB; a 1280px sobra para el catálogo
// y además baja lo que se le manda a Gemini y lo que se guarda en la base.

const MAX_SIZE = 1280;
const JPEG_QUALITY = 0.85;

export type EncodedImage = { data: string; mimeType: string };

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function encodeAsJpeg(source: Blob, maxSize: number): Promise<Blob> {
  // createImageBitmap respeta la orientación EXIF, así las fotos no quedan de costado.
  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  // JPEG no tiene transparencia: se pinta blanco abajo para que un PNG con
  // fondo transparente no quede negro.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo comprimir"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

// Si el navegador no puede decodificar el formato (ej. algún HEIC), se usa el
// archivo original para no bloquear la carga.
export async function compressImage(source: Blob, maxSize = MAX_SIZE): Promise<EncodedImage> {
  try {
    const jpeg = await encodeAsJpeg(source, maxSize);
    if (jpeg.size < source.size || source.type !== "image/jpeg") {
      return { data: await blobToBase64(jpeg), mimeType: "image/jpeg" };
    }
  } catch (err) {
    console.warn("compressImage:", err);
  }
  return { data: await blobToBase64(source), mimeType: source.type || "image/jpeg" };
}

export async function compressBase64Image(data: string, mimeType: string): Promise<EncodedImage> {
  const blob = await fetch(`data:${mimeType};base64,${data}`).then((r) => r.blob());
  return compressImage(blob);
}
