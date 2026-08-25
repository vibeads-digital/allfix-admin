function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

function drawToBlob(img: HTMLImageElement, width: number, height: number, quality: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  // White background first — converting a transparent PNG to JPEG would
  // otherwise render transparent areas as black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))), "image/jpeg", quality);
  });
}

// Re-encodes as JPEG, stepping quality down and then dimensions down until
// the result fits under maxSizeBytes (or we run out of room to shrink further).
export async function compressImage(file: File, maxSizeBytes: number): Promise<File> {
  const img = await loadImage(file);
  let width = img.naturalWidth;
  let height = img.naturalHeight;

  let quality = 0.9;
  let blob = await drawToBlob(img, width, height, quality);

  while (blob.size > maxSizeBytes && quality > 0.2) {
    quality -= 0.1;
    blob = await drawToBlob(img, width, height, quality);
  }

  while (blob.size > maxSizeBytes && (width > 320 || height > 320)) {
    width = Math.round(width * 0.85);
    height = Math.round(height * 0.85);
    blob = await drawToBlob(img, width, height, quality);
  }

  const name = file.name.replace(/\.\w+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}
