// 업로드 전에 이미지를 브라우저에서 줄여(리사이즈+압축) 용량을 크게 낮춘다.
// 폰 카메라 원본(3~5MB)을 대략 200~500KB 수준으로 → 업로드·로딩 속도 대폭 개선.
// 실패하거나 이미지가 아니면 원본을 그대로 반환(안전).

const DEFAULT_MAX_DIM = 1600; // 긴 변 최대 px
const DEFAULT_QUALITY = 0.8;  // JPEG 품질

export async function compressImage(
  file: File,
  maxDim: number = DEFAULT_MAX_DIM,
  quality: number = DEFAULT_QUALITY,
): Promise<File> {
  if (typeof window === 'undefined') return file;
  if (!file.type.startsWith('image/')) return file;
  // GIF(움짤)/SVG는 건드리지 않음.
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

  try {
    const bitmap = await loadBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    // 이미 충분히 작고 용량도 작으면 원본 유지.
    if (scale === 1 && file.size < 900 * 1024) {
      close(bitmap);
      return file;
    }

    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) { close(bitmap); return file; }
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    close(bitmap);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
    );
    if (!blob) return file;
    // 압축 결과가 원본보다 크면 원본 유지.
    if (blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file); } catch { /* fall through */ }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load fail')); };
    img.src = url;
  });
}

function close(b: ImageBitmap | HTMLImageElement) {
  if ('close' in b && typeof b.close === 'function') b.close();
}
