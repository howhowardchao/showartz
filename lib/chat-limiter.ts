// 聊天限時和冷卻管理系統

interface IPState {
  conversationStartTime: number | null; // 對話開始時間（毫秒）
  cooldownEndTime: number | null; // 冷卻結束時間（毫秒）
}

// 內存存儲（生產環境建議使用 Redis）
const ipStates = new Map<string, IPState>();

// 清理過期的 IP 狀態（每 10 分鐘清理一次）
setInterval(() => {
  const now = Date.now();
  for (const [ip, state] of ipStates.entries()) {
    // 如果冷卻期已過且沒有進行中的對話，移除記錄
    if (
      state.cooldownEndTime &&
      state.cooldownEndTime < now &&
      (!state.conversationStartTime || state.conversationStartTime + 180000 < now)
    ) {
      ipStates.delete(ip);
    }
  }
}, 10 * 60 * 1000); // 10 分鐘

const CONVERSATION_LIMIT_MS = 180 * 1000; // 180 秒
const COOLDOWN_MS = 300 * 1000; // 300 秒（5 分鐘）

/**
 * 獲取客戶端 IP 地址
 */
export function getClientIP(request: Request): string {
  // 嘗試從各種 header 中獲取 IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare

  if (forwarded) {
    // x-forwarded-for 可能包含多個 IP，取第一個
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP.trim();
  }
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  // 如果都沒有，返回默認值（這種情況在生產環境中不應該發生）
  return 'unknown';
}

/**
 * 檢查 IP 是否可以開始新對話
 */
export function canStartConversation(ip: string): { allowed: boolean; reason?: string } {
  const state = ipStates.get(ip);
  const now = Date.now();

  // 如果 IP 不存在，可以開始
  if (!state) {
    return { allowed: true };
  }

  // 檢查是否在冷卻期
  if (state.cooldownEndTime && state.cooldownEndTime > now) {
    const remainingSeconds = Math.ceil((state.cooldownEndTime - now) / 1000);
    return {
      allowed: false,
      reason: 'cooldown',
    };
  }

  // 檢查是否有進行中的對話且未超時
  if (state.conversationStartTime) {
    const elapsed = now - state.conversationStartTime;
    if (elapsed < CONVERSATION_LIMIT_MS) {
      // 對話仍在進行中
      return { allowed: true };
    } else {
      // 對話已超時，進入冷卻期
      state.conversationStartTime = null;
      state.cooldownEndTime = now + COOLDOWN_MS;
      return {
        allowed: false,
        reason: 'timeout',
      };
    }
  }

  // 可以開始新對話
  return { allowed: true };
}

/**
 * 開始新對話（記錄開始時間）
 */
export function startConversation(ip: string): void {
  const state = ipStates.get(ip) || { conversationStartTime: null, cooldownEndTime: null };
  state.conversationStartTime = Date.now();
  state.cooldownEndTime = null; // 清除之前的冷卻期
  ipStates.set(ip, state);
}

/**
 * 檢查對話是否仍在時間限制內
 */
export function isConversationActive(ip: string): { active: boolean; reason?: string } {
  const state = ipStates.get(ip);
  if (!state || !state.conversationStartTime) {
    return { active: false, reason: 'no_conversation' };
  }

  const now = Date.now();
  const elapsed = now - state.conversationStartTime;

  if (elapsed >= CONVERSATION_LIMIT_MS) {
    // 對話已超時，進入冷卻期
    state.conversationStartTime = null;
    state.cooldownEndTime = now + COOLDOWN_MS;
    return {
      active: false,
      reason: 'timeout',
    };
  }

  return { active: true };
}

/**
 * 結束對話並進入冷卻期
 */
export function endConversation(ip: string): void {
  const state = ipStates.get(ip);
  if (state) {
    state.conversationStartTime = null;
    state.cooldownEndTime = Date.now() + COOLDOWN_MS;
  }
}

/**
 * 獲取冷卻期剩餘時間（秒）
 */
export function getCooldownRemaining(ip: string): number | null {
  const state = ipStates.get(ip);
  if (!state || !state.cooldownEndTime) {
    return null;
  }

  const now = Date.now();
  const remaining = state.cooldownEndTime - now;
  return remaining > 0 ? Math.ceil(remaining / 1000) : null;
}

