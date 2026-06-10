/**
 * Utilitários de imagem — compressão via Canvas API
 * Seguro para localStorage (mantém arquivo pequeno).
 */

/**
 * Comprime uma imagem para base64 JPEG.
 * @param file  Arquivo selecionado pelo usuário
 * @param maxPx Lado máximo em px (default 320)
 * @param q     Qualidade JPEG 0–1 (default 0.78)
 */
export function compressImage(
  file: File,
  maxPx = 320,
  q = 0.78,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas não suportado")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", q));
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Imagem inválida")); };
    img.src = url;
  });
}

/**
 * Comprime para um logo retangular (largura fixa, altura proporcional).
 */
export function compressLogo(file: File): Promise<string> {
  return compressImage(file, 400, 0.85);
}

/** Dispara o seletor de arquivo e retorna o File selecionado. */
export function pickFile(accept = "image/*"): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type   = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}
