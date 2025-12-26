export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // 如果是外部 URL（http/https），使用代理
  if (src.startsWith('http://') || src.startsWith('https://')) {
    const params = new URLSearchParams({
      url: src,
      w: width.toString(),
      q: (quality || 75).toString(),
    });
    return `/api/image-proxy?${params.toString()}`;
  }
  
  // 本地圖片直接返回
  return src;
}

