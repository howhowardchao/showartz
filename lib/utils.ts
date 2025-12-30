/**
 * 判斷是否為本地上傳的圖片
 * 用於決定是否需要禁用 Next.js Image 組件的優化功能
 */
export function isLocalUploadImage(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.startsWith('/uploads/');
}

/**
 * 判斷是否為外部圖片（需要禁用優化）
 * 包括本地上傳的圖片和可能優化失敗的外部圖片
 * 
 * 注意：由於 Next.js Image 優化 API 在生產環境中對外部圖片可能返回 400 錯誤，
 * 我們對所有外部圖片（http/https 開頭）都禁用優化，確保圖片能正常顯示
 */
export function shouldDisableImageOptimization(url: string | undefined | null): boolean {
  if (!url) return false;
  
  // 本地上傳的圖片
  if (url.startsWith('/uploads/')) {
    return true;
  }
  
  // 外部圖片（Pinkoi、Instagram 等）禁用優化以避免 400 錯誤
  // 雖然會失去優化帶來的好處，但能確保圖片正常顯示
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true;
  }
  
  return false;
}

